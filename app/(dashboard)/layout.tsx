"use client"

import { useState, useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"  
import { toast } from "sonner"
import { Navbar } from "@/components/navigation/Navbar"
import { NotificationBadge } from "@/components/notifications/NotificationBadge"
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  User,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Building2,
  FileText,
  Calendar,
  Home,
  Users,
  CheckCircle,
  Info,
  BookOpen,
  Phone,
  ChevronDown,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Bell
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// Tenant sidebar links
const tenantSidebarLinks = [
  { href: "/tenant", label: "Dashboard", icon: LayoutDashboard },
  { href: "/tenant/favorites", label: "Saved Properties", icon: Heart },
  { href: "/tenant/viewings", label: "Viewing Requests", icon: Calendar },
  { href: "/tenant/messages", label: "Messages", icon: MessageSquare },
  { href: "/tenant/notifications", label: "Notifications", icon: Bell },
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

// Admin sidebar links with dropdown for user management
const adminSidebarLinks = [
  { href: "/admin", label: "Admin Dashboard", icon: Shield },
  { 
    href: "/admin/users", 
    label: "Manage Users", 
    icon: Users,
    isDropdown: true,
    dropdownItems: [
      { href: "/admin/users/tenants", label: "Tenant Management", icon: User, description: "View, edit, delete tenants" },
      { href: "/admin/users/landlords", label: "Landlord Management", icon: Building2, description: "View, edit, delete landlords" },
      { href: "/admin/users/create", label: "Create New User", icon: UserPlus, description: "Add new tenant or landlord" },
    ]
  },
  // { href: "/admin/tenant-verification", label: "Tenant Verification", icon: User },
  { href: "/admin/landlord-verification", label: "Landlord Verification", icon: Building2 },
  { href: "/admin/property-verification", label: "Property Verification", icon: FileText },
  { href: "/admin/verifications", label: "All Verifications", icon: CheckCircle },
]

// ✅ NEW: Public navigation links to show in dashboard navbar
const publicNavLinks = [
  { href: "/", label: "Home", icon: Home },
  { href: "/properties", label: "Marketplace", icon: Building2 },
  { href: "/about", label: "About", icon: Info },
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/contact", label: "Contact", icon: Phone },
]

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  
  // ✅ FIXED: Use userProfile instead of profile
  const { user, userProfile, loading, signOut } = useAuth()
  
  // ✅ Initialize dashboard cache at layout level (benefits all child pages!)
  const { fetchDashboardStats } = useDashboard()
  
  // Mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Initialize dashboard cache when user is authenticated
  useEffect(() => {
    if (mounted && !loading && user) {
      // Initialize cache for all dashboard pages
      // This runs once and all child pages benefit from the cached data
      fetchDashboardStats()
      
      console.log('🚀 [DASHBOARD LAYOUT] Initialized cache for all dashboard pages')
    }
  }, [mounted, loading, user, fetchDashboardStats])
  
  // Redirect if not authenticated (only after initial load)
  useEffect(() => {
    if (mounted && !loading && !user) {
      router.push('/signin?callbackUrl=' + pathname)
    }
  }, [user, loading, pathname, router, mounted])
  
  // Handle logout
  const handleLogout = async () => {
    if (isSigningOut) return // Prevent multiple clicks
    
    try {
      setIsSigningOut(true)
      console.log('👋 [DASHBOARD] Signing out...')
      
      await signOut()
      
    } catch (error) {
      console.error('❌ [DASHBOARD] Logout error:', error)
      toast.error('Failed to sign out')
      
      // No fallback - let AuthContext handle the error
    } finally {
      setIsSigningOut(false)
    }
  }
  
  // ✅ FIXED: Only show loading on TRUE initial load (not on navigation)
  // If mounted and user exists, render even if loading (for navigation between pages)
  if (!mounted || (!user && loading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }
  
  // Don't render if not authenticated
  if (!user) return null

  // FIXED: Use user for user_type
  const userType = user?.user_type || 'tenant'

  // Determine which sidebar links to show based on user type
  const getSidebarLinks = () => {
    if (userType === 'admin') {
      return adminSidebarLinks
    } else if (userType === 'landlord') {
      return landlordSidebarLinks
    } else {
      return tenantSidebarLinks
    }
  }

  const sidebarLinks = getSidebarLinks()
  
  // Get dashboard home URL based on user type
  const getDashboardHome = () => {
    if (userType === 'admin') return '/admin'
    if (userType === 'landlord') return '/landlord/overview'
    return '/tenant'
  }

  // Check if a nav link is active
  const isNavLinkActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
      {/* UPDATED: Use unified Navbar component */}
      <Navbar />

      {/* FIXED: Adjusted top spacing for navbar */}
      <div className="pt-16">
        {/* Sidebar */}
        <aside
          className={`fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full p-4">
            {/* NEW: Mobile Public Navigation Links */}
            <div className="mb-4 lg:hidden space-y-1 pb-4 border-b border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2 mb-2">
                Navigation
              </p>
              {publicNavLinks.map((link) => {
                const Icon = link.icon
                const isActive = isNavLinkActive(link.href)
                return (
                  <Link 
                    key={link.href}
                    href={link.href}
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 ${
                        isActive
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })}
            </div>

            {/* Dashboard Section Header */}
            <div className="mb-4">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                {userType === 'admin' ? 'Admin Tools' : userType === 'landlord' ? 'Property Management' : 'My Dashboard'}
              </p>
            </div>

            {/* Navigation Links */}
            <nav className="flex-1 space-y-2 overflow-y-auto">
              
              {/* {sidebarLinks.map((link) => {
                const Icon = link.icon
                const isActive = pathname === link.href
                
                if (link.isDropdown) {
                  return (
                    <DropdownMenu key={link.href}>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant={pathname.startsWith(link.href) ? "default" : "ghost"}
                          className={`w-full justify-start gap-3 ${
                            pathname.startsWith(link.href)
                              ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                              : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                          {link.label}
                          <ChevronDown className="h-4 w-4 ml-auto" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="start">
                        <DropdownMenuLabel>User Management Options</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        {link.dropdownItems?.map((item) => {
                          const ItemIcon = item.icon
                          const isItemActive = pathname === item.href
                          return (
                            <DropdownMenuItem key={item.href} asChild>
                              <Link 
                                href={item.href}
                                onClick={() => setSidebarOpen(false)}
                                className={`w-full p-2 flex items-center gap-3 ${
                                  isItemActive ? "bg-orange-50 text-orange-600" : ""
                                }`}
                              >
                                <ItemIcon className="h-4 w-4" />
                                <div className="flex-1">
                                  <p className="font-medium">{item.label}</p>
                                  <p className="text-xs text-gray-500">{item.description}</p>
                                </div>
                              </Link>
                            </DropdownMenuItem>
                          )
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )
                }
                
                return (
                  <Link key={link.href} href={link.href}>
                    <Button
                      variant={isActive ? "default" : "ghost"}
                      className={`w-full justify-start gap-3 ${
                        isActive
                          ? "bg-orange-500 text-white hover:bg-orange-600"
                          : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <Icon className="h-5 w-5" />
                      {link.label}
                    </Button>
                  </Link>
                )
              })} */}

          {userType === 'admin' ? adminSidebarLinks.map((link) => {
                          const Icon = link.icon
                          const isActive = pathname === link.href
                          
                          if (link.isDropdown) {
                            return (
                              <DropdownMenu key={link.href}>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant={pathname.startsWith(link.href) ? "default" : "ghost"}
                                    className={`w-full justify-start gap-3 ${
                                      pathname.startsWith(link.href)
                                        ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700"
                                        : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                                    }`}
                                  >
                                    <Icon className="h-5 w-5" />
                                    {link.label}
                                    <ChevronDown className="h-4 w-4 ml-auto" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56" align="start">
                                  <DropdownMenuLabel>User Management Options</DropdownMenuLabel>
                                  <DropdownMenuSeparator />
                                  {link.dropdownItems?.map((item) => {
                                    const ItemIcon = item.icon
                                    const isItemActive = pathname === item.href
                                    return (
                                      <DropdownMenuItem key={item.href} asChild>
                                        <Link 
                                          href={item.href}
                                          onClick={() => setSidebarOpen(false)}
                                          className={`w-full p-2 flex items-center gap-3 ${
                                            isItemActive ? "bg-orange-50 text-orange-600" : ""
                                          }`}
                                        >
                                          <ItemIcon className="h-4 w-4" />
                                          <div className="flex-1">
                                            <p className="font-medium">{item.label}</p>
                                            <p className="text-xs text-gray-500">{item.description}</p>
                                          </div>
                                        </Link>
                                      </DropdownMenuItem>
                                    )
                                  })}
                                </DropdownMenuContent>
                              </DropdownMenu>
                            )
                          }
                          
                          return (
                            <Link key={link.href} href={link.href}>
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-3 ${
                                  isActive
                                    ? "bg-orange-500 text-white hover:bg-orange-600"
                                    : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                                }`}
                                onClick={() => setSidebarOpen(false)}
                              >
                                <Icon className="h-5 w-5" />
                                {link.label}
                              </Button>
                            </Link>
                          )
                        }) :sidebarLinks.map((link) => {
                          const Icon = link.icon
                          const isActive = pathname === link.href
                          
                          return (
                            <Link key={link.href} href={link.href}>
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-3 ${
                                  isActive
                                    ? "bg-orange-500 text-white hover:bg-orange-600"
                                    : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
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
            <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
              {/* Browse Properties - Only for tenants */}

                <Link href="/properties">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Home className="h-5 w-5" />
                    Browse Properties
                  </Button>
                </Link>
              
              
              {/* Add Property - Only for landlords */}
              {userType === 'landlord' && (
                <Link href="/landlord/properties/new">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Building2 className="h-5 w-5" />
                    Add Property
                  </Button>
                </Link>
              )}

              {/* Settings */}
              <Link href="/tenant/profile">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <Settings className="h-5 w-5" />
                  Settings
                </Button>
              </Link>
              
              {/* Sign Out */}
              <Button 
                variant="ghost" 
                className="w-full justify-start gap-3 text-red-600 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isSigningOut}
                onClick={() => {
                  setSidebarOpen(false)
                  handleLogout()
                }}
              >
                {isSigningOut ? (
                  <>
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    Signing out...
                  </>
                ) : (
                  <>
                    <LogOut className="h-5 w-5" />
                    Sign Out
                  </>
                )}
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

        {/* ✅ FIXED: Main Content */}
        <main className="lg:pl-64">
          <div className="p-4 sm:p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}