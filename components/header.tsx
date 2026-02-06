"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import { useState } from "react"
import { Logo } from "@/components/logo"

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full bg-white/98 backdrop-blur-lg border-b border-slate-100 shadow-sm">
      <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-8">
        {/* Logo - Left */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <Logo size={36} className="flex-shrink-0 transition-transform group-hover:scale-105" />
          {/* <div className="text-xl font-semibold tracking-tight">
            <span className="text-slate-900">Nulo</span>
            <span className="text-[#FF6600]">Africa</span>
          </div> */}
        </Link>

        {/* Center Navigation - Desktop */}
        <nav className="hidden lg:flex items-center gap-8">
          <Link
            href="/"
            className="relative text-[15px] font-medium text-slate-700 transition-colors hover:text-[#FF6600] group"
          >
            Home
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6600] transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/properties"
            className="relative text-[15px] font-medium text-slate-700 transition-colors hover:text-[#FF6600] group"
          >
            Rent
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6600] transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/about"
            className="relative text-[15px] font-medium text-slate-700 transition-colors hover:text-[#FF6600] group"
          >
            About
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6600] transition-all group-hover:w-full" />
          </Link>
          <Link
            href="/contact"
            className="relative text-[15px] font-medium text-slate-700 transition-colors hover:text-[#FF6600] group"
          >
            Contact
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[#FF6600] transition-all group-hover:w-full" />
          </Link>
        </nav>

        {/* Right Actions - Desktop */}
        <div className="hidden lg:flex items-center gap-3">
          <Button
            variant="ghost"
            className="h-10 px-5 text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 transition-all rounded-lg"
            asChild
          >
            <Link href="/tenant">I'm a Tenant</Link>
          </Button>
          <Button
            className="h-10 px-5 text-[15px] font-medium bg-[#FF6600] hover:bg-[#FF6600]/90 text-white transition-all rounded-lg shadow-sm hover:shadow-md"
            asChild
          >
            <Link href="/landlord">I'm a Landlord</Link>
          </Button>
        </div>

        {/* Mobile Menu Button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="lg:hidden text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5" 
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {/* Mobile Menu - Elegant Slide Down */}
      {mobileMenuOpen && (
        <div className="border-t border-slate-100 bg-white lg:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-6">
            <Link 
              href="/" 
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/properties"
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Rent
            </Link>
            <Link
              href="/about"
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              About
            </Link>
            <Link
              href="/contact"
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all"
              onClick={() => setMobileMenuOpen(false)}
            >
              Contact
            </Link>
            
            {/* Mobile CTA Buttons */}
            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-slate-100">
              <Button 
                variant="ghost" 
                className="w-full h-11 text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 rounded-lg" 
                asChild
              >
                <Link href="/tenant">I'm a Tenant</Link>
              </Button>
              <Button 
                className="w-full h-11 text-[15px] font-medium bg-[#FF6600] hover:bg-[#FF6600]/90 text-white rounded-lg shadow-sm" 
                asChild
              >
                <Link href="/landlord">I'm a Landlord</Link>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
