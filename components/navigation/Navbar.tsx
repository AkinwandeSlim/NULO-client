"use client"

import { useState, useEffect, useMemo, useCallback } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Building2, LayoutGrid, User, LogOut, Search, ChevronDown, Bell, Settings, MessageSquare, Heart, Calendar, Info, BookOpen, Phone, FileText } from "lucide-react"
import { Logo } from "@/components/logo"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/contexts/AuthContext"
import { NotificationBell } from "@/components/notifications/NotificationBell"
import { toast } from "sonner"

export function Navbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // ✅ REMOVED: No search bar in navbar - search is now only in dedicated sections
  const showSearchBar = false
  
  // ✅ UPDATED: Show navigation links on all public pages including properties and new pages
  const showNavLinks = pathname === '/' || pathname?.startsWith('/properties') || pathname === '/about' || pathname === '/blog' || pathname === '/contact' || pathname === '/help' || pathname === '/privacy' || pathname === '/terms' ||
    pathname?.startsWith('/admin') || pathname?.startsWith('/landlord') || pathname?.startsWith('/tenant')
  
  // ✅ NEW: Check if user is on dashboard
  const isDashboard = pathname?.startsWith('/admin') || pathname?.startsWith('/landlord') || pathname?.startsWith('/tenant')
  
  // Use real Supabase auth - ✅ FIXED: Use userProfile instead of profile
  const { user, userProfile, loading, signOut } = useAuth()
  const isAuthenticated = !!user
  
  // Debug: Log user data to understand structure (disabled in production)
  useEffect(() => {
    if (user && process.env.NODE_ENV === 'development') {
      // Only log in development with verbose flag
      if (process.env.NEXT_PUBLIC_VERBOSE_LOGS === 'true') {
        console.log('🔍 [NAVBAR] User object:', user)
        console.log('🔍 [NAVBAR] UserProfile object:', userProfile)
        console.log('🔍 [NAVBAR] DisplayUser object:', userProfile || user)
      }
    }
  }, [user, userProfile])
  
  // Use user data - user object from AuthContext contains all needed info
  const displayUser = user || null
  
  // ✅ OPTIMIZED: Extract user type once
  const userType = useMemo(() => user?.user_type || 'tenant', [user?.user_type])
  
  // ✅ OPTIMIZED: Get user type label
  const userTypeLabel = useMemo(() => {
    if (userType === 'admin') return 'Administrator'
    if (userType === 'landlord') return 'Property Manager'
    if (userType === 'tenant') return 'Tenant'
    return 'User'
  }, [userType])
  
  // ✅ OPTIMIZED: Get user initials
  const userInitials = useMemo(() => {
    const fullName = user?.full_name
    if (fullName) {
      return fullName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }, [user?.full_name, user?.email])
  
  // ✅ FIXED: Stable avatar logic - always use initials as primary, avatar as fallback
  const getAvatarDisplay = useMemo(() => {
    // Always use initials as the primary display
    const initials = userInitials
    
    // Only use avatar URL if it exists and is valid
    const hasValidAvatar = user?.avatar_url && 
      (user?.avatar_url.startsWith('http') || user?.avatar_url.startsWith('/'))
    
    return {
      initials,
      showAvatar: hasValidAvatar,
      avatarUrl: hasValidAvatar ? user?.avatar_url : null
    }
  }, [userInitials, user?.avatar_url])
  
  // ✅ OPTIMIZED: Get dashboard URL
  const dashboardUrl = useMemo(() => {
    if (userType === 'admin') return '/admin'
    if (userType === 'landlord') return '/landlord/overview'
    return '/tenant'
  }, [userType])
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Read search query from URL params
  useEffect(() => {
    const locationParam = searchParams?.get('location')
    if (locationParam) {
      setSearchQuery(locationParam)
    }
  }, [searchParams])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Auto-close mobile menu on desktop resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // ✅ OPTIMIZED: Memoize logout handler
  const handleLogout = useCallback(() => {
    try {
      console.log('👋 [NAVBAR] Signing out...');
      // Don't await - let signOut handle the redirect immediately
      signOut().catch((error) => {
        console.error('❌ [NAVBAR] Logout error:', error);
        // Force redirect even on error
        window.location.href = '/';
      });
    } catch (error) {
      console.error('❌ [NAVBAR] Logout error:', error);
      window.location.href = '/';
    }
  }, [signOut])

  // ✅ OPTIMIZED: Memoize isActive and search handler
  const isActive = useCallback((path: string, isPrefix?: boolean) => {
    // Special handling for profile pages
    if (path === 'profile') {
      return pathname?.includes('/profile')
    }
    
    if (isPrefix) {
      return pathname === path || pathname?.startsWith(path + '/')
    }
    return pathname === path
  }, [pathname])

  const handleSearch = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/properties?location=${encodeURIComponent(searchQuery)}`)
    }
  }, [searchQuery, router])

  return (
    <nav className={`fixed top-0 z-50 w-full transition-all duration-300 ${
      scrolled 
        ? 'bg-white/95 backdrop-blur-md shadow-lg border-b border-slate-200' 
        : 'bg-white/98 backdrop-blur-lg border-b border-slate-100 shadow-sm'
    }`}>
      <div className="max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Navigation Row */}
        <div className="flex h-14 sm:h-16 items-center justify-between gap-3">
          {/* Logo - Complete with text included */}
          <Link href="/" className="flex items-center group flex-shrink-0">
            <Logo size={40} className="transition-transform group-hover:scale-105" />
          </Link>

          {/* Desktop Navigation Links */}
          {showNavLinks && (
            <div className="hidden md:flex items-center gap-1 flex-1 max-w-2xl">
              {isDashboard && isAuthenticated ? (
                /* ── Dashboard mode: show role-specific section links ── */
                <>
                  <Link
                    href={dashboardUrl}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                      pathname === dashboardUrl || (pathname === '/tenant' && userType === 'tenant') || (pathname === '/landlord/overview' && userType === 'landlord')
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <LayoutGrid className="h-4 w-4" />
                    Overview
                  </Link>

                  {userType === 'landlord' && (
                    <>
                      <Link href="/landlord/properties"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/landlord/properties', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Building2 className="h-4 w-4" />
                        Properties
                      </Link>
                      <Link href="/landlord/viewings"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/landlord/viewings', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Calendar className="h-4 w-4" />
                        Viewings
                      </Link>
                      <Link href="/landlord/applications"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/landlord/applications', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <User className="h-4 w-4" />
                        Applications
                      </Link>
                      <Link href="/landlord/occupied-properties"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/landlord/occupied-properties', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Home className="h-4 w-4" />
                        Occupied
                      </Link>
                      <Link href="/landlord/agreements"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/landlord/agreements', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <FileText className="h-4 w-4" />
                        Agreements
                      </Link>
                      <Link href="/landlord/messages"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/landlord/messages', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </Link>
                      <Link href="/landlord/profile"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('profile') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </>
                  )}

                  {userType === 'tenant' && (
                    <>
                      <Link href="/tenant/active-rent"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/tenant/active-rent', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Home className="h-4 w-4" />
                        My Rent
                      </Link>
                      <Link href="/properties"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/properties', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Search className="h-4 w-4" />
                        Browse
                      </Link>
                      <Link href="/tenant/viewings"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/tenant/viewings', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Calendar className="h-4 w-4" />
                        Viewings
                      </Link>
                      <Link href="/tenant/applications"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/tenant/applications', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <User className="h-4 w-4" />
                        Applications
                      </Link>
                      <Link href="/tenant/agreements"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/tenant/agreements', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <FileText className="h-4 w-4" />
                        Agreements
                      </Link>
                      <Link href="/messages"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/messages', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <MessageSquare className="h-4 w-4" />
                        Messages
                      </Link>
                      <Link href="/tenant/profile"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('profile') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </>
                  )}

                  {userType === 'admin' && (
                    <>
                      <Link href="/admin/users"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/admin/users', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <User className="h-4 w-4" />
                        Users
                      </Link>
                      <Link href="/admin/properties"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('/admin/properties', true) ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <Building2 className="h-4 w-4" />
                        Properties
                      </Link>
                      <Link href="/admin/profile"
                        className={`px-4 py-2 text-sm font-medium rounded-lg transition-all flex items-center gap-2 ${
                          isActive('profile') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}>
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </>
                  )}
                </>
              ) : (
                /* ── Public mode: marketing links ── */
                <>
                  <Link
                    href="/"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/')
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Home className="h-4 w-4" />
                      Home
                    </div>
                  </Link>
                  <Link
                    href="/properties"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/properties', true)
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Marketplace
                    </div>
                  </Link>
                  <Link
                    href="/about"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/about')
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Info className="h-4 w-4" />
                      About
                    </div>
                  </Link>
                  <Link
                    href="/contact"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/contact')
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Contact
                    </div>
                  </Link>
                  <Link
                    href="/blog"
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                      isActive('/blog')
                        ? 'text-orange-600 bg-orange-50'
                        : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      Blog
                    </div>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* ✅ FIXED: Desktop Center Search Bar (Only on Properties Page) */}
          {showSearchBar && (
            <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md lg:max-w-2xl mx-4">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Search location or property..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-10 pr-4 border-slate-300 focus:border-orange-500 focus:ring-orange-500/20 text-sm"
                />
              </div>
            </form>
          )}

          {/* Right Actions - Desktop */}
          <div className="hidden md:flex items-center gap-2 flex-shrink-0">
            {!mounted || loading ? (
              <div className="h-9 w-32 bg-slate-100 animate-pulse rounded-lg" />
            ) : isAuthenticated ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
                {/* Profile Dropdown Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                      <Avatar className="h-8 w-8 border-2 border-slate-200">
                        {getAvatarDisplay.showAvatar && getAvatarDisplay.avatarUrl ? (
                          <AvatarImage 
                            src={getAvatarDisplay.avatarUrl} 
                            alt="Profile"
                            onError={(e) => {
                              // Fallback to initials if avatar fails to load
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                            }}
                          />
                        ) : null}
                        <AvatarFallback className="bg-orange-500 text-white text-xs font-semibold">
                          {getAvatarDisplay.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="hidden lg:block text-left">
                        <p className="text-sm font-medium text-slate-900">
                          {user?.full_name || user?.email?.split('@')[0] || user?.email || 'User'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {userTypeLabel}
                        </p>
                      </div>
                      <ChevronDown className="h-4 w-4 text-slate-500 hidden lg:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 z-[150]">
                    <DropdownMenuLabel>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold text-slate-900">
                          {user?.full_name || user?.email?.split('@')[0] || 'User'}
                        </span>
                        <span className="text-xs text-slate-500 font-normal">
                          {user?.email || 'No email'}
                        </span>
                        <span className="text-xs text-orange-600 font-medium mt-1">
                          {userTypeLabel}
                        </span>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link 
                        href={dashboardUrl}
                        className="cursor-pointer"
                      >
                        <LayoutGrid className="h-4 w-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link 
                        href={userType === 'landlord' ? '/landlord/profile' : '/tenant/profile'}
                        className="cursor-pointer"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    {userType !== 'landlord' && userType !== 'admin' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/properties" className="cursor-pointer">
                            <Home className="h-4 w-4 mr-2" />
                            Browse Properties
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/tenant/favorites" className="cursor-pointer">
                            <Heart className="h-4 w-4 mr-2" />
                            Favorites
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/tenant/applications" className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            Applications
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/tenant/agreements" className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2" />
                            Agreements
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/tenant/messages" className="cursor-pointer">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}
                    {userType === 'landlord' && (
                      <>
                        <DropdownMenuItem asChild>
                          <Link href="/landlord/properties" className="cursor-pointer">
                            <Building2 className="h-4 w-4 mr-2" />
                            My Properties
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/landlord/viewings" className="cursor-pointer">
                            <Calendar className="h-4 w-4 mr-2" />
                            Viewings
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/landlord/applications" className="cursor-pointer">
                            <User className="h-4 w-4 mr-2" />
                            Applications
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/landlord/occupied-properties" className="cursor-pointer">
                            <Home className="h-4 w-4 mr-2" />
                            Occupied Properties
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/landlord/agreements" className="cursor-pointer">
                            <FileText className="h-4 w-4 mr-2" />
                            Agreements
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href="/landlord/messages" className="cursor-pointer">
                            <MessageSquare className="h-4 w-4 mr-2" />
                            Messages
                          </Link>
                        </DropdownMenuItem>
                      </>
                    )}

                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link 
                        href={userType === 'landlord' ? '/landlord/profile' : '/tenant/profile'}
                        className="cursor-pointer"
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Settings
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  className="h-9 px-4 text-sm font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-lg"
                  asChild
                >
                  <Link href="/signin">Log In</Link>
                </Button>
                <Button
                  className="h-9 px-5 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all rounded-lg shadow-sm hover:shadow-md"
                  asChild
                >
                  <Link href="/signup">Sign Up</Link>
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden h-9 w-9 text-slate-700 hover:text-orange-600 hover:bg-orange-50"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-200 bg-white max-h-[calc(100vh-7.5rem)] overflow-y-auto">
          <div className="px-4 py-3 space-y-1">
            {/* ✅ NEW: Mobile Navigation Links */}
            {showNavLinks && (
              <>
                <Link 
                  href="/" 
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                    isActive('/') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link
                  href="/properties"
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                    isActive('/properties') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="h-4 w-4" />
                  Marketplace
                </Link>
                <Link
                  href="/about"
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                    isActive('/about') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Info className="h-4 w-4" />
                  About
                </Link>
                <Link
                  href="/contact"
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                    isActive('/contact') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Phone className="h-4 w-4" />
                  Contact
                </Link>
                <Link
                  href="/blog"
                  className={`flex items-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg transition-all ${
                    isActive('/blog') ? 'text-orange-600 bg-orange-50' : 'text-slate-700 hover:text-orange-600 hover:bg-orange-50'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <BookOpen className="h-4 w-4" />
                  Blog
                </Link>
              </>
            )}
            {/* Mobile Auth Section */}
            <div className="pt-3 mt-3 border-t border-slate-200 space-y-2">
              {!mounted || loading ? (
                <div className="h-20 bg-slate-100 animate-pulse rounded-lg" />
              ) : isAuthenticated ? (
                <>
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <Avatar className="h-10 w-10 border-2 border-slate-200">
                      {getAvatarDisplay.showAvatar && getAvatarDisplay.avatarUrl ? (
                        <AvatarImage 
                          src={getAvatarDisplay.avatarUrl} 
                          alt="Profile"
                          onError={(e) => {
                            // Fallback to initials if avatar fails to load
                            const target = e.target as HTMLImageElement
                            target.style.display = 'none'
                          }}
                        />
                      ) : null}
                      <AvatarFallback className="bg-orange-500 text-white text-sm font-semibold">
                        {getAvatarDisplay.initials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {user?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 truncate">{user?.email || ''}</p>
                      <p className="text-xs text-orange-600 font-medium mt-0.5">
                        {userTypeLabel}
                      </p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full h-10 text-sm font-medium justify-start border-slate-300 text-slate-700 hover:border-orange-500 hover:text-orange-600 rounded-lg" 
                    asChild
                  >
                    <Link 
                      href={
                        userType === 'admin' ? '/admin' : 
                        userType === 'landlord' ? '/landlord/overview' : 
                        '/tenant'
                      } 
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <LayoutGrid className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </Button>
                  {userType === 'tenant' && (
                    <Button 
                      variant="ghost"
                      className="w-full h-10 text-sm font-medium justify-start text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg" 
                      asChild
                    >
                      <Link href="/tenant/active-rent" onClick={() => setMobileMenuOpen(false)}>
                        <Home className="h-4 w-4 mr-2" />
                        My Rent
                      </Link>
                    </Button>
                  )}
                  <Button 
                    variant="ghost"
                    className="w-full h-10 text-sm font-medium justify-start text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" 
                    onClick={() => {
                      setMobileMenuOpen(false)
                      handleLogout()
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    variant="ghost" 
                    className="w-full h-10 text-sm font-medium text-slate-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg" 
                    asChild
                  >
                    <Link href="/signin" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
                  </Button>
                  <Button 
                    className="w-full h-10 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white rounded-lg shadow-sm" 
                    asChild
                  >
                    <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}