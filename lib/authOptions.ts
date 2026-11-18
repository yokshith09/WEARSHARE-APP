import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "@/lib/supabase"
import { otpVerificationLimiter } from "@/lib/rate-limit"
import { randomUUID } from "crypto"
import bcrypt from "bcryptjs"
import { isActiveSession, releaseActiveSession, setActiveSession } from "@/lib/redis"
import { recordSecurityEvent } from "@/lib/security-events"
import { sendEmail, wearShareEmailShell } from "@/lib/resend-email"

const SESSION_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
const SESSION_ABSOLUTE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60
const SESSION_ROTATION_SECONDS = 15 * 60

const isLocalIp = (ip: string) => !ip || ip === "unknown" || ip === "127.0.0.1" || ip === "::1" || ip === "localhost"

export const authOptions: NextAuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  useSecureCookies: process.env.NODE_ENV === "production",
  providers: [
    ...(process.env.GOOGLE_ID && process.env.GOOGLE_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_ID,
            clientSecret: process.env.GOOGLE_SECRET,
            allowDangerousEmailAccountLinking: true,
          }),
        ]
      : []),
    CredentialsProvider({
      id: "email-password",
      name: "Email and password",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        name: { label: "Name", type: "text" },
        mode: { label: "Mode", type: "text" },
      },
      async authorize(credentials, request) {
        const email = String(credentials?.email || "").trim().toLowerCase()
        const password = String(credentials?.password || "")
        const rawName = String(credentials?.name || "").trim()
        const mode = String(credentials?.mode || "login")
        const forwardedFor = request?.headers?.["x-forwarded-for"]
        const ip = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : String(forwardedFor || "unknown").split(",")[0].trim()
        const userAgent = String(request?.headers?.["user-agent"] || "unknown")

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || password.length < 8) {
          await recordSecurityEvent({
            eventType: "auth.password.invalid_input",
            severity: "info",
            ip,
            userAgent,
          })
          throw new Error("Please enter a valid email address and a password of at least 8 characters.")
        }

        try {
          await otpVerificationLimiter.check(15, `password-auth:${email}`)
          if (!isLocalIp(ip)) {
            await otpVerificationLimiter.check(45, `password-auth:ip:${ip}`)
          }
        } catch {
          await recordSecurityEvent({
            eventType: "auth.password.locked",
            severity: "warning",
            ip,
            userAgent,
          })
          throw new Error("Too many sign-in attempts. Please wait a few minutes before trying again.")
        }

        const { data: existingUser, error: lookupError } = await supabaseAdmin
          .from("users")
          .select("id,name,email,password_hash")
          .eq("email", email)
          .maybeSingle()

        if (lookupError) {
          console.error("[auth] supabase user lookup error:", lookupError)
          throw new Error("Database temporarily busy. Please retry in a moment.")
        }

        if (mode === "register") {
          if (existingUser?.password_hash) {
            console.warn("[auth] user already exists with password_hash for:", email)
            throw new Error("An account with this email already exists. Please sign in instead.")
          }

          const userId = existingUser?.id || randomUUID()
          const userName = rawName || existingUser?.name || email.split("@")[0]
          const passwordHash = await bcrypt.hash(password, 10)

          if (existingUser) {
            const { error: updateError } = await supabaseAdmin
              .from("users")
              .update({
                name: userName,
                password_hash: passwordHash,
                is_verified: true,
                email_verified: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              })
              .eq("id", existingUser.id)

            if (updateError) {
              console.error("[auth] user update error:", updateError)
              throw new Error("Could not update credentials. Please try again.")
            }
          } else {
            const { error: insertError } = await supabaseAdmin
              .from("users")
              .insert({
                id: userId,
                email,
                name: userName,
                password_hash: passwordHash,
                is_verified: true,
                email_verified: new Date().toISOString(),
              })

            if (insertError) {
              console.error("[auth] user insert error:", insertError)
              throw new Error("Failed to create account. Please try again.")
            }
          }

          await Promise.all([
            otpVerificationLimiter.reset(`password-auth:${email}`),
            otpVerificationLimiter.reset(`password-auth:ip:${ip}`),
          ])

          return { id: userId, name: userName, email }
        }

        if (!existingUser) {
          throw new Error("No account found with this email. Click 'Create account' to sign up.")
        }

        if (!existingUser.password_hash) {
          await recordSecurityEvent({
            eventType: "auth.password.missing_hash",
            severity: "info",
            ip,
            userAgent,
          })
          throw new Error("No password set for this account. Please use 'Create account' to set a password or use Google sign-in.")
        }

        const matches = await bcrypt.compare(password, existingUser.password_hash)
        if (!matches) {
          await recordSecurityEvent({
            eventType: "auth.password.failed",
            severity: "info",
            ip,
            userAgent,
          })
          throw new Error("Incorrect password. Please verify your password or use 'Forgot password?'.")
        }

        await Promise.all([
          otpVerificationLimiter.reset(`password-auth:${email}`),
          otpVerificationLimiter.reset(`password-auth:ip:${ip}`),
        ])

        return {
          id: existingUser.id,
          name: existingUser.name || email.split("@")[0],
          email,
        }
      },
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
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  jwt: {
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        if (account?.provider === "google" && user.email) {
          const { data: dbUser } = await supabaseAdmin
            .from("users")
            .select("id")
            .eq("email", user.email.toLowerCase().trim())
            .maybeSingle()
          token.id = dbUser?.id || user.id
        } else {
          token.id = user.id
        }
        token.email = (user as any).email
        token.name = user.name
        token.picture = user.image
        token.sessionId = randomUUID()
        token.rotationId = randomUUID()
        token.authenticatedAt = Math.floor(Date.now() / 1000)
        token.rotatedAt = token.authenticatedAt
        token.sessionRevoked = false

        await setActiveSession(
          String(token.id),
          String(token.sessionId),
          SESSION_ABSOLUTE_MAX_AGE_SECONDS
        )
        return token
      }

      if (!token.id) {
        token.sessionRevoked = true
        return token
      }

      const now = Math.floor(Date.now() / 1000)
      if (token.authenticatedAt && token.sessionId) {
        const absoluteExpiry = Number(token.authenticatedAt) + SESSION_ABSOLUTE_MAX_AGE_SECONDS
        const active = now < absoluteExpiry &&
          await isActiveSession(String(token.id), String(token.sessionId))

        if (!active) {
          token.sessionRevoked = true
          token.id = undefined
          return token
        }
      }

      if (token.rotatedAt && now - Number(token.rotatedAt || 0) >= SESSION_ROTATION_SECONDS) {
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
      }
      return session
    }
  },
  pages: {
    signIn: '/login',
  },
  events: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user?.email) {
        const email = user.email.toLowerCase().trim()
        const { data: existingUser } = await supabaseAdmin
          .from("users")
          .select("id")
          .eq("email", email)
          .maybeSingle()

        const userId = existingUser?.id || randomUUID()

        await supabaseAdmin
          .from("users")
          .upsert({
            id: userId,
            name: user.name || email.split("@")[0],
            email,
            image: user.image || null,
            email_verified: new Date().toISOString(),
            is_verified: true,
          }, { onConflict: "id" })
      }

      const isUUID = (val: any) => typeof val === "string" && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(val)
      const actorId = isUUID(user?.id) ? user.id : null

      await recordSecurityEvent({
        eventType: "auth.sign_in.succeeded",
        actorId,
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
