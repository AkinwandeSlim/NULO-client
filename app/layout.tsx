"use client"

import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { Suspense, useEffect, useState } from "react"
import { Toaster } from "sonner"
import { AuthProvider } from "@/contexts/AuthContext"
import { ThemeProvider } from "@/contexts/ThemeContext"
import { DashboardProvider } from "@/contexts/DashboardContext"
import { PropertiesProvider } from "@/contexts/PropertiesContext"
import { NotificationProvider } from "@/contexts/NotificationContext"
import LicenseCheckWrapper from "@/components/auth/LicenseCheckWrapper"
import { initializeLoggerConfig } from "@/lib/logger-config"
import { metadata } from "./metadata"
import "./globals.css"
import "mapbox-gl/dist/mapbox-gl.css"

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Initialize logger configuration to suppress verbose logs
  useEffect(() => {
    initializeLoggerConfig()
  }, [])

  // Suppress harmless Supabase locks.ts AbortError
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const isAbortError =
        event.reason?.name === 'AbortError' ||
        event.reason?.message?.includes('signal is aborted');

      if (isAbortError) {
        event.preventDefault();
      }
    };

    window.addEventListener('unhandledrejection', handler);
    return () => window.removeEventListener('unhandledrejection', handler);
  }, []);

  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        {/* ⚡ Prevent theme flash: apply dark class BEFORE React hydrates */}
        <script dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var theme = localStorage.getItem('theme');
                var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                if (theme === 'dark' || (!theme && prefersDark)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch(e) {}
            })();
          `
        }} />
        <style dangerouslySetInnerHTML={{
          __html: `
            body {
              background-color: #000000 !important;
            }
            html.dark body {
              background-color: #000000 !important;
            }
            html:not(.dark) body {
              background-color: #1e293b !important;
            }
          `
        }} />
      </head>
      <body className="font-sans antialiased has-navbar">
        <ThemeProvider>
          <AuthProvider>
            <NotificationProvider>
              <DashboardProvider
                cacheConfig={{
                  dashboardStats: 5 * 60 * 1000,    // 5 minutes
                  recentActivity: 5 * 60 * 1000,    // 5 minutes
                  recentSignups: 10 * 60 * 1000,    // 10 minutes
                  maxEntries: 50,
                  cleanupInterval: 1 * 60 * 1000,
                }}
              >
          <PropertiesProvider
            cacheConfig={{
              listings: 5 * 60 * 1000,        // 5 min
              searchResults: 3 * 60 * 1000,   // 3 min
              mapData: 10 * 60 * 1000,        // 10 min
              maxEntries: 100,
              cleanupInterval: 60 * 1000
            }}
          >
            <LicenseCheckWrapper>
              <Suspense fallback={null}>{children}</Suspense>
            </LicenseCheckWrapper>
            <Analytics />
            <Toaster
              position="bottom-right"
              richColors
              closeButton
              expand={false}
              visibleToasts={3}
            />
          </PropertiesProvider>
          </DashboardProvider>
            </NotificationProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}















