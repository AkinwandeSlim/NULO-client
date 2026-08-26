"use client"

/**
 * MarketplaceHeader - Dedicated header for the rental marketplace
 * Layout inspired by Lofty.ai:
 * Row 1: Logo | Search Bar (center, prominent) | Account Menu
 * Row 2: Property Type Filters | Advanced Filters Button (opens modal) | View Mode Toggles
 */

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import {
  X,
  LayoutGrid,
  User,
  LogOut,
  Sliders,
  Search,
  Home,
  Building2,
  Building,
  Store,
  List,
  MapPin,
  Menu,
  ChevronDown,
  Sparkles,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import MarqueeTicker from "@/components/MarqueeTicker"
import { TICKER_DATA } from "@/data/content"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "@/contexts/ThemeContext"

const CONTAINER = "mx-auto w-full max-w-[1400px] px-4 sm:px-6 lg:px-8"

const cx = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ")

const PROPERTY_TYPES = [
  { label: "All Properties", value: "all", icon: Home },
  { label: "Apartment", value: "apartment", icon: Building2 },
  { label: "House", value: "house", icon: Home },
  { label: "Duplex", value: "duplex", icon: Building },
  { label: "Studio", value: "studio", icon: Building2 },
  { label: "Commercial", value: "commercial", icon: Store },
]

interface MarketplaceHeaderProps {
  onSearchChange?: (query: string) => void
  searchQuery?: string
  viewMode?: 'grid' | 'list' | 'split' | 'map'
  onViewModeChange?: (mode: 'grid' | 'list' | 'split' | 'map') => void
  propertyType?: string
  onPropertyTypeChange?: (type: string) => void
  onOpenFiltersModal?: () => void
  propertiesCount?: number
  hideSecondRow?: boolean
}

export function MarketplaceHeader({ 
  onSearchChange,
  searchQuery = "",
  viewMode = "split",
  onViewModeChange,
  propertyType = "all",
  onPropertyTypeChange,
  onOpenFiltersModal,
  propertiesCount = 0,
  hideSecondRow = false
}: MarketplaceHeaderProps) {
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  
  const router = useRouter()
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()

  const isAuthenticated = !!user
  const userType = user?.user_type

  // Prevent hydration mismatch by only rendering auth UI after mount
  useEffect(() => {
    setMounted(true)
  }, [])

  const userInitials = user?.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || "U"

  const dashboardUrl =
    userType === "admin"
      ? "/admin"
      : userType === "landlord"
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

  // Open the PropFlow AI assistant. The floating widget is mounted by the
  // (public) layout and listens for this event — dispatching without a
  // workflow_id simply reveals it with the user's existing conversation
  // (or the guest welcome message). Same mechanism as the dashboard
  // "Continue in PropFlow" banners.
  const openAiSearch = () => {
    window.dispatchEvent(new CustomEvent("propflow:open"))
  }

  // Sticky header scroll effect
  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  return (
    <div className="sticky top-0 z-50 bg-white dark:bg-black">

      {/* ── Marquee Ticker (housing data stats) ─────────────────────────── */}
      <div className={`w-full border-b border-orange-500/20 backdrop-blur-sm ${theme === "dark" ? "bg-black/60" : "bg-white/80"}`}>
        <MarqueeTicker items={TICKER_DATA} speed={40} theme={theme} />
      </div>

      {/* ROW 1: Logo | Search Bar | Account */}
      <div className="border-b border-slate-200 dark:border-white/10">
        <div className={cx(CONTAINER, "flex items-center justify-between py-3")}>
          
          {/* Logo */}
          <Link href="/" className="flex-shrink-0">
            <div className="h-8 w-auto">
              <Logo size={40} variant={theme === "dark" ? "light" : "default"} />
            </div>
          </Link>

          {/* Center - Search Bar + AI Search (prominent, takes most space) */}
          <div className="flex-1 max-w-2xl mx-4 hidden md:flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Search address or city..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-xl text-base border-2 transition-all focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
              />
            </div>
            {/* AI Search — labeled entry point into the PropFlow assistant.
                The corner bubble reads as "support chat", so search intent is
                converted here instead; the bubble remains for resuming an
                ongoing conversation. Tooltip teaches on hover (desktop only). */}
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={openAiSearch}
                  aria-label="AI Search — describe your ideal home and NEST AI finds matches"
                  className="flex-shrink-0 inline-flex items-center gap-1.5 px-4 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-sm hover:shadow-md transition-all"
                >
                  <Sparkles className="h-4 w-4" />
                  AI Search
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" align="end" className="max-w-[240px] p-3">
                {/* Three-part structure: hook → example → outcome, each on its
                    own line so the tooltip scans at a glance instead of reading
                    as one run-on sentence. */}
                <span className="block text-center font-semibold">Skip the filters — just describe it</span>
                <span className="mt-1.5 block text-center italic opacity-90">“3-bed in Wuse under ₦7m/yr”</span>
                <span className="mt-1.5 block border-t border-white/15 pt-1.5 text-center opacity-80">
                  NEST AI searches verified listings and finds your matches
                </span>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Right - Theme Toggle + Account Menu */}
          <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10 text-slate-900 dark:text-white/90"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            {!mounted ? (
              // Show loading state during hydration to prevent mismatch
              <div className="h-10 w-24 bg-slate-100 dark:bg-white/5 rounded-lg animate-pulse" />
            ) : isAuthenticated ? (
              <>
                <NotificationBell />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-slate-100 dark:hover:bg-white/10">
                      <Avatar className="h-8 w-8 border-2 border-orange-500/30">
                        <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium leading-tight text-slate-900 dark:text-white">
                          {user?.full_name || user?.email?.split('@')[0] || 'User'}
                        </p>
                        <p className="text-xs leading-tight mt-0.5 text-slate-500 dark:text-white/60">
                          {userType === 'admin' ? 'Administrator' : userType === 'landlord' ? 'Property Manager' : 'Tenant'}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 hidden lg:block transition-transform text-slate-500 dark:text-white/60" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 z-[150] rounded-lg border shadow-xl border-slate-200 dark:border-white/10 bg-white dark:bg-black">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900 dark:text-white">
                          {user?.full_name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-xs font-normal text-slate-500 dark:text-white/50">
                          {user?.email || 'No email'}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
                    <DropdownMenuItem asChild>
                      <Link href={dashboardUrl} className="cursor-pointer flex items-center gap-2.5 text-slate-700 dark:text-white/90 focus:bg-slate-50 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">
                        <LayoutGrid className="h-4 w-4 text-orange-400" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={userType === 'landlord' ? '/landlord/profile' : '/tenant/profile'} className="cursor-pointer flex items-center gap-2.5 text-slate-700 dark:text-white/90 focus:bg-slate-50 dark:focus:bg-white/5 focus:text-slate-900 dark:focus:text-white">
                        <User className="h-4 w-4 text-orange-400" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-slate-100 dark:bg-white/10" />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer flex items-center gap-2.5 text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link href="/signin">
                <Button className="rounded-lg border border-orange-500 bg-orange-500 text-black font-semibold transition-all duration-200 hover:bg-orange-400 hover:border-orange-400 hover:shadow-lg hover:shadow-orange-500/25 px-6 py-2 text-sm">
                  Sign In
                </Button>
              </Link>
            )}

            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`md:hidden p-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search (shown on mobile only) */}
        <div className="md:hidden px-4 pb-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 dark:text-white/40" />
              <input
                type="text"
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                className="w-full pl-10 pr-4 py-2 rounded-lg text-sm border transition-colors focus:border-orange-500 focus:outline-none border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/30"
              />
            </div>
            {/* No hover on touch — the visible label is the teaching surface */}
            <button
              type="button"
              onClick={openAiSearch}
              aria-label="AI Search — describe your ideal home and NEST AI finds matches"
              className="flex-shrink-0 inline-flex items-center gap-1 px-3 py-2 rounded-lg text-xs font-semibold text-white bg-gradient-to-r from-orange-500 to-orange-600 active:from-orange-600 active:to-orange-700 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI
            </button>
          </div>
        </div>
      </div>

      {/* ROW 2: Property Types | Filters Button | View Modes */}
      {!hideSecondRow && (
        <div className="bg-white dark:bg-black">
          <div className={cx(CONTAINER, "py-3")}>
            <div className="flex items-center justify-between gap-4 overflow-x-auto scrollbar-hide">
              
              {/* Left - Property type filters */}
              <div className="flex items-center gap-2 flex-shrink-0">
                {PROPERTY_TYPES.map((type) => {
                  const Icon = type.icon
                  return (
                    <button
                      key={type.value}
                      onClick={() => onPropertyTypeChange?.(type.value)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        propertyType === type.value
                          ? 'bg-orange-500 text-white'
                          : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{type.label}</span>
                    </button>
                  )
                })}
              </div>

              {/* Right - Filters & View Modes */}
              <div className="flex items-center gap-3 flex-shrink-0">
                
                {/* Properties count */}
                <span className="text-sm font-medium hidden md:inline text-slate-600 dark:text-white/60">
                  {propertiesCount} properties available
                </span>

                {/* Advanced Filters button - opens modal */}
                <button
                  onClick={onOpenFiltersModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors border text-slate-700 dark:text-white/90 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
                >
                  <Sliders className="h-4 w-4" />
                  <span>Filters</span>
                </button>

                {/* View mode toggles */}
                <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-100 dark:bg-white/5">
                  <button
                    onClick={() => onViewModeChange?.('split')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'split'
                        ? 'bg-orange-500 text-white'
                        : "text-slate-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
                    }`}
                    title="Split View"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange?.('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-orange-500 text-white'
                        : "text-slate-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
                    }`}
                    title="Grid View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange?.('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-orange-500 text-white'
                        : "text-slate-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
                    }`}
                    title="List View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => onViewModeChange?.('map')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'map'
                        ? 'bg-orange-500 text-white'
                        : "text-slate-600 dark:text-white/70 hover:bg-white dark:hover:bg-white/10"
                    }`}
                    title="Full Map View"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mobile menu (if needed) */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-white/10 bg-white dark:bg-black">
          <div className={cx(CONTAINER, "py-4")}>
            {/* Mobile property types */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              {PROPERTY_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <button
                    key={type.value}
                    onClick={() => {
                      onPropertyTypeChange?.(type.value)
                      setMobileMenuOpen(false)
                    }}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      propertyType === type.value
                        ? 'bg-orange-500 text-white'
                        : "text-slate-600 dark:text-white/70 hover:bg-slate-100 dark:hover:bg-white/10"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {type.label}
                  </button>
                )
              })}
            </div>

            {/* Mobile filters button */}
            <button
              onClick={() => {
                onOpenFiltersModal?.()
                setMobileMenuOpen(false)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-colors border text-slate-700 dark:text-white/90 border-slate-200 dark:border-white/10 hover:bg-slate-100 dark:hover:bg-white/10"
            >
              <Sliders className="h-4 w-4" />
              Advanced Filters
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
