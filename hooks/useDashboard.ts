import { useState, useEffect, useCallback, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboard } from '@/contexts/DashboardContext'
import adminDashboardAPI from '@/lib/api/adminDashboard'
import type { AdminDashboardStats } from '@/lib/api/adminDashboard'
import type { MetricConfig, QuickAction, DashboardModule } from '@/config/adminDashboard'
import { 
  DASHBOARD_METRICS, 
  QUICK_ACTIONS, 
  DASHBOARD_MODULES,
  ALERT_CONFIG,
  PERFORMANCE_CONFIG
} from '@/config/adminDashboard'
 
// Hook for metrics data
export function useDashboardMetrics() {
  const { stats: dashboardStats } = useDashboard()
  const [metrics, setMetrics] = useState<Record<string, any>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
 
  const calculateMetric = useCallback((config: MetricConfig, data: AdminDashboardStats) => {
    try {
      const path = config.dataSource.split('.')
      let value: any = data

      for (const key of path) {
        if (value && typeof value === 'object' && key in value) {
          value = (value as Record<string, any>)[key]
        } else {
          return 0
        }
      }

      return config.calculation === 'value' ? value : 0
    } catch (err) {
      console.error(`Error calculating metric ${config.id}:`, err)
      return 0
    }
  }, [])
 
  useEffect(() => {
    if (dashboardStats) {
      setLoading(true)
      setError(null)
 
      try {
        const calculatedMetrics: Record<string, any> = {}
 
        DASHBOARD_METRICS.forEach(metric => {
          const value = calculateMetric(metric, dashboardStats)
          calculatedMetrics[metric.id] = {
            value,
            config: metric,
            trend: metric.trend ? Math.random() * 20 - 10 : 0, // Placeholder trend
            alert: metric.alertThresholds ? {
              level: value >= metric.alertThresholds.critical ? 'critical' :
                     value >= metric.alertThresholds.warning ? 'warning' : 'normal'
            } : undefined
          }
        })
 
        setMetrics(calculatedMetrics)
      } catch (err) {
        setError('Failed to calculate metrics')
        console.error('Metrics calculation error:', err)
      } finally {
        setLoading(false)
      }
    }
  }, [dashboardStats, calculateMetric])
 
  return { metrics, loading, error }
}
 
// Hook for quick actions with badges
export function useQuickActions() {
  const { stats: dashboardStats } = useDashboard()
 
  const quickActions = useMemo(() => {
    return QUICK_ACTIONS.map(action => ({
      ...action,
      badge: action.badge && dashboardStats ? (() => {
        const path = action.badge.source.split('.')
        let value: any = dashboardStats

        for (const key of path) {
          if (value && typeof value === 'object' && key in value) {
            value = (value as Record<string, any>)[key]
          } else {
            return null
          }
        }

        // Evaluate condition (simplified)
        const shouldShow = action.badge.condition.includes('>') 
          ? value > parseInt(action.badge.condition.split('>')[1])
          : value > 0
 
        return shouldShow ? value : null
      })() : null
    }))
  }, [dashboardStats])
 
  return quickActions
}
 
// Hook for dashboard alerts
export function useDashboardAlerts() {
  const { stats: dashboardStats } = useDashboard()
  const [alerts, setAlerts] = useState<any[]>([])
 
  useEffect(() => {
    if (dashboardStats) {
      const newAlerts = []
 
      // Check for pending verifications
      const totalPending = adminDashboardAPI.getTotalPendingVerifications(dashboardStats)
      if (totalPending > 0) {
        const priorityLevel = adminDashboardAPI.getPriorityLevelFromStats(dashboardStats)
        newAlerts.push({
          id: 'pending_verifications',
          type: 'warning',
          title: 'Pending Verifications',
          message: `${totalPending} items require review`,
          priority: priorityLevel,
          actions: [
            { label: 'Review Now', href: '/admin/landlord-verification' }
          ]
        })
      }
 
      // Check for API failures (placeholder)
      // This would come from error state in real implementation
 
      setAlerts(newAlerts)
    }
  }, [dashboardStats])
 
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId))
  }, [])
 
  return { alerts, dismissAlert }
}
 
// Hook for module management
export function useDashboardModules() {
  const [modules, setModules] = useState<DashboardModule[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
 
  useEffect(() => {
    // Load enabled modules
    setLoading(true)
    try {
      const enabledModules = DASHBOARD_MODULES.filter(module => module.enabled)
      setModules(enabledModules)
    } catch (err) {
      setError('Failed to load dashboard modules')
      console.error('Module loading error:', err)
    } finally {
      setLoading(false)
    }
  }, [])
 
  const toggleModule = useCallback((moduleId: string) => {
    setModules(prev => prev.map(module => 
      module.id === moduleId 
        ? { ...module, enabled: !module.enabled }
        : module
    ))
  }, [])
 
  const reorderModules = useCallback((fromIndex: number, toIndex: number) => {
    setModules(prev => {
      const newModules = [...prev]
      const [moved] = newModules.splice(fromIndex, 1)
      newModules.splice(toIndex, 0, moved)
      return newModules
    })
  }, [])
 
  return { modules, loading, error, toggleModule, reorderModules }
}
 
// Hook for auto-refresh functionality
export function useAutoRefresh(callback: () => void, interval: number = 30000) {
  const [isAutoRefreshEnabled, setIsAutoRefreshEnabled] = useState(ALERT_CONFIG.autoRefresh.enabled)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
 
  useEffect(() => {
    if (!isAutoRefreshEnabled) return
 
    const refreshInterval = setInterval(() => {
      callback()
      setLastRefresh(new Date())
    }, interval)
 
    return () => clearInterval(refreshInterval)
  }, [callback, interval, isAutoRefreshEnabled])
 
  const toggleAutoRefresh = useCallback(() => {
    setIsAutoRefreshEnabled(prev => !prev)
  }, [])
 
  const manualRefresh = useCallback(() => {
    callback()
    setLastRefresh(new Date())
  }, [callback])
 
  return {
    isAutoRefreshEnabled,
    toggleAutoRefresh,
    manualRefresh,
    lastRefresh
  }
}
 
// Hook for dashboard performance monitoring
export function useDashboardPerformance() {
  const [metrics, setMetrics] = useState({
    loadTime: 0,
    renderTime: 0,
    apiCalls: 0,
    errors: 0
  })
 
  const recordLoadTime = useCallback((time: number) => {
    setMetrics(prev => ({ ...prev, loadTime: time }))
  }, [])
 
  const recordRenderTime = useCallback((time: number) => {
    setMetrics(prev => ({ ...prev, renderTime: time }))
  }, [])
 
  const recordApiCall = useCallback(() => {
    setMetrics(prev => ({ ...prev, apiCalls: prev.apiCalls + 1 }))
  }, [])
 
  const recordError = useCallback(() => {
    setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }))
  }, [])
 
  return {
    metrics,
    recordLoadTime,
    recordRenderTime,
    recordApiCall,
    recordError
  }
}
 
// Hook for dashboard preferences
export function useDashboardPreferences() {
  const [preferences, setPreferences] = useState({
    theme: 'light',
    compactMode: false,
    showAnimations: true,
    defaultView: 'overview',
    refreshInterval: 30000,
    notifications: {
      enabled: true,
      sound: false,
      desktop: false
    }
  })
 
  const updatePreference = useCallback((key: string, value: any) => {
    setPreferences(prev => ({ ...prev, [key]: value }))
    // Save to localStorage in real implementation
  }, [])
 
  const resetPreferences = useCallback(() => {
    setPreferences({
      theme: 'light',
      compactMode: false,
      showAnimations: true,
      defaultView: 'overview',
      refreshInterval: 30000,
      notifications: {
        enabled: true,
        sound: false,
        desktop: false
      }
    })
  }, [])

  return {
    preferences,
    updatePreference,
    resetPreferences
  }
}

// Hook for dashboard data caching
export function useDashboardCache() {
  const [cache, setCache] = useState<Record<string, { data: any; timestamp: number }>>({})

  const get = useCallback((key: string) => {
    const item = cache[key]
    if (!item) return null

 
    const isExpired = Date.now() - item.timestamp > PERFORMANCE_CONFIG.caching.ttl
    if (isExpired) {
      setCache(prev => {
        const newCache = { ...prev }
        delete newCache[key]
        return newCache
      })
      return null
    }
 
    return item.data
  }, [cache])
 
  const set = useCallback((key: string, data: any) => {
    setCache(prev => ({
      ...prev,
      [key]: {
        data,
        timestamp: Date.now()
      }
    }))
  }, [])
 
  const invalidate = useCallback((key?: string) => {
    if (key) {
      setCache(prev => {
        const newCache = { ...prev }
        delete newCache[key]
        return newCache
      })
    } else {
      setCache({})
    }
  }, [])
 
  return { get, set, invalidate }
}
 