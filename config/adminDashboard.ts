/**
 * Admin Dashboard Configuration
 * Centralized configuration for all dashboard modules and widgets
 */

export interface DashboardModule {
  id: string
  title: string
  description?: string
  component: string
  enabled: boolean
  position: {
    row: number
    col: number
    width: number
    height: number
  }
  permissions?: string[]
  refreshInterval?: number
  dependencies?: string[]
}

export interface MetricConfig {
  id: string
  title: string
  dataSource: string
  calculation: string
  format: 'number' | 'percentage' | 'currency' | 'text'
  color: 'orange' | 'purple' | 'green' | 'slate' | 'red' | 'yellow' | 'blue'
  icon: string
  trend?: boolean
  alertThresholds?: {
    warning: number
    critical: number
  }
}

export interface QuickAction {
  id: string
  label: string
  href: string
  icon: string
  color: 'orange' | 'purple' | 'green' | 'slate'
  permission?: string
  badge?: {
    source: string
    condition: string
  }
}

// Dashboard Layout Configuration
export const DASHBOARD_LAYOUT = {
  gridCols: 12,
  gridRows: 'auto',
  gap: 6,
  breakpoints: {
    sm: { cols: 1 },
    md: { cols: 2 },
    lg: { cols: 3 },
    xl: { cols: 4 }
  }
}

// Metrics Configuration
export const DASHBOARD_METRICS: MetricConfig[] = [
  {
    id: 'landlord_reviews',
    title: 'Landlord Reviews',
    dataSource: 'dashboardStats.landlords.pending_verification',
    calculation: 'value',
    format: 'number',
    color: 'orange',
    icon: 'Building',
    trend: true,
    alertThresholds: {
      warning: 5,
      critical: 15
    }
  },
  {
    id: 'total_landlords',
    title: 'All Landlords',
    dataSource: 'dashboardStats.landlords.total',
    calculation: 'value',
    format: 'number',
    color: 'orange',
    icon: 'Building2',
    trend: true
  },
  {
    id: 'total_tenants',
    title: 'All Tenants',
    dataSource: 'dashboardStats.tenants.total',
    calculation: 'value',
    format: 'number',
    color: 'purple',
    icon: 'Users',
    trend: true
  },
  {
    id: 'property_reviews',
    title: 'Property Reviews',
    dataSource: 'dashboardStats.properties.pending_verification',
    calculation: 'value',
    format: 'number',
    color: 'green',
    icon: 'Home',
    alertThresholds: {
      warning: 3,
      critical: 10
    }
  },
  {
    id: 'new_tenants_today',
    title: 'New Tenants Today',
    dataSource: 'dashboardStats.recent_activity.new_tenant_signups_today',
    calculation: 'value',
    format: 'number',
    color: 'slate',
    icon: 'Users'
  },
  {
    id: 'new_landlords_today',
    title: 'New Landlords Today',
    dataSource: 'dashboardStats.recent_activity.new_landlord_signups_today',
    calculation: 'value',
    format: 'number',
    color: 'orange',
    icon: 'Building'
  }
]

// Quick Actions Configuration
export const QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'review_landlords',
    label: 'Review Landlords',
    href: '/admin/landlord-verification',
    icon: 'CheckCircle',
    color: 'orange',
    badge: {
      source: 'dashboardStats.landlords.pending_verification',
      condition: 'value > 0'
    }
  },
  {
    id: 'review_properties',
    label: 'Review Properties',
    href: '/admin/property-verification',
    icon: 'Home',
    color: 'green',
    badge: {
      source: 'dashboardStats.properties.pending_verification',
      condition: 'value > 0'
    }
  },
  {
    id: 'manage_users',
    label: 'Manage Users',
    href: '/admin/users',
    icon: 'Users',
    color: 'purple'
  },
  {
    id: 'view_analytics',
    label: 'View Analytics',
    href: '/admin/analytics',
    icon: 'Activity',
    color: 'slate'
  }
]

// Module Configuration
export const DASHBOARD_MODULES: DashboardModule[] = [
  {
    id: 'key_metrics',
    title: 'Key Metrics',
    component: 'KeyMetricsCards',
    enabled: true,
    position: { row: 1, col: 1, width: 12, height: 1 },
    refreshInterval: 30000 // 30 seconds
  },
  {
    id: 'management_sections',
    title: 'Management Sections',
    component: 'ManagementSections',
    enabled: true,
    position: { row: 2, col: 1, width: 12, height: 1 },
    refreshInterval: 60000 // 1 minute
  },
  {
    id: 'platform_activity',
    title: 'Platform Activity',
    component: 'PlatformActivity',
    enabled: true,
    position: { row: 3, col: 1, width: 8, height: 1 },
    refreshInterval: 60000 // 1 minute
  },
  {
    id: 'recent_signups',
    title: 'Recent Signups',
    component: 'RecentSignups',
    enabled: true,
    position: { row: 3, col: 9, width: 4, height: 2 },
    refreshInterval: 120000 // 2 minutes
  },
  {
    id: 'verification_summary',
    title: 'Verification Summary',
    component: 'VerificationSummary',
    enabled: true,
    position: { row: 4, col: 1, width: 12, height: 1 },
    refreshInterval: 60000 // 1 minute
  }
]

// Alert Configuration
export const ALERT_CONFIG = {
  priorityLevels: {
    low: { color: 'orange', threshold: 0 },
    high: { color: 'orange', threshold: 5 },
    urgent: { color: 'red', threshold: 15 }
  },
  autoRefresh: {
    enabled: true,
    interval: 30000, // 30 seconds
    showIndicator: true
  },
  notifications: {
    enabled: true,
    types: ['critical', 'warning', 'info'],
    sound: false,
    desktop: false
  }
}

// Performance Configuration
export const PERFORMANCE_CONFIG = {
  caching: {
    enabled: true,
    ttl: 60000, // 1 minute
    strategy: 'stale-while-revalidate'
  },
  lazyLoading: {
    enabled: true,
    threshold: 200, // 200px from viewport
    placeholder: true
  },
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 50,
    showSizeChanger: true
  }
}

// Theme Configuration
export const THEME_CONFIG = {
  colors: {
    primary: 'orange',
    secondary: 'purple',
    success: 'green',
    warning: 'yellow',
    error: 'red',
    neutral: 'slate'
  },
  gradients: {
    primary: 'from-orange-600 to-orange-700',
    secondary: 'from-purple-600 to-purple-700',
    success: 'from-green-600 to-green-700',
    warning: 'from-yellow-600 to-yellow-700',
    error: 'from-red-600 to-red-700'
  },
  animations: {
    duration: 300,
    easing: 'ease-in-out',
    stagger: 50
  }
}

// Export configuration getter functions
export const getMetricById = (id: string): MetricConfig | undefined => {
  return DASHBOARD_METRICS.find(metric => metric.id === id)
}

export const getModuleById = (id: string): DashboardModule | undefined => {
  return DASHBOARD_MODULES.find(module => module.id === id)
}

export const getQuickActionsByPermission = (permission?: string): QuickAction[] => {
  if (!permission) return QUICK_ACTIONS
  return QUICK_ACTIONS.filter(action => !action.permission || action.permission === permission)
}

export const getEnabledModules = (): DashboardModule[] => {
  return DASHBOARD_MODULES.filter(module => module.enabled)
}

export const getMetricsByColor = (color: string): MetricConfig[] => {
  return DASHBOARD_METRICS.filter(metric => metric.color === color)
}

// Validation functions
export const validateModuleConfig = (module: DashboardModule): boolean => {
  return !!(
    module.id &&
    module.title &&
    module.component &&
    typeof module.enabled === 'boolean' &&
    module.position &&
    typeof module.position.row === 'number' &&
    typeof module.position.col === 'number' &&
    typeof module.position.width === 'number' &&
    typeof module.position.height === 'number'
  )
}

export const validateMetricConfig = (metric: MetricConfig): boolean => {
  return !!(
    metric.id &&
    metric.title &&
    metric.dataSource &&
    metric.format &&
    metric.color &&
    metric.icon
  )
}
