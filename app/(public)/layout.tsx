"use client"

import { Navbar } from "@/components/navigation/Navbar"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-warm-ivory-gradient">
      {/* ✅ Clean: Navbar as separate component */}
      <Navbar />
      
      {/* Main Content - Adjusted Padding */}

        <main className="pt-[7.5rem] sm:pt-20">{children}</main>

    
    
    
    </div>
  )
}




