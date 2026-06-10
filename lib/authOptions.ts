import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { supabaseAdmin, supabasePublic } from "@/lib/supabase"
import { otpVerificationLimiter } from "@/lib/rate-limit"

const SESSION_MAX_AGE_SECONDS = 7 * 24 * 60 * 60

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

        if (!phone || !otp || !/^\+91\d{10}$/.test(phone) || !/^\d{6}$/.test(otp)) {
          return null
        }

        const forwardedFor = request?.headers?.["x-forwarded-for"]
        const ip = Array.isArray(forwardedFor)
          ? forwardedFor[0]
          : String(forwardedFor || "unknown").split(",")[0].trim()
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
          return null
        }

        const { data, error } = await supabasePublic.auth.verifyOtp({
          phone,
          token: otp,
          type: "sms",
        })

        if (error || !data.user) return null

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
      }
      return token
    },
    async session({ session, token }) {
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
  debug: false,
}
