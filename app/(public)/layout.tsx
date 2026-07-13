"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/navigation/Navbar"
import { ThemeProvider } from "@/contexts/ThemeContext"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // ✅ The landing page ("/") ships its own dark sticky header + footer
  // (see app/(public)/page.tsx). Render it bare — no shared Navbar, no
  // light warm-ivory wrapper, no top padding — so the dark full-bleed
  // hero can sit flush against the viewport top.
  const isLanding = pathname === "/"

  if (isLanding) {
    return <ThemeProvider>{children}</ThemeProvider>
  }

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-warm-ivory-gradient">
        {/* ✅ Clean: Navbar as separate component */}
        <Navbar />

        {/* Main Content - Adjusted Padding */}
        <main className="pt-[7.5rem] sm:pt-20">{children}</main>
      </div>
    </ThemeProvider>
  )
}
