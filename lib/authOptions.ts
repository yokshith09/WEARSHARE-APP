import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import { SupabaseAdapter } from "@auth/supabase-adapter"
import { supabaseAdmin, supabasePublic } from "@/lib/supabase"

export const authOptions: NextAuthOptions = {
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
      async authorize(credentials) {
        const phone = credentials?.phone?.replace(/\s/g, "")
        const otp = credentials?.otp

        if (!phone || !otp) return null

        const { data, error } = await supabasePublic.auth.verifyOtp({
          phone,
          token: otp,
          type: "sms",
        })

        if (error || !data.user) return null

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
    strategy: "jwt"
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
  }
}
