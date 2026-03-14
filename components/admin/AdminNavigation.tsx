"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useState } from "react"
import { cn } from "@/lib/utils"
import { 
  LayoutDashboard, 
  Users, 
  Shield, 
  FileText, 
  Building, 
  BarChart3,
  Settings,
  LogOut,
  Menu
} from "lucide-react"

interface NavItem {
  title: string
  href: string
  icon: React.ElementType
  description?: string
  badge?: string
}

const navigationItems: NavItem[] = [
  {
    title: "Dashboard",
    href: "/(dashboard)/admin",
    icon: LayoutDashboard,
    description: "Overview and analytics"
  },
  {
    title: "Verifications",
    href: "/(dashboard)/admin",
    icon: Shield,
    description: "User verification management"
  },
  {
    title: "Tenants",
    href: "/(dashboard)/admin/tenant-verification",
    icon: Users,
    description: "Tenant verification queue"
  },
  {
    title: "Landlords",
    href: "/(dashboard)/admin/landlord-verification",
    icon: Building,
    description: "Landlord verification queue"
  },
  {
    title: "Properties",
    href: "/(dashboard)/admin/property-verification",
    icon: FileText,
    description: "Property verification queue"
  },
  {
    title: "Analytics",
    href: "/(dashboard)/admin",
    icon: BarChart3,
    description: "Platform analytics"
  },
  {
    title: "Settings",
    href: "/(dashboard)/admin",
    icon: Settings,
    description: "System settings"
  }
]

export function AdminNavigation() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="admin-nav w-64 h-screen bg-admin-card border-r border-admin-border flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-admin-border">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-admin-primary to-admin-secondary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="font-bold text-lg" style={{color: 'var(--admin-text-primary)'}}>
              Admin
            </h2>
            <p className="text-xs" style={{color: 'var(--admin-text-secondary)'}}>
              Control Panel
            </p>
          </div>
        </div>
        
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 rounded-lg hover:bg-admin-bg-subtle transition-colors"
        >
          <Menu className="h-4 w-4" style={{color: 'var(--admin-text-secondary)'}} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== "/(dashboard)/admin" && pathname?.startsWith(item.href))
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "admin-nav-item flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 group",
                isActive && "active",
                !isActive && "hover:bg-admin-bg-subtle"
              )}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm" style={{color: isActive ? 'var(--admin-primary-foreground)' : 'var(--admin-text-secondary)'}}>
                      {isCollapsed ? item.title.charAt(0) : item.title}
                    </p>
                    {!isCollapsed && item.description && (
                      <p className="text-xs" style={{color: 'var(--admin-text-muted)'}}>
                        {item.description}
                      </p>
                    )}
                  </div>
                  
                  {item.badge && (
                    <span className="admin-badge" style={{
                      background: isActive ? 'var(--admin-accent)' : 'var(--admin-warning)',
                      color: 'white'
                    }}>
                      {item.badge}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-admin-border mt-auto">
        <Link
          href="/signin"
          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-admin-text-secondary hover:text-admin-error hover:bg-admin-bg-subtle transition-all duration-200"
        >
          <LogOut className="h-4 w-4" />
          {!isCollapsed && (
            <span className="text-sm font-medium">Sign Out</span>
          )}
        </Link>
      </div>
    </div>
  )
}
