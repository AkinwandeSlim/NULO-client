import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Suspense } from "react"
import { AuthProvider } from "@/contexts/AuthContext"
import { Toaster } from "sonner"
import "./globals.css"
import "mapbox-gl/dist/mapbox-gl.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

export const metadata: Metadata = {
  title: {
    default: "NuloAfrica - Find Your Perfect Home in Africa",
    template: "%s | NuloAfrica"
  },
  description: "Discover premium properties across Africa. Modern real estate platform for finding apartments, houses, and villas in Lagos, Nairobi, Cape Town, and more.",
  keywords: ["real estate", "Africa", "properties", "apartments", "houses", "Lagos", "Abuja", "Portharcourt", "buy property", "rent property"],
  authors: [{ name: "NuloAfrica Team" }],
  creator: "NuloAfrica",
  publisher: "NuloAfrica",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    title: "NuloAfrica - Find Your Perfect Home in Africa",
    description: "Discover premium properties across Africa. Modern real estate platform for finding apartments, houses, and villas.",
    url: '/',
    siteName: 'NuloAfrica',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'NuloAfrica - Real Estate Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NuloAfrica - Find Your Perfect Home in Africa',
    description: 'Discover premium properties across Africa',
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '48x48' },
      { url: '/favicon_16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon_32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon_48x48.png', sizes: '48x48', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
  },
  manifest: '/manifest.json',
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`font-sans ${inter.variable} antialiased`}>
        <AuthProvider>
          <Suspense fallback={null}>{children}</Suspense>
          <Analytics />
          <Toaster 
            position="bottom-right" 
            richColors 
            closeButton 
            toastOptions={{
              style: {
                marginBottom: '1rem',
                marginRight: '1rem',
              },
              className: 'toast-custom',
            }}
            expand={false}
            visibleToasts={3}
          />
        </AuthProvider>
      </body>
    </html>
  )
}
