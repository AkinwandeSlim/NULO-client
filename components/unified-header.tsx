"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useAuth } from "@/contexts/AuthContext"
import { Logo } from "@/components/logo"
import {
  Menu,
  X,
  Bell,
  Search,
  LayoutDashboard,
  Heart,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Building2,
  Calendar,
  ChevronDown,
  Home,
  Plus,
} from "lucide-react"
import { useState } from "react"

interface UnifiedHeaderProps {
  showSearch?: boolean
  transparent?: boolean
}

export function UnifiedHeader({ showSearch = true, transparent = false }: UnifiedHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  const { user, profile, signOut } = useAuth()

  const userType = profile?.user_type || 'tenant'

  const handleLogout = async () => {
    try {
      await signOut()
      router.push('/')
      router.refresh()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

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

  const getDashboardHome = () => {
    if (userType === 'landlord') return '/landlord/overview'
    if (userType === 'admin') return '/admin'
    return '/tenant'
  }

  const isPropertyPage = pathname?.startsWith('/properties')
  const isDashboardPage = pathname?.startsWith('/tenant') || pathname?.startsWith('/landlord') || pathname?.startsWith('/admin')

  return (
    <header 
      className={`sticky top-0 z-50 w-full border-b transition-all ${
        transparent 
          ? 'bg-white/95 backdrop-blur-xl border-white/20 shadow-sm' 
          : 'bg-white/98 backdrop-blur-lg border-slate-100 shadow-sm'
      }`}
    >
      <div className="container mx-auto flex h-16 items-center justify-between px-4 lg:px-6">
        {/* Left: Logo + Mobile Menu */}
        <div className="flex items-center gap-4">
          {user && (
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
          
          <Link href={user ? getDashboardHome() : "/"} className="flex items-center gap-2.5 group">
            <Logo size={32} className="flex-shrink-0 transition-transform group-hover:scale-105" />
            <div className="text-xl font-semibold tracking-tight">
              <span className="text-slate-900">Nulo</span>
              <span className="text-[#FF6600]">Africa</span>
            </div>
          </Link>
        </div>

        {/* Center: Navigation or Search */}
        <div className="hidden lg:flex flex-1 max-w-2xl mx-8">
          {user && showSearch && userType !== 'landlord' ? (
            // Search bar for signed-in tenants
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search properties..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery) {
                    router.push(`/properties?search=${encodeURIComponent(searchQuery)}`)
                  }
                }}
                className="w-full h-10 pl-10 pr-4 rounded-xl border border-stone-200 bg-white/60 backdrop-blur-sm text-slate-800 placeholder:text-slate-500 focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition-all"
              />
            </div>
          ) : !user ? (
            // Public navigation
            <nav className="flex items-center justify-center gap-8">
              <Link
                href="/"
                className={`relative text-[15px] font-medium transition-colors group ${
                  pathname === '/' ? 'text-[#FF6600]' : 'text-slate-700 hover:text-[#FF6600]'
                }`}
              >
                Home
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#FF6600] transition-all ${
                  pathname === '/' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
              <Link
                href="/properties"
                className={`relative text-[15px] font-medium transition-colors group ${
                  pathname?.startsWith('/properties') ? 'text-[#FF6600]' : 'text-slate-700 hover:text-[#FF6600]'
                }`}
              >
                Rent
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#FF6600] transition-all ${
                  pathname?.startsWith('/properties') ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
              <Link
                href="/about"
                className={`relative text-[15px] font-medium transition-colors group ${
                  pathname === '/about' ? 'text-[#FF6600]' : 'text-slate-700 hover:text-[#FF6600]'
                }`}
              >
                About
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#FF6600] transition-all ${
                  pathname === '/about' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
              <Link
                href="/contact"
                className={`relative text-[15px] font-medium transition-colors group ${
                  pathname === '/contact' ? 'text-[#FF6600]' : 'text-slate-700 hover:text-[#FF6600]'
                }`}
              >
                Contact
                <span className={`absolute -bottom-1 left-0 h-0.5 bg-[#FF6600] transition-all ${
                  pathname === '/contact' ? 'w-full' : 'w-0 group-hover:w-full'
                }`} />
              </Link>
            </nav>
          ) : userType === 'landlord' ? (
            // Landlord quick stats
            <div className="flex items-center justify-center gap-6">
              <div className="text-center">
                <p className="text-xs text-slate-500">Properties</p>
                <p className="text-lg font-bold text-slate-900">--</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-500">Viewings</p>
                <p className="text-lg font-bold text-slate-900">--</p>
              </div>
            </div>
          ) : null}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {/* Notifications */}
              <Button variant="ghost" size="icon" className="relative hidden sm:flex">
                <Bell className="h-5 w-5 text-slate-700" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full" />
              </Button>

              {/* Profile Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                    <Avatar className="h-9 w-9 border-2 border-slate-200">
                      <AvatarImage src={profile?.avatar_url || undefined} />
                      <AvatarFallback className="bg-orange-500 text-white text-sm font-semibold">
                        {getUserInitials()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="hidden lg:block text-left">
                      <p className="text-sm font-medium text-slate-900">
                        {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{userType}</p>
                    </div>
                    <ChevronDown className="h-4 w-4 text-slate-500 hidden lg:block" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-slate-900">
                        {profile?.full_name || user?.email?.split('@')[0] || 'User'}
                      </span>
                      <span className="text-xs text-slate-500 font-normal">
                        {user?.email || ''}
                      </span>
                      <span className="text-xs text-orange-600 font-medium capitalize mt-1">
                        {userType}
                      </span>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getDashboardHome()} className="cursor-pointer">
                      <LayoutDashboard className="h-4 w-4 mr-2" />
                      Dashboard
                    </Link>
                  </DropdownMenuItem>
                  {userType !== 'landlord' && (
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
                        <Link href="/landlord/properties/new" className="cursor-pointer">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Property
                        </Link>
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuItem asChild>
                    <Link href="/tenant/messages" className="cursor-pointer">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Messages
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/tenant/profile" className="cursor-pointer">
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
            // Public CTAs
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                className="h-10 px-5 text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 transition-all rounded-lg hidden sm:flex"
                asChild
              >
                <Link href="/signin">Sign In</Link>
              </Button>
              <Button
                className="h-10 px-5 text-[15px] font-medium bg-[#FF6600] hover:bg-[#FF6600]/90 text-white transition-all rounded-lg shadow-sm hover:shadow-md"
                asChild
              >
                <Link href="/signup">Get Started</Link>
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && user && (
        <div className="border-t border-slate-100 bg-white lg:hidden animate-in slide-in-from-top-2 duration-200">
          <nav className="container mx-auto flex flex-col gap-1 px-4 py-6">
            <Link
              href={getDashboardHome()}
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <LayoutDashboard className="h-5 w-5" />
              Dashboard
            </Link>
            
            {userType !== 'landlord' && (
              <>
                <Link
                  href="/properties"
                  className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  Browse Properties
                </Link>
                <Link
                  href="/tenant/favorites"
                  className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Heart className="h-5 w-5" />
                  Favorites
                </Link>
              </>
            )}
            
            {userType === 'landlord' && (
              <>
                <Link
                  href="/landlord/properties"
                  className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Building2 className="h-5 w-5" />
                  My Properties
                </Link>
                <Link
                  href="/landlord/properties/new"
                  className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Plus className="h-5 w-5" />
                  Add Property
                </Link>
              </>
            )}
            
            <Link
              href="/tenant/messages"
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <MessageSquare className="h-5 w-5" />
              Messages
            </Link>
            
            <div className="border-t border-slate-100 my-2" />
            
            <Link
              href="/tenant/profile"
              className="text-[15px] font-medium text-slate-700 hover:text-[#FF6600] hover:bg-[#FF6600]/5 px-4 py-3 rounded-lg transition-all flex items-center gap-3"
              onClick={() => setMobileMenuOpen(false)}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
            
            <button
              onClick={() => {
                setMobileMenuOpen(false)
                handleLogout()
              }}
              className="text-[15px] font-medium text-red-600 hover:text-red-700 hover:bg-red-50 px-4 py-3 rounded-lg transition-all flex items-center gap-3 w-full text-left"
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  )
}
