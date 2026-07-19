"use client"

import { useState, useEffect } from "react"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen bg-warm-ivory-gradient">
      {/* No navbar in auth pages - clean, focused experience */}
      {children}
    </div>
  )
}