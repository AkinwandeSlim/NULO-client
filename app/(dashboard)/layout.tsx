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
import { MessageBadge } from "@/components/messages/MessageBadge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  LayoutDashboard,
  Heart,
  MessageSquare,
  User,
  Settings as SettingsIcon,
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
  ChevronDown,
  UserPlus,
  Eye,
  Bell,
  ChevronRight,
  Briefcase,
  FileCheck,
  Send,
  BookOpen
} from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

// ============================================================================
// TYPE DEFINITIONS FOR SIDEBAR STRUCTURE
// ============================================================================

interface SidebarItem {
  href: string
  label: string
  icon: any
  isMain?: boolean
  isParent?: boolean
  indent?: boolean
  badge?: string
  external?: boolean
}

interface SidebarSection {
  section: string
  icon?: any
  collapsible?: boolean
  items: SidebarItem[]
}

// Tenant sidebar with grouped sections
const tenantSidebarSections: SidebarSection[] = [
  {
    section: "Dashboard",
    items: [
      { href: "/tenant", label: "Dashboard", icon: LayoutDashboard, isMain: true },
    ]
  },
  {
    section: "Application Journey",
    icon: Briefcase,
    items: [
      { href: "/tenant/viewings", label: "Viewing Requests", icon: Calendar },
      { href: "/tenant/applications", label: "My Applications", icon: FileText, badge: "pending" },
      { href: "/tenant/agreements", label: "My Agreements", icon: FileCheck },
      { href: "/tenant/maintenance", label: "Maintenance Requests", icon: SettingsIcon },
    ]
  },
  {
    section: "Billing & Payments",
    icon: FileCheck,
    items: [
      { href: "/tenant/payments/new", label: "Make Payment", icon: Send },
      { href: "/tenant/payments", label: "Payment History", icon: BookOpen },
      { href: "/tenant/invoices", label: "Invoices", icon: FileText },
    ]
  },
  {
    section: "Explore & Save",
    icon: Heart,
    items: [
      { href: "/properties", label: "Browse Properties", icon: Home, external: true },
      { href: "/tenant/favorites", label: "Saved Properties", icon: Heart },
    ]
  },
  {
    section: "Communication",
    icon: MessageSquare,
    items: [
      { href: "/tenant/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
      { href: "/tenant/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
    ]
  },
]

// Landlord sidebar with grouped sections
const landlordSidebarSections: SidebarSection[] = [
  {
    section: "Dashboard",
    items: [
      { href: "/landlord/overview", label: "Dashboard", icon: LayoutDashboard, isMain: true },
    ]
  },
  {
    section: "Property Management",
    icon: Building2,
    items: [
      { href: "/landlord/properties", label: "My Properties", icon: Building2 },
      { href: "/landlord/viewings", label: "Viewing Requests", icon: Eye },
      { href: "/landlord/applications", label: "Applications", icon: FileText },
      { href: "/landlord/agreements", label: "Agreements", icon: BookOpen },
      { href: "/landlord/maintenance", label: "Maintenance", icon: SettingsIcon },
    ]
  },
  {
    section: "Financial Management",
    icon: FileCheck,
    items: [
      { href: "/landlord/payments", label: "Transaction History", icon: BookOpen },
      { href: "/landlord/invoices", label: "Invoices Issued", icon: FileText },
      { href: "/landlord/reports", label: "Payment Reports", icon: FileCheck },
    ]
  },
  {
    section: "Communication",
    icon: MessageSquare,
    items: [
      { href: "/landlord/messages", label: "Messages", icon: MessageSquare, badge: "messages" },
      { href: "/landlord/notifications", label: "Notifications", icon: Bell, badge: "notifications" },
    ]
  },
]

// Admin sidebar sections
const adminSidebarSections: SidebarSection[] = [
  {
    section: "Dashboard",
    items: [
      { href: "/admin", label: "Admin Dashboard", icon: Shield, isMain: true },
    ]
  },
  {
    section: "User Management",
    icon: Users,
    collapsible: true,
    items: [
      { href: "/admin/users/tenants", label: "Manage Tenants", icon: User, indent: true },
      { href: "/admin/users/landlords", label: "Manage Landlords", icon: Building2, indent: true },
      { href: "/admin/users/create", label: "Create New User", icon: UserPlus, indent: true },
    ]
  },
  {
    section: "Verification & Compliance",
    icon: CheckCircle,
    items: [
      { href: "/admin/landlord-verification", label: "Landlord Verification", icon: Building2 },
      { href: "/admin/property-verification", label: "Property Verification", icon: Home },
      { href: "/admin/verifications", label: "All Verifications", icon: CheckCircle },
    ]
  },
  {
    section: "Communication",
    icon: Bell,
    items: [
      { href: "/admin/notifications", label: "Notifications", icon: Bell },
    ]
  },
]




export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isSigningOut, setIsSigningOut] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({})
  const pathname = usePathname() || ''
  const router = useRouter()
  
  // ✅ FIXED: Use userProfile instead of profile
  const { user, userProfile, loading, signOut } = useAuth()
  
  // ✅ Initialize dashboard cache at layout level (benefits all child pages!)
  const { fetchDashboardStats } = useDashboard()
  
  // Toggle section collapse
  const toggleSection = (sectionName: string) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }))
  }
  
  // Get sidebar sections based on user type
  const getSidebarSections = () => {
    if (!user?.user_type) {
      return [] // Return empty sections until user type is available
    }
    
    if (user.user_type === 'admin') {
      return adminSidebarSections
    } else if (user.user_type === 'landlord') {
      return landlordSidebarSections
    } else {
      return tenantSidebarSections
    }
  }
  
  // Mount check
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Initialize dashboard cache when user is authenticated
  // fetchDashboardStats is excluded from deps intentionally — it's called once on mount.
  // Including it risks infinite refetch loops if the context doesn't memoize the function.
  useEffect(() => {
    if (mounted && !loading && user) {
      fetchDashboardStats()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted, loading, user?.id])
  
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

  // FIXED: Use user for user_type directly
  const userType = user?.user_type



  // Get dashboard home URL based on user type
  const getDashboardHome = () => {
    if (userType === 'admin') return '/admin'
    if (userType === 'landlord') return '/landlord/overview'
    return '/tenant'
  }

  // Check if a nav link is active (precise matching to avoid multi-highlighting)
  const isNavLinkActive = (path: string) => {
    // Main dashboard pages - exact match ONLY (don't highlight when on child pages)
    if (path === '/tenant' || path === '/landlord/overview' || path === '/admin') {
      return pathname === path
    }
    
    // Exact match for other pages
    if (pathname === path) return true
    
    // Special case: /tenant/payments should ONLY match /tenant/payments and /tenant/payments (exact)
    // NOT /tenant/payments/new (Make Payment) - those have their own routes
    if (path === '/tenant/payments') {
      return pathname === '/tenant/payments'
    }
    
    // Special case: /tenant/payments/new should ONLY match that exact path and query strings
    if (path === '/tenant/payments/new') {
      return pathname === '/tenant/payments/new'
    }
    
    // Check if this is a nested route under this path
    // Only match if the next character is a slash (prevents false positives)
    if (pathname.startsWith(path + '/')) return true
    
    // Special cases: Other billing pages
    if (path === '/tenant/invoices' && pathname.startsWith('/tenant/invoices')) return true
    if (path === '/landlord/transactions' && pathname.startsWith('/landlord/transactions')) return true
    if (path === '/landlord/invoices' && pathname.startsWith('/landlord/invoices')) return true
    if (path === '/landlord/reports' && pathname.startsWith('/landlord/reports')) return true
    
    return false
  }




  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
      {/* UPDATED: Use unified Navbar component */}
      <Navbar />

      {/* FIXED: Reduced top spacing for navbar */}
      <div className="pt-14">
        {/* Sidebar */}
        <aside
          className={`fixed top-14 left-0 z-40 h-[calc(100vh-3.5rem)] w-64 bg-white border-r border-slate-200 transition-transform duration-300 lg:translate-x-0 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <div className="flex flex-col h-full p-4">



            {/* Dashboard Section Header */}
            <div className="mb-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider px-2">
                {userType === 'admin' ? 'Admin Control Panel' : 
                 userType === 'landlord' ? 'Property Management' : 
                 'Rental Journey'}
              </div>
            </div>

            {/* Navigation Links with Sections */}
            <nav className="flex-1 space-y-1 overflow-y-auto">
              {getSidebarSections().map((sectionGroup, idx) => {
                const isCollapsed = collapsedSections[sectionGroup.section]
                const SectionIcon = sectionGroup.icon
                
                return (
                  <div key={`${sectionGroup.section}-${idx}`}>
                    {/* Section Header (if collapsible) */}
                    {sectionGroup.collapsible ? (
                      <button
                        onClick={() => toggleSection(sectionGroup.section)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-slate-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          {SectionIcon && <SectionIcon className="h-4 w-4 text-slate-600 group-hover:text-orange-600" />}
                          <span className="text-sm font-semibold text-slate-700 group-hover:text-orange-600">
                            {sectionGroup.section}
                          </span>
                        </div>
                        <ChevronRight className={`h-4 w-4 text-slate-400 transition-transform ${isCollapsed ? '' : 'rotate-90'}`} />
                      </button>
                    ) : (
                      <div className="px-3 py-2 mb-2">
                        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          {sectionGroup.section}
                        </p>
                      </div>
                    )}

                    {/* Section Items */}
                    {!isCollapsed && (
                      <div className={sectionGroup.collapsible ? "pl-2 space-y-1 mb-3" : "space-y-1 mb-3"}>
                        {sectionGroup.items.map((item) => {
                          const Icon = item.icon
                          const isActive = isNavLinkActive(item.href)
                          
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              onClick={() => setSidebarOpen(false)}
                            >
                              <Button
                                variant={isActive ? "default" : "ghost"}
                                className={`w-full justify-start gap-3 text-sm ${
                                  item.indent ? 'pl-8' : ''
                                } ${
                                  isActive
                                    ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-sm"
                                    : "text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                                }`}
                              >
                                <Icon className="h-4 w-4 flex-shrink-0" />
                                <span className="flex-1 text-left">{item.label}</span>
                                {isActive && (
                                  <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
                                )}
                                {item.badge === 'messages' && <MessageBadge />}
                                {item.badge === 'notifications' && <NotificationBadge />}
                              </Button>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )
              })}
            </nav>

            {/* Bottom Actions */}
            <div className="space-y-2 pt-4 border-t border-slate-200 mt-4">
              {/* Browse Properties - Only for tenants */}
              {userType === 'tenant' && (
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
              )}
              
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
              <Link href={
                userType === 'admin' ? '/admin/settings' :
                userType === 'landlord' ? '/landlord/profile' : 
                '/tenant/profile'
              }>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start gap-3 text-slate-700 hover:text-orange-600 hover:bg-orange-50"
                  onClick={() => setSidebarOpen(false)}
                >
                  <SettingsIcon className="h-5 w-5" />
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

        {/* Mobile top bar — hamburger to open sidebar. Hidden on desktop where sidebar is always visible. */}
        <div className="lg:hidden fixed top-14 left-0 right-0 z-30 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-4 h-11 flex items-center gap-3 shadow-sm">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg text-slate-600 hover:text-orange-600 hover:bg-orange-50 transition-colors"
            aria-label="Open navigation"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm font-medium text-slate-600 truncate">
            {userType === 'admin' ? 'Admin Panel' : userType === 'landlord' ? 'Property Management' : 'My Dashboard'}
          </span>
        </div>

        {/* Overlay for mobile */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ✅ FIXED: Main Content with notification sidebar */}
        <main className="lg:pl-64 pt-11 lg:pt-0">
          <div className="flex gap-6">
            {/* Main Content Area */}
            <div className="flex-1 p-3 sm:p-4">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}