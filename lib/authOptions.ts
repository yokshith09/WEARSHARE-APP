import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@next-auth/supabase-adapter"
import { supabaseAdmin, supabasePublic } from "@/lib/supabase"
import { otpVerificationLimiter } from "@/lib/rate-limit"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { isActiveSession, releaseActiveSession, setActiveSession } from "@/lib/redis"
import { recordSecurityEvent } from "@/lib/security-events"
import { sendEmail, wearShareEmailShell } from "@/lib/resend-email"

const SESSION_MAX_AGE_SECONDS = 24 * 60 * 60
const SESSION_ABSOLUTE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60
const SESSION_ROTATION_SECONDS = 15 * 60

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID || "",
      clientSecret: process.env.GOOGLE_SECRET || "",
    }),
    CredentialsProvider({
      id: "msg91-otp",
      name: "OTP",
      credentials: {
        phone: { label: "Phone Number", type: "text", placeholder: "+91..." },
        otp: { label: "OTP", type: "text" }
      },
      async authorize(credentials, request) {
        const phone = credentials?.phone?.replace(/\s/g, "")
        const otp = credentials?.otp
        const forwardedFor = request?.headers?.["x-forwarded-for"]
        const ip = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : String(forwardedFor || "unknown").split(",")[0].trim()
        const userAgent = String(request?.headers?.["user-agent"] || "unknown")

        if (!phone || !otp || !/^\+91\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) {
          await recordSecurityEvent({
            eventType: "auth.otp.invalid_input",
            severity: "info",
            ip,
            userAgent,
          })
          return null
        }

        const configuredMaxAttempts = Number(process.env.OTP_VERIFY_MAX_ATTEMPTS || 5)
        const maxAttempts = Number.isInteger(configuredMaxAttempts) && configuredMaxAttempts > 0
          ? Math.min(configuredMaxAttempts, 20)
          : 5
        const phoneLimitKey = `otp-verify:phone:${phone}`
        const ipLimitKey = `otp-verify:ip:${ip}`

        try {
          await otpVerificationLimiter.check(maxAttempts, phoneLimitKey)
          await otpVerificationLimiter.check(maxAttempts * 3, ipLimitKey)
        } catch {
          await recordSecurityEvent({
            eventType: "auth.otp.verification_locked",
            severity: "warning",
            ip,
            userAgent,
          })
          return null
        }

        const { data, error } = await supabasePublic.auth.verifyOtp({
          phone,
          token: otp,
          type: "sms",
        })

        if (error || !data.user) {
          await recordSecurityEvent({
            eventType: "auth.otp.verification_failed",
            severity: "info",
            ip,
            userAgent,
          })
          return null
        }

        await Promise.all([
          otpVerificationLimiter.reset(phoneLimitKey),
          otpVerificationLimiter.reset(ipLimitKey),
        ])

        await supabaseAdmin
          .from("users")
          .upsert({
            id: data.user.id,
            phone,
            name: data.user.user_metadata?.name || "Phone User",
            is_verified: true,
          }, { onConflict: "id" })

        return {
          id: data.user.id,
          name: data.user.user_metadata?.name || "Phone User",
          phone,
        }
      }
    }),
    CredentialsProvider({
      id: "email-otp",
      name: "Email OTP",
      credentials: {
        email: { label: "Email", type: "email" },
        otp: { label: "OTP", type: "text" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "").trim().toLowerCase()
        const otp = String(credentials?.otp || "").trim()
        const forwardedFor = request?.headers?.["x-forwarded-for"]
        const ip = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : String(forwardedFor || "unknown").split(",")[0].trim()
        const userAgent = String(request?.headers?.["user-agent"] || "unknown")

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || !/^\d{6}$/.test(otp)) {
          await recordSecurityEvent({
            eventType: "auth.email_otp.invalid_input",
            severity: "info",
            ip,
            userAgent,
          })
          return null
        }

        try {
          await otpVerificationLimiter.check(5, `email-otp-verify:${email}`)
          await otpVerificationLimiter.check(20, `email-otp-verify:ip:${ip}`)
        } catch {
          await recordSecurityEvent({
            eventType: "auth.email_otp.verification_locked",
            severity: "warning",
            ip,
            userAgent,
          })
          return null
        }

        const { data: rows, error } = await supabaseAdmin
          .from("email_otps")
          .select("id,email,otp_hash,expires_at,used_at")
          .eq("email", email)
          .is("used_at", null)
          .order("created_at", { ascending: false })
          .limit(1)

        const row = rows?.[0]
        if (error || !row || new Date(row.expires_at).getTime() < Date.now()) {
          await recordSecurityEvent({
            eventType: "auth.email_otp.verification_failed",
            severity: "info",
            ip,
            userAgent,
          })
          return null
        }

        const matches = await bcrypt.compare(otp, row.otp_hash)
        if (!matches) {
          await recordSecurityEvent({
            eventType: "auth.email_otp.verification_failed",
            severity: "info",
            ip,
            userAgent,
          })
          return null
        }

        await supabaseAdmin
          .from("email_otps")
          .update({ used_at: new Date().toISOString() })
          .eq("id", row.id)

        await otpVerificationLimiter.reset(`email-otp-verify:${email}`)
        await otpVerificationLimiter.reset(`email-otp-verify:ip:${ip}`)

        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id,name,email")
          .eq("email", email)
          .maybeSingle()

        const userId = existingUser?.id || randomUUID()
        const name = existingUser?.name || email.split("@")[0]

        await supabaseAdmin
          .from("users")
          .upsert({
            id: userId,
            email,
            name,
            email_verified: new Date().toISOString(),
            is_verified: true,
          }, { onConflict: "id" })

        await sendEmail(
          email,
          "Welcome to WearShare",
          wearShareEmailShell(`
            <h2 style="font-size:22px;margin:0 0 12px">Welcome to WearShare</h2>
            <p>Thanks for joining. You can now rent and list outfits securely.</p>
          `)
        ).catch(() => null)

        return {
          id: userId,
          name,
          email,
        }
      }
    })
  ],
  adapter: SupabaseAdapter({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    secret: process.env.SUPABASE_SERVICE_ROLE_KEY || "",
  }) as any, // Cast to any to avoid complex TS types with SupabaseAdapter if it mismatch
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.phone = (user as any).phone
        token.email = (user as any).email
        token.sessionId = randomUUID()
        token.rotationId = randomUUID()
        token.authenticatedAt = Math.floor(Date.now() / 1000)
        token.rotatedAt = token.authenticatedAt
        token.sessionRevoked = false

        await setActiveSession(
          String(user.id),
          String(token.sessionId),
          SESSION_ABSOLUTE_MAX_AGE_SECONDS
        )
        return token
      }

      if (!token.id || !token.sessionId || !token.authenticatedAt) {
        token.sessionRevoked = true
        return token
      }

      const now = Math.floor(Date.now() / 1000)
      const absoluteExpiry = Number(token.authenticatedAt) + SESSION_ABSOLUTE_MAX_AGE_SECONDS
      const active = now < absoluteExpiry &&
        await isActiveSession(String(token.id), String(token.sessionId))

      if (!active) {
        token.sessionRevoked = true
        token.id = undefined
        token.phone = undefined
        return token
      }

      if (now - Number(token.rotatedAt || 0) >= SESSION_ROTATION_SECONDS) {
        token.rotationId = randomUUID()
        token.rotatedAt = now
      }

      return token
    },
    async session({ session, token }) {
      if (token.sessionRevoked || !token.id) {
        ;(session as any).user = undefined
        ;(session as any).revoked = true
        session.expires = new Date(0).toISOString()
        return session
      }

      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).phone = token.phone;
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.id) {
        await supabaseAdmin
          .from("users")
          .upsert({
            id: user.id,
            name: user.name,
            email: user.email,
            image: user.image,
            email_verified: new Date().toISOString(),
            is_verified: true,
          }, { onConflict: "id" })
      }

      await recordSecurityEvent({
        eventType: "auth.sign_in.succeeded",
        actorId: user.id,
        metadata: { provider: account?.provider || "unknown" },
      })
    },
    async signOut(message) {
      const token = "token" in message ? message.token : null
      if (token?.id && token?.sessionId) {
        await releaseActiveSession(String(token.id), String(token.sessionId))
      }
      await recordSecurityEvent({
        eventType: "auth.sign_out",
        actorId: token?.id ? String(token.id) : null,
      })
    },
  },
  logger: {
    error(code, metadata) {
      console.error("[next-auth]", code, metadata)
      void recordSecurityEvent({
        eventType: "auth.internal_error",
        severity: "critical",
        metadata: { code },
      })
    },
    warn(code) {
      console.warn("[next-auth]", code)
    },
  },
  debug: false,
}
