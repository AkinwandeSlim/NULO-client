"use client"

import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { useTheme } from "@/contexts/ThemeContext"
import { PublicHeader } from "@/components/navigation/PublicHeader"
import { MarketplaceHeader } from "@/components/navigation/MarketplaceHeader"
import { ReactNode } from "react"

function PublicLayoutContent({ children }: { children: ReactNode }) {
  const pathname = usePathname()
  const { theme, toggleTheme } = useTheme()

  // The landing page ("/") has its own layout with hero section
  // It will render the header itself
  const isLanding = pathname === "/"

  // The marketplace pages get their own dedicated header
  const isMarketplace = pathname?.startsWith("/properties")

  if (isLanding) {
    return <>{children}</>
  }

  if (isMarketplace) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-slate-900"}`}>
        <main className="pt-0">{children}</main>
      </div>
    )
  }

  // All other public pages get the shared header
  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black text-white" : "bg-white text-slate-900"}`}>
      <PublicHeader theme={theme} toggleTheme={toggleTheme} />

      {/* Main Content with padding to account for sticky header */}
      <main className="pt-0">{children}</main>
    </div>
  )
}

export default function PublicLayout({
  children,
}: {
  children: ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <PublicLayoutContent>{children}</PublicLayoutContent>
  )
}
