import type { Metadata, Viewport } from "next"
import { IBM_Plex_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { TerminalShell } from "@/components/terminal/shell"
import "./globals.css"

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "BETAGEN // INDIA MARKETS",
  description: "Bloomberg-class terminal for Indian securities. Power users only.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${plexMono.variable} bg-background`}>
      <body className="font-mono antialiased bg-black text-[var(--color-amber)]">
        <TerminalShell>{children}</TerminalShell>
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  )
}
