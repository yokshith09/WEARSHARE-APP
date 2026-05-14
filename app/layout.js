import './globals.css'
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { SessionProvider } from "@/components/session-provider";

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
    <html lang="en">
      <body className="min-h-screen flex flex-col font-sans antialiased">
        <SessionProvider>
          <SiteHeader />
          <main className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </SessionProvider>
      </body>
    </html>
  )
}
