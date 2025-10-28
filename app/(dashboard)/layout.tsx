"use client"

import { useState, useEffect } from "react"
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
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  Shield,
  Building2,
  FileText,
  Calendar,
  Home,
  ChevronDown,
} from "lucide-react"

// Tenant sidebar links
const tenantSidebarLinks = [
  { href: "/tenant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/favorites", label: "Saved Properties", icon: Heart },
  { href: "/tenant/viewings", label: "Viewing Requests", icon: Calendar },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/profile", label: "Profile", icon: User },
]

// Landlord sidebar links
const landlordSidebarLinks = [
  { href: "/landlord/overview", label: "Dashboard", icon: LayoutDashboard },
  { href: "/landlord/properties", label: "My Properties", icon: Building2 },
  { href: "/landlord/viewings", label: "Viewing Requests", icon: Calendar },
  { href: "/landlord/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/profile", label: "Profile", icon: User },
]

// Admin sidebar links
const adminSidebarLinks = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { href: "/admin/users", label: "Users", icon: User },
  { href: "/admin/properties", label: "Properties", icon: Building2 },
  { href: "/admin/reports", label: "Reports", icon: FileText },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const pathname = usePathname()
  const router = useRouter()
  
  // Real Supabase auth
  const { user, profile, loading, signOut } = useAuth()
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/signin?callbackUrl=' + pathname)
    }
  }, [user, loading, pathname, router])
  
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
  
  // Get user initials
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
  
  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    )
  }
  
  // Don't render if not authenticated
  if (!user) return null

  // Determine which sidebar links to show based on user type
  const getSidebarLinks = () => {
    const userType = profile?.user_type || user?.user_metadata?.user_type
    
    if (userType === 'landlord') {
      return landlordSidebarLinks
    } else if (userType === 'admin') {
      return adminSidebarLinks
    } else {
      // Default to tenant
      return tenantSidebarLinks
    }
  }

  const sidebarLinks = getSidebarLinks()
  
  // Get user type for dynamic redirects
  const userType = profile?.user_type || user?.user_metadata?.user_type || 'tenant'
  
  // Get dashboard home URL based on user type
  const getDashboardHome = () => {
    if (userType === 'landlord') return '/landlord/overview'
    if (userType === 'admin') return '/admin'
    return '/tenant'
  }
  
  // Get profile URL based on user type
  const getProfileUrl = () => {
    return '/tenant/profile' // Unified profile for all users
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-stone-50 to-orange-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-stone-200">
        <div className="px-4 lg:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Left: Logo + Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <Menu className="h-6 w-6" />
              </Button>
              <Link href={getDashboardHome()} className="flex items-center gap-2">
                <div className="text-2xl font-bold">
                  <span className="text-stone-800">Nulo</span>
                  <span className="text-orange-600">Africa</span>
                </div>
              </Link>
            </div>

            {/* Center: Search Bar (Desktop) - Only for tenants */}
            {(userType === 'tenant' || !userType) && (
              <div className="hidden md:flex flex-1 max-w-2xl mx-8">
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
              </div>
            )}
            
            {/* Center: Quick Stats (Desktop) - For landlords */}
            {userType === 'landlord' && (
              <div className="hidden md:flex flex-1 max-w-2xl mx-8 items-center justify-center gap-6">
                <div className="text-center">
                  <p className="text-xs text-slate-500">Properties</p>
                  <p className="text-lg font-bold text-slate-900">--</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Viewings</p>
                  <p className="text-lg font-bold text-slate-900">--</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500">Messages</p>
                  <p className="text-lg font-bold text-slate-900">--</p>
                </div>
              </div>
            )}

            {/* Right: Notifications, Profile */}
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5 text-slate-700" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-orange-500 rounded-full" />
              </Button>
              
              {/* Profile Dropdown Menu */}
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
                <DropdownMenuContent align="end" className="w-56 z-[150]">
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
                  <DropdownMenuItem asChild>
                    <Link href={getProfileUrl()} className="cursor-pointer">
                      <User className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/properties" className="cursor-pointer">
                      <Building2 className="h-4 w-4 mr-2" />
                      Browse Properties
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href={getProfileUrl()} className="cursor-pointer">
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
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside
        className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-stone-200 transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full p-4">
          {/* Navigation Links */}
          <nav className="flex-1 space-y-2">
            {sidebarLinks.map((link) => {
              const Icon = link.icon
              const isActive = pathname === link.href
              return (
                <Link key={link.href} href={link.href}>
                  <Button
                    variant={isActive ? "default" : "ghost"}
                    className={`w-full justify-start gap-3 ${
                      isActive
                        ? "bg-orange-500 text-white hover:bg-orange-600"
                        : "text-stone-700 hover:text-orange-600 hover:bg-orange-50"
                    }`}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon className="h-5 w-5" />
                    {link.label}
                  </Button>
                </Link>
              )
            })}
          </nav>

          {/* Bottom Actions */}
          <div className="space-y-2 pt-4 border-t border-stone-200">
            {(profile?.user_type === 'tenant' || !profile?.user_type) && (
              <Link href="/properties">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-stone-700 hover:text-orange-600 hover:bg-orange-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Home className="h-5 w-5" />
                  Browse Properties
                </Button>
              </Link>
            )}
            {profile?.user_type === 'landlord' && (
              <Link href="/landlord/properties/new">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-stone-700 hover:text-orange-600 hover:bg-orange-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Building2 className="h-5 w-5" />
                  Add Property
                </Button>
              </Link>
            )}
            <Link href={profile?.user_type === 'landlord' ? '/tenant/profile' : '/tenant/profile'}>
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-stone-700 hover:text-orange-600 hover:bg-orange-50"
                onClick={() => setSidebarOpen(false)}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Button>
            </Link>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50"
              onClick={() => {
                setSidebarOpen(false)
                handleLogout()
              }}
            >
              <LogOut className="h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <main className="pt-16 lg:pl-64">
        <div className="p-6">{children}</div>
      </main>
    </div>
  )
}
