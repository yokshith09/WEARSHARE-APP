import './globals.css'
import { Fraunces, Inter } from 'next/font/google'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SessionProvider } from "@/components/session-provider";
import { AnalyticsProvider } from "@/components/analytics-provider";
import { ChatWidget } from "@/components/chat-widget";

const fraunces = Fraunces({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
})

export const metadata = {
  title: 'WearShare - Premium Community Clothing Rentals',
  description: 'Rent premium clothing for every occasion. Share your wardrobe with your community. Sustainable peer-to-peer fashion.',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <SessionProvider>
          <AnalyticsProvider />
          <SiteHeader />
          <main className="flex-1">
            {children}
          </main>
          <SiteFooter />
          <ChatWidget />
        </SessionProvider>
      </body>
    </html>
  )
}
