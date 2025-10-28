 "use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Menu, X, Home, Building2, LayoutGrid, User, LogOut, Search, ChevronDown } from "lucide-react"
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

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const searchParams = useSearchParams()
  
  // Determine if we should show search bar (properties or dashboard pages)
  const showSearchBar = pathname?.startsWith('/properties') || pathname?.startsWith('/dashboard') || pathname?.startsWith('/')
  const isHomepage = pathname === '/'
  
  // Use real Supabase auth
  const { user, profile, loading, signOut } = useAuth()
  const isAuthenticated = !!user
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true)
  }, [])

  // Read search query from URL params and update input
  useEffect(() => {
    const locationParam = searchParams.get('location')
    if (locationParam) {
      setSearchQuery(locationParam)
    }
  }, [searchParams])

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Handle logout
  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }
  
  // Get user initials for avatar
  const getUserInitials = () => {
    if (profile?.full_name) {
      return profile.full_name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
    }
    if (user?.email) {
      return user.email[0].toUpperCase()
    }
    return 'U'
  }

  const isActive = (path: string) => pathname === path

  // Handle search
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/properties?location=${encodeURIComponent(searchQuery)}`)
    }
  }

  return (
    <div className="min-h-screen bg-warm-ivory-gradient">
      {/* Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-slate-200 shadow-sm">
        <div className="max-w-[1920px] mx-auto px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between gap-4">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 group flex-shrink-0">
              <Logo size={28} className="flex-shrink-0 transition-transform group-hover:scale-105" />
              <div className="text-xl font-bold">
                <span className="text-slate-900">Nulo</span>
                <span className="text-orange-500">Africa</span>
              </div>
            </Link>

            {/* Center Search Bar - Show on properties/dashboard pages */}
            {showSearchBar && (
              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-2xl">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="Search location or property..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full h-10 pl-10 pr-4 border-slate-300 focus:border-orange-500 focus:ring-orange-500/20"
                  />
                </div>
              </form>
            )}

            {/* Right Actions - Desktop */}
            <div className="hidden md:flex items-center gap-3 flex-shrink-0">
              {!mounted || loading ? (
                <div className="h-10 w-32 bg-slate-100 animate-pulse rounded-lg" />
              ) : isAuthenticated ? (
                <>
                  {/* Authenticated State - User Dropdown Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 transition-colors">
                        <Avatar className="h-8 w-8 border-2 border-slate-200">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-orange-500 text-white text-sm font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 z-[150]">
                      <DropdownMenuLabel>
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-slate-900">
                            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                          </span>
                          <span className="text-xs text-slate-500 font-normal">
                            {user?.email || ''}
                          </span>
                          {profile?.role && (
                            <span className="text-xs text-orange-600 font-medium capitalize mt-1">
                              {profile.role}
                            </span>
                          )}
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link href={profile?.user_type === 'landlord' ? '/landlord/overview' : '/tenant'} className="cursor-pointer">
                          <LayoutGrid className="h-4 w-4 mr-2" />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href="/properties" className="cursor-pointer">
                          <Building2 className="h-4 w-4 mr-2" />
                          Browse Properties
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
                  {/* Not Authenticated State */}
                  <Button
                    variant="ghost"
                    className="h-10 px-4 text-sm font-semibold text-slate-700 hover:text-orange-600 hover:bg-orange-50 transition-all rounded-lg"
                    asChild
                  >
                    <Link href="/signin">Sign In</Link>
                  </Button>
                  <Button
                    className="h-10 px-6 text-sm font-semibold bg-orange-500 hover:bg-orange-600 text-white transition-all rounded-lg shadow-sm hover:shadow-md"
                    asChild
                  >
                    <Link href="/signup">Get Started</Link>
                  </Button>
                </>
              )}
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

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="border-t border-stone-200 bg-white lg:hidden">
              <div className="flex flex-col gap-1 px-4 py-4">
                <Link 
                  href="/" 
                  className={`text-sm font-medium px-4 py-3 rounded-lg transition-all ${
                    isActive('/') 
                      ? 'text-[#FF6600] bg-[#FF6600]/5' 
                      : 'text-stone-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Home
                </Link>
                <Link
                  href="/properties"
                  className={`text-sm font-medium px-4 py-3 rounded-lg transition-all ${
                    isActive('/properties') 
                      ? 'text-[#FF6600] bg-[#FF6600]/5' 
                      : 'text-stone-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Rent
                </Link>
                <Link
                  href="/about"
                  className={`text-sm font-medium px-4 py-3 rounded-lg transition-all ${
                    isActive('/about') 
                      ? 'text-[#FF6600] bg-[#FF6600]/5' 
                      : 'text-stone-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  About
                </Link>
                <Link
                  href="/contact"
                  className={`text-sm font-medium px-4 py-3 rounded-lg transition-all ${
                    isActive('/contact') 
                      ? 'text-[#FF6600] bg-[#FF6600]/5' 
                      : 'text-stone-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5'
                  }`}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Contact
                </Link>
                
                {/* Mobile Actions */}
                <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-stone-200">
                  {!mounted || loading ? (
                    <div className="h-20 bg-slate-100 animate-pulse rounded-lg" />
                  ) : isAuthenticated ? (
                    <>
                      {/* Authenticated Mobile */}
                      <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-lg mb-2">
                        <Avatar className="h-10 w-10 border-2 border-stone-200">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-[#FF6600] text-white text-sm font-semibold">
                            {getUserInitials()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-stone-900">
                            {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                          </p>
                          <p className="text-xs text-stone-500">{user?.email || ''}</p>
                          {profile?.role && (
                            <p className="text-xs text-[#FF6600] font-medium capitalize mt-0.5">
                              {profile.role}
                            </p>
                          )}
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        className="w-full h-10 text-sm font-medium border-stone-300 text-stone-700 hover:border-[#FF6600] hover:text-[#FF6600] rounded-lg" 
                        asChild
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Link href={profile?.user_type === 'landlord' ? '/landlord/overview' : '/tenant'}>
                          Dashboard
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost"
                        className="w-full h-10 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg" 
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
                      {/* Not Authenticated Mobile */}
                      <Button 
                        variant="ghost" 
                        className="w-full h-10 text-sm font-medium text-stone-600 hover:text-[#FF6600] hover:bg-[#FF6600]/5 rounded-lg" 
                        asChild
                      >
                        <Link href="/signin">Sign In</Link>
                      </Button>
                      <Button 
                        className="w-full h-10 text-sm font-medium bg-[#FF6600] hover:bg-[#FF6600]/90 text-white rounded-lg shadow-sm" 
                        asChild
                      >
                        <Link href="/signup">Get Started</Link>
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Main Content with Smooth Transition */}
      <main className="pt-20">{children}</main>
    </div>
  )
}
