"use client"

/**
 * PublicHeader - Shared header component for all public pages
 * Includes MarqueeTicker and navigation with Products/Get Started dropdowns
 */

import { useState, useEffect, useRef } from "react"
import Link from "next/link"
import { useRouter, usePathname } from "next/navigation"
import {
  Menu,
  X,
  ChevronRight,
  ChevronDown,
  TrendingUp,
  Sun,
  Moon,
  LayoutGrid,
  User,
  LogOut,
  Building2,
  Home,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import MarqueeTicker from "@/components/MarqueeTicker"
import { TICKER_DATA } from "@/data/content"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { useAuth } from "@/contexts/AuthContext"

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"
const BTN_PRIMARY =
  "rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25"
const BTN_OUTLINE =
  "rounded-lg border border-orange-500/70 bg-transparent text-orange-400 font-semibold transition-all duration-200 hover:bg-orange-500 hover:border-orange-500 hover:text-black"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

const WAITLIST_URL = "https://nest-by-nulo.vercel.app/"

const NAV_LINKS = [
  { label: "Home", href: "/" },
  { label: "Featured", href: "/#featured" },
  { label: "NEST", href: "/#nest" },
  { label: "About", href: "/about" },
  { label: "Blog", href: "/blog" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
]

const NAV_PRODUCTS = [
  { label: "Rental Marketplace", href: "/properties", description: "For Tenants" },
  { label: "Property Management", href: "/landlord", description: "For Property Managers" },
  { label: "NEST", href: WAITLIST_URL, description: "For Investors" },
]

const NAV_GET_STARTED = [
  { label: "I'm looking for a property", href: "/signup/tenant", description: "Tenant — Find & rent verified homes", icon: "home" as const },
  { label: "I'm listing properties", href: "/signup/landlord", description: "Landlord — Manage your portfolio", icon: "building" as const },
  { label: "I want to invest", href: WAITLIST_URL, description: "Investor — Co-own via NEST", icon: "trending" as const },
]

interface PublicHeaderProps {
  theme: "dark" | "light"
  toggleTheme: () => void
  showTicker?: boolean
  hideNav?: boolean
}

export function PublicHeader({ theme, toggleTheme, showTicker = true, hideNav = false }: PublicHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [productsOpen, setProductsOpen] = useState(false)
  const [getStartedOpen, setGetStartedOpen] = useState(false)
  
  const dropdownRef = useRef<HTMLDivElement>(null)
  const getStartedRef = useRef<HTMLDivElement>(null)
  
  const router = useRouter()
  const pathname = usePathname()
  const { user, signOut, loading } = useAuth()

  // Check if a nav link is active
  const isActiveLink = (href: string) => {
    if (!pathname) return false
    if (href === '/') {
      return pathname === '/'
    }
    // For hash links like /#featured, check if we're on homepage
    if (href.startsWith('/#')) {
      return pathname === '/'
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U"

  const dashboardUrl =
    user?.user_type === "admin"
      ? "/admin"
      : user?.user_type === "landlord"
      ? "/landlord/overview"
      : "/tenant"

  const handleLogout = async () => {
    try {
      await signOut()
      router.push("/signin")
    } catch (error) {
      console.error("Logout failed:", error)
    }
  }

  // Sticky header scroll effect
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProductsOpen(false)
      }
    }

    if (productsOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    if (getStartedOpen) {
      const handleClickOutsideGS = (event: MouseEvent) => {
        if (getStartedRef.current && !getStartedRef.current.contains(event.target as Node)) {
          setGetStartedOpen(false)
        }
      }
      document.addEventListener('mousedown', handleClickOutsideGS)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
        document.removeEventListener('mousedown', handleClickOutsideGS)
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [productsOpen, setProductsOpen, getStartedOpen, setGetStartedOpen])

  return (
    <div className={`sticky top-0 z-50 ${theme === "dark" ? "bg-black" : "bg-white"}`}>
      {/* Ticker */}
      {showTicker && (
        <div className={`w-full border-b border-orange-500/20 backdrop-blur-sm ${theme === "dark" ? "bg-black/60" : "bg-white/80"}`}>
          <MarqueeTicker items={TICKER_DATA} speed={40} theme={theme} />
        </div>
      )}
      
      {/* Header */}
      <header
        className={cx(
          "backdrop-blur-md transition-all duration-300",
          scrolled
            ? theme === "dark"
              ? "bg-black/95 py-3.5 md:py-4 shadow-lg shadow-black/40"
              : "bg-white/95 py-3.5 md:py-4 shadow-lg shadow-slate-200"
            : "bg-transparent py-4 md:py-6"
        )}
      >
        <div className={cx(CONTAINER, "flex items-center justify-between")}>
          <Link href="/">
            <div className="h-8 w-auto md:h-auto">
              <Logo size={50} variant={theme === "dark" ? "light" : "default"} />
            </div>
          </Link>

          {hideNav ? (
            /* ── Minimal header (detail page): toggle + auth ───────────── */
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={toggleTheme}
                className={`rounded-full p-2 transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/90 hover:bg-white/10" : "text-slate-900 hover:bg-slate-100"}`}
                aria-label="Toggle theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {loading ? (
                <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
              ) : !!user ? (
                <>
                  <NotificationBell />
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                        <Avatar className="h-8 w-8 border-2 border-orange-500/30">
                          <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className={`h-4 w-4 transition-transform ${theme === "dark" ? "text-white/60" : "text-slate-500"}`} />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className={`w-60 z-[150] rounded-lg border shadow-xl ${theme === "dark" ? "border-white/10 bg-[#0A0A0A]" : "border-slate-200 bg-white"}`}>
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {user?.full_name || user?.email?.split('@')[0] || 'User'}
                          </span>
                          <span className={`text-xs font-normal ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                            {user?.email || 'No email'}
                          </span>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                      <DropdownMenuItem asChild>
                        <Link href={dashboardUrl} className={`cursor-pointer flex items-center gap-2.5 ${theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900"}`}>
                          <LayoutGrid className="h-4 w-4 text-orange-400" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={user?.user_type === 'landlord' ? '/landlord/profile' : '/tenant/profile'} className={`cursor-pointer flex items-center gap-2.5 ${theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900"}`}>
                          <User className="h-4 w-4 text-orange-400" />
                          Profile
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                      <DropdownMenuItem onClick={handleLogout} className={`cursor-pointer flex items-center gap-2.5 text-red-500 focus:text-red-500 ${theme === "dark" ? "focus:bg-red-500/10" : "focus:bg-red-50"}`}>
                        <LogOut className="h-4 w-4" />
                        Sign Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </>
              ) : (
                <div className="flex items-center gap-3">
                  <Link href="/signin">
                    <Button className={cx(BTN_OUTLINE, "px-6 py-3 text-base font-semibold")}>
                      Login
                    </Button>
                  </Link>
                  <div className="relative" ref={getStartedRef}>
                    <button
                      type="button"
                      onClick={() => setGetStartedOpen(!getStartedOpen)}
                      className={cx(BTN_PRIMARY, "flex items-center gap-1.5 px-7 py-3 text-base font-semibold")}
                    >
                      Get Started
                      <ChevronDown className={cx("h-4 w-4 transition-transform duration-200", getStartedOpen && "rotate-180")} />
                    </button>
                    {getStartedOpen && (
                      <div className={`absolute top-full right-0 mt-2 w-72 rounded-xl border backdrop-blur-md shadow-2xl overflow-hidden ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
                        {NAV_GET_STARTED.map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={() => setGetStartedOpen(false)}
                            className={`flex items-start gap-3.5 px-4 py-3.5 transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                          >
                            <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                              {item.icon === "home" && <Home className="h-4.5 w-4.5 text-orange-400" />}
                              {item.icon === "building" && <Building2 className="h-4.5 w-4.5 text-orange-400" />}
                              {item.icon === "trending" && <TrendingUp className="h-4.5 w-4.5 text-orange-400" />}
                            </div>
                            <div className="min-w-0">
                              <div className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{item.label}</div>
                              <div className={`text-xs mt-0.5 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{item.description}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            /* ── Full header (home/public pages): nav links + toggle + auth ── */
            <>
            <nav className="hidden items-center gap-10 md:flex">
                {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className={`relative text-base font-semibold transition-colors hover:text-orange-400 ${
                  isActiveLink(l.href) 
                    ? 'text-orange-400' 
                    : theme === "dark" ? "text-white/90" : "text-slate-900"
                } ${
                  isActiveLink(l.href) 
                    ? 'after:absolute after:bottom-[-8px] after:left-0 after:right-0 after:h-[2px] after:bg-orange-400 after:rounded-full' 
                    : ''
                }`}
              >
                {l.label}
              </a>
            ))}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProductsOpen(!productsOpen)}
                className={`text-base font-semibold transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/90" : "text-slate-900"}`}
              >
                Products
                <ChevronDown className={cx("ml-1 inline h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
              </button>
              {productsOpen && (
                <div className={`absolute top-full left-0 mt-2 w-64 rounded-lg border backdrop-blur-md shadow-xl ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
                  {NAV_PRODUCTS.map((product) => (
                    <a
                      key={product.label}
                      href={product.href}
                      className={`block px-4 py-3 transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                    >
                      <div className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{product.label}</div>
                      <div className={`text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>{product.description}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={toggleTheme}
              className={`rounded-full p-2 transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/90 hover:bg-white/10" : "text-slate-900 hover:bg-slate-100"}`}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {!!user ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors ${theme === "dark" ? "hover:bg-white/10" : "hover:bg-slate-100"}`}>
                      <Avatar className="h-8 w-8 border-2 border-orange-500/30">
                        <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:block text-left">
                        <p className={`text-sm font-medium leading-tight ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                          {user?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className={`text-xs leading-tight mt-0.5 ${theme === "dark" ? "text-white/60" : "text-slate-500"}`}>
                          {user?.user_type === 'admin' ? 'Administrator' : user?.user_type === 'landlord' ? 'Property Manager' : 'Tenant'}
                        </p>
                      </div>
                      <ChevronDown className={`h-4 w-4 hidden lg:block transition-transform ${theme === "dark" ? "text-white/60" : "text-slate-500"}`} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className={`w-60 z-[150] rounded-lg border shadow-xl ${theme === "dark" ? "border-white/10 bg-[#0A0A0A]" : "border-slate-200 bg-white"}`}>
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                          {user?.full_name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className={`text-xs font-normal ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                          {user?.email || 'No email'}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                    <DropdownMenuItem asChild>
                      <Link href={dashboardUrl} className={`cursor-pointer flex items-center gap-2.5 ${theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900"}`}>
                        <LayoutGrid className="h-4 w-4 text-orange-400" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={user?.user_type === 'landlord' ? '/landlord/profile' : '/tenant/profile'} className={`cursor-pointer flex items-center gap-2.5 ${theme === "dark" ? "text-white/90 focus:bg-white/5 focus:text-white" : "text-slate-700 focus:bg-slate-50 focus:text-slate-900"}`}>
                        <User className="h-4 w-4 text-orange-400" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className={theme === "dark" ? "bg-white/10" : "bg-slate-100"} />
                    <DropdownMenuItem onClick={handleLogout} className={`cursor-pointer flex items-center gap-2.5 text-red-500 focus:text-red-500 ${theme === "dark" ? "focus:bg-red-500/10" : "focus:bg-red-50"}`}>
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : null}
          </nav>

          {!hideNav && !loading && !user && (
            <div className="hidden md:flex items-center gap-3">
              <Link href="/signin">
                <Button className={cx(BTN_OUTLINE, "px-6 py-3 text-base font-semibold")}>
                  Login
                </Button>
              </Link>
              <div className="relative" ref={getStartedRef}>
                <button
                  type="button"
                  onClick={() => setGetStartedOpen(!getStartedOpen)}
                  className={cx(BTN_PRIMARY, "flex items-center gap-1.5 px-7 py-3 text-base font-semibold")}
                >
                  Get Started
                  <ChevronDown className={cx("h-4 w-4 transition-transform duration-200", getStartedOpen && "rotate-180")} />
                </button>
                {getStartedOpen && (
                  <div className={`absolute top-full right-0 mt-2 w-72 rounded-xl border backdrop-blur-md shadow-2xl overflow-hidden ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
                    {NAV_GET_STARTED.map((item) => (
                      <a
                        key={item.label}
                        href={item.href}
                        onClick={() => setGetStartedOpen(false)}
                        className={`flex items-start gap-3.5 px-4 py-3.5 transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                      >
                        <div className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg bg-orange-500/10">
                          {item.icon === "home" && <Home className="h-4.5 w-4.5 text-orange-400" />}
                          {item.icon === "building" && <Building2 className="h-4.5 w-4.5 text-orange-400" />}
                          {item.icon === "trending" && <TrendingUp className="h-4.5 w-4.5 text-orange-400" />}
                        </div>
                        <div className="min-w-0">
                          <div className={`text-sm font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{item.label}</div>
                          <div className={`text-xs mt-0.5 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{item.description}</div>
                        </div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
            </>
          )}

          {/* mobile toggle */}
          <button
            type="button"
            aria-label="Toggle menu"
            className={`md:hidden ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* mobile dropdown */}
        {mobileOpen && (
          <div className={`border-t backdrop-blur-md md:hidden ${theme === "dark" ? "border-white/10 bg-black/95" : "border-slate-200 bg-white/95"}`}>
            <nav className={cx(CONTAINER, "flex flex-col py-4")}>
              {NAV_LINKS.map((l) => (
                <a
                  key={l.href}
                  href={l.href}
                  onClick={() => setMobileOpen(false)}
                  className={`py-2 text-sm font-medium transition-colors hover:text-orange-400 ${
                    isActiveLink(l.href)
                      ? 'text-orange-400 font-semibold'
                      : theme === "dark" ? "text-white/80" : "text-slate-700"
                  }`}
                >
                  {l.label}
                </a>
              ))}
              <div className={`border-t pt-2 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                <button
                  type="button"
                  onClick={() => setProductsOpen(!productsOpen)}
                  className={`flex w-full items-center justify-between py-2 text-sm font-medium transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}
                >
                  Products
                  <ChevronDown className={cx("h-4 w-4 transition-transform", productsOpen && "rotate-180")} />
                </button>
                {productsOpen && (
                  <div className="mt-2 space-y-1 pl-4">
                    {NAV_PRODUCTS.map((product) => (
                      <a
                        key={product.label}
                        href={product.href}
                        onClick={() => setMobileOpen(false)}
                        className={`block w-full py-2 text-left text-sm transition-colors hover:text-orange-400 ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}
                      >
                        <div className={`font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{product.label}</div>
                        <div className="text-xs">{product.description}</div>
                      </a>
                    ))}
                  </div>
                )}
              </div>
              {loading ? (
                <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
              ) : user ? (
                <>
                  <div className={`flex items-center gap-3 p-3 rounded-lg mt-2 ${theme === "dark" ? "bg-white/5" : "bg-slate-100"}`}>
                    <Avatar className="h-10 w-10 border-2 border-orange-500/30">
                      <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                        {userInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className={`text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                        {user?.user_type === 'admin' ? 'Administrator' : user?.user_type === 'landlord' ? 'Property Manager' : 'Tenant'}
                      </p>
                    </div>
                  </div>
                  <Link href={dashboardUrl} onClick={() => setMobileOpen(false)} className="mt-2">
                    <Button className={cx(BTN_PRIMARY, "w-full text-sm font-medium")}>
                      Dashboard
                    </Button>
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      handleLogout()
                      setMobileOpen(false)
                    }}
                    className="mt-2 w-full"
                  >
                    <Button className={cx(BTN_OUTLINE, "w-full text-sm font-medium")}>
                      Sign Out
                    </Button>
                  </button>
                </>
              ) : (
                <>
                  <Link href="/signin" onClick={() => setMobileOpen(false)} className="mt-2">
                    <Button className={cx(BTN_OUTLINE, "w-full text-sm font-medium")}>
                      Login
                    </Button>
                  </Link>
                  <div className={`border-t pt-2 mt-2 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                    <button
                      type="button"
                      onClick={() => setGetStartedOpen(!getStartedOpen)}
                      className={`flex w-full items-center justify-between py-2 text-sm font-semibold transition-colors ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}
                    >
                      Get Started
                      <ChevronDown className={cx("h-4 w-4 transition-transform duration-200", getStartedOpen && "rotate-180")} />
                    </button>
                    {getStartedOpen && (
                      <div className="mt-1 space-y-1 pl-0">
                        {NAV_GET_STARTED.map((item) => (
                          <a
                            key={item.label}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors ${theme === "dark" ? "hover:bg-white/5" : "hover:bg-slate-50"}`}
                          >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md bg-orange-500/10">
                              {item.icon === "home" && <Home className="h-4 w-4 text-orange-400" />}
                              {item.icon === "building" && <Building2 className="h-4 w-4 text-orange-400" />}
                              {item.icon === "trending" && <TrendingUp className="h-4 w-4 text-orange-400" />}
                            </div>
                            <div>
                              <div className={`text-sm font-medium ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{item.label}</div>
                              <div className={`text-xs ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{item.description}</div>
                            </div>
                          </a>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}
              {/* Mobile theme toggle */}
              <div className={`flex items-center justify-between border-t pt-3 mt-3 ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                <span className={`text-xs font-medium ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                  {theme === "dark" ? "Dark Mode" : "Light Mode"}
                </span>
                <button
                  type="button"
                  onClick={toggleTheme}
                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${theme === "dark" ? "text-white/80 hover:bg-white/10" : "text-slate-700 hover:bg-slate-100"}`}
                  aria-label="Toggle theme"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="h-4 w-4 text-orange-400" />
                      <span className="text-xs font-medium">Switch to Light</span>
                    </>
                  ) : (
                    <>
                      <Moon className="h-4 w-4 text-orange-500" />
                      <span className="text-xs font-medium">Switch to Dark</span>
                    </>
                  )}
                </button>
              </div>
            </nav>
          </div>
        )}
      </header>
    </div>
  )
}
