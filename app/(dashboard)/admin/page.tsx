"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Users, 
  Building2, 
  CheckCircle, 
  Clock, 
  XCircle,
  TrendingUp,
  Bell,
  RefreshCw,
  ArrowRight,
  UserCheck,
  Building,
  Activity,
  Home,
  Eye,
  Zap,
  AlertCircle
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"

// ============================================================================
// USING UNIFIED ADMIN DASHBOARD API
// ============================================================================
import adminDashboardAPI from "@/lib/api/adminDashboard"

import type { 
  AdminDashboardStats, 
  RecentSignup 
} from "@/lib/api/adminDashboard"

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()
  const [mounted, setMounted] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  
  // ============================================================================
  // ✅ USING DASHBOARD CONTEXT WITH AUTO-CACHING
  // ============================================================================
  const { 
    stats: dashboardStats,      // Auto-cached dashboard stats
    loading,                     // Smart loading state
    fetchDashboardStats,         // Smart fetch (uses cache automatically)
    invalidateCache              // Cache invalidation if needed
  } = useDashboard()
  
  // ✅ Manually fetch recent signups (this could also be cached)
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([])
  const [recentSignupsLoading, setRecentSignupsLoading] = useState(false)
  const [recentSignupsError, setRecentSignupsError] = useState<string | null>(null)
  const [hasApiFailed, setHasApiFailed] = useState(false)

  // ============================================================================
  // FETCH RECENT SIGNUPS - Additional data fetch with error handling
  // ============================================================================
  const fetchRecentSignups = async () => {
    try {
      setRecentSignupsLoading(true)
      setRecentSignupsError(null)
      const data = await adminDashboardAPI.getRecentSignups(7)
      setRecentSignups(data.recent_signups || [])
      setHasApiFailed(false)
    } catch (error: any) {
      console.error('❌ [ADMIN DASHBOARD] Failed to fetch recent signups:', error)
      const errorMessage = error?.message?.includes('timeout') 
        ? 'API request timed out. Showing cached data if available.'
        : 'Failed to load recent signups. Check your connection.'
      setRecentSignupsError(errorMessage)
      setRecentSignups([])
      setHasApiFailed(true)
    } finally {
      setRecentSignupsLoading(false)
    }
  }

  // ============================================================================
  // EFFECTS - Initialize data on mount
  // ============================================================================
  useEffect(() => {
    setMounted(true)
  }, [])

  // ✅ Fetch dashboard stats and recent signups on component mount
  useEffect(() => {
    if (mounted && !authLoading && user?.user_type === 'admin') {
      // Dashboard stats are auto-cached via context (initialized in layout)
      // Just fetch if not already loaded
      if (!dashboardStats) {
        fetchDashboardStats()
      }
      
      // Fetch recent signups (separate from cached stats)
      fetchRecentSignups()
      
      console.log('🎯 [ADMIN PAGE] Data initialization complete')
    }
  }, [mounted, authLoading, user, dashboardStats, fetchDashboardStats])

  // Auth protection
  useEffect(() => {
    if (!authLoading && mounted) {
      if (!user) {
        router.push('/signin')
        return
      }
      
      if (user.user_type !== 'admin') {
        router.push('/dashboard')
        return
      }
    }
  }, [user, authLoading, mounted, router])

  const handleRefresh = async () => {
    if (refreshing) return
    
    try {
      setRefreshing(true)
      // Force refresh from context (invalidates cache and fetches fresh data)
      await fetchDashboardStats()
      // Also refresh recent signups
      await fetchRecentSignups()
      
      toast.success('Dashboard refreshed')
      console.log('✅ [ADMIN PAGE] Dashboard refreshed successfully')
    } catch (error: any) {
      console.error('❌ [ADMIN PAGE] Refresh failed:', error)
      toast.error('Failed to refresh dashboard')
    } finally {
      setRefreshing(false)
    }
  }

  // ============================================================================
  // COMPUTED VALUES - Using Unified Admin Dashboard API
  // ============================================================================
  const totalPendingVerifications = dashboardStats 
    ? adminDashboardAPI.getTotalPendingVerifications(dashboardStats)
    : 0
  
  const totalVerified = dashboardStats
    ? adminDashboardAPI.getTotalVerifiedUsers(dashboardStats)
    : 0
  
  const activitySummary = dashboardStats
    ? adminDashboardAPI.getActivitySummaryFromStats(dashboardStats)
    : 'Loading...'
  
  const priorityLevel = dashboardStats
    ? adminDashboardAPI.getPriorityLevelFromStats(dashboardStats)
    : 'low'

  // ============================================================================
  // LOADING STATE - Show skeleton structure while loading
  // ============================================================================
  // ✅ FIX: Check if data exists, not just loading state
  // This prevents stuck loading state after data is fetched
  // Show loading only on initial load, not on refreshes
  const isInitialLoading = !mounted || (authLoading && !dashboardStats && loading)
  
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Skeleton className="h-10 w-1/2 mb-2" />
                <Skeleton className="h-6 w-1/3" />
              </div>
              <Skeleton className="h-10 w-24" />
            </div>
          </div>

          {/* Alert Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>

          {/* Stats Grid Skeleton */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="border-orange-100 bg-white/80 backdrop-blur-sm">
                <CardHeader className="pb-2">
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
                </CardHeader>
              </Card>
            ))}
          </div>

          {/* Main Content Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div>
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // RENDER - NuloAfrica Design System (Landlord Overview Pattern)
  // ============================================================================
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 🎯 WELCOME HEADER - Modern Premium Design */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                Welcome back, Admin! 👋
              </h1>
              <p className="text-gray-600 text-base">
                {activitySummary}
              </p>
            </div>
            <Button 
              onClick={handleRefresh} 
              disabled={refreshing}
              className="bg-gradient-to-r from-orange-600 to-orange-700 hover:from-orange-700 hover:to-orange-800 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 gap-2 px-6"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* 🔴 API FAILURE ALERT */}
        {hasApiFailed && (
          <Alert className="mb-8 rounded-2xl bg-gradient-to-r from-red-50 to-orange-50 border border-red-200">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <AlertDescription className="ml-2 text-red-900 font-semibold">
              ⚠️ Dashboard data temporarily unavailable. Some information may be outdated. 
              <Button 
                size="sm" 
                variant="ghost"
                className="ml-2 text-red-700 hover:bg-red-100 font-bold"
                onClick={handleRefresh}
              >
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 🔴 CRITICAL ALERTS - Modern Alert Design */}
        {dashboardStats && (dashboardStats.landlords.pending_verification > 0 || dashboardStats.landlords.pending_onboarding > 0) && (
          <Alert 
            className={`mb-8 rounded-2xl transition-all duration-300 ${
              priorityLevel === 'urgent' 
                ? 'bg-gradient-to-r from-red-50 to-orange-50 border border-red-200' :
              priorityLevel === 'high' 
                ? 'bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200' :
              'bg-gradient-to-r from-orange-50/80 to-yellow-50/80 border border-orange-200'
            }`}
          >
            <AlertCircle className={`h-5 w-5 flex-shrink-0 ${
              priorityLevel === 'urgent' ? 'text-red-600' : 'text-orange-600'
            }`} />
            <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ml-2">
              <div>
                <p className={`font-semibold text-base ${
                  priorityLevel === 'urgent' ? 'text-red-900' : 'text-orange-900'
                }`}>
                  {dashboardStats.landlords.pending_verification > 0 && (
                    <>
                      <span className={priorityLevel === 'urgent' ? 'text-red-600' : 'text-orange-600'}>
                        {dashboardStats.landlords.pending_verification}
                      </span>
                      {' '}landlord{dashboardStats.landlords.pending_verification > 1 ? 's' : ''} pending verification
                      {dashboardStats.landlords.pending_onboarding > 0 && ' • '}
                    </>
                  )}
                  {dashboardStats.landlords.pending_onboarding > 0 && (
                    <>
                      <span className={priorityLevel === 'urgent' ? 'text-red-600' : 'text-orange-600'}>
                        {dashboardStats.landlords.pending_onboarding}
                      </span>
                      {' '}in onboarding
                    </>
                  )}
                </p>
                <p className="text-gray-600 text-sm mt-1">
                  Action required to approve listings and complete user onboarding
                </p>
              </div>
              <Button 
                size="sm" 
                onClick={() => router.push('/admin/landlord-verification')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap"
              >
                Review Now
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* 📊 KEY METRICS - Premium Stats Cards Grid */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          
          {/* Pending Landlord Verifications - Primary Orange */}
          <Card 
            className="cursor-pointer group bg-white/80 backdrop-blur-sm border border-orange-350 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-orange-500"
            onClick={() => router.push('/admin/landlord-verification')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-orange-900">Landlord Reviews</CardTitle>
              <div className="p-3 bg-gradient-to-br from-orange-200 to-orange-300 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Building className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-orange-700">
                {dashboardStats?.landlords?.pending_verification || 0}
              </div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                Pending Review
              </p>
              {dashboardStats && dashboardStats.landlords.pending_verification > 0 && (
                <Badge className="mt-3 bg-gradient-to-r from-orange-600 to-orange-700 text-white border-0 font-semibold shadow-lg">
                  <Zap className="h-3 w-3 mr-1" />
                  Action Required
                </Badge>
              )}
            </CardContent>
          </Card>

          {/* Total Landlords - Orange Theme */}
          <Card 
            className="cursor-pointer group bg-white/80 backdrop-blur-sm border border-orange-350 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-orange-500"
            onClick={() => router.push('/admin/users/landlords')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-orange-900">All Landlords</CardTitle>
              <div className="p-3 bg-gradient-to-br from-orange-200 to-orange-300 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Building2 className="h-5 w-5 text-orange-700" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-orange-700">
                {dashboardStats?.landlords?.total || 0}
              </div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                Registered
              </p>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs font-semibold">
                  {dashboardStats?.landlords?.verified || 0} verified
                </Badge>
                <Badge className="bg-orange-200 text-orange-900 border border-orange-400 text-xs font-semibold">
                  {dashboardStats?.landlords?.pending_verification || 0} pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Total Tenants - Purple Theme */}
          <Card 
            className="cursor-pointer group bg-white/80 backdrop-blur-sm border border-purple-350 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-purple-500"
            onClick={() => router.push('/admin/users/tenants')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-purple-900">All Tenants</CardTitle>
              <div className="p-3 bg-gradient-to-br from-purple-200 to-purple-300 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Users className="h-5 w-5 text-purple-700" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-purple-700">
                {dashboardStats?.tenants?.total || 0}
              </div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                Registered
              </p>
              <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-200">
                <Badge className="bg-green-100 text-green-800 border border-green-300 text-xs font-semibold">
                  {dashboardStats?.tenants?.verified || 0} verified
                </Badge>
                <Badge className="bg-purple-200 text-purple-900 border border-purple-400 text-xs font-semibold">
                  {dashboardStats?.tenants?.pending_verification || 0} pending
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Properties Needing Review - Green Theme */}
          <Card 
            className="cursor-pointer group bg-white/80 backdrop-blur-sm border border-green-350 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 hover:border-green-500"
            onClick={() => router.push('/admin/property-verification')}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <CardTitle className="text-sm font-semibold text-green-900">Property Reviews</CardTitle>
              <div className="p-3 bg-gradient-to-br from-green-200 to-green-300 rounded-xl shadow-lg group-hover:scale-110 transition-transform">
                <Home className="h-5 w-5 text-green-700" />
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="text-3xl font-bold text-green-700">
                {dashboardStats?.properties.pending_verification || 0}
              </div>
              <p className="text-xs text-gray-600 font-medium uppercase tracking-wide">
                Pending Review
              </p>
              {dashboardStats && dashboardStats.properties.pending_verification > 0 && (
                <Badge className="mt-3 bg-gradient-to-r from-green-600 to-green-700 text-white border-0 font-semibold shadow-lg">
                  <Zap className="h-3 w-3 mr-1" />
                  Review Needed
                </Badge>
              )}
            </CardContent>
          </Card>
        </div>


        {/* 📋 DETAILED PLATFORM OVERVIEW - Organized Cards (Matching Landlord Overview) */}
        <div className="grid gap-6 md:grid-cols-3 mb-8 sm:mb-12">
          
          {/* Landlords Management */}
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-orange-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl pb-4">
              <CardTitle className="flex items-center gap-3 text-orange-900 font-bold text-lg">
                <div className="p-2 bg-orange-500 rounded-lg shadow-lg">
                  <Building className="w-5 h-5 text-white" />
                </div>
                Landlords
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Total Registered</span>
                <span className="text-3xl font-bold text-orange-600">{dashboardStats?.landlords?.total || 0}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border-2 border-green-200">
                  <span className="text-sm font-medium text-slate-700">✓ Verified</span>
                  <Badge className="bg-green-500 text-white font-bold">{dashboardStats?.landlords?.verified || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <span className="text-sm font-medium text-slate-700">⏳ Pending</span>
                  <Badge className="bg-orange-500 text-white font-bold">{dashboardStats?.landlords?.pending_verification || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border-2 border-red-200">
                  <span className="text-sm font-medium text-slate-700">✗ Rejected</span>
                  <Badge className="bg-red-500 text-white font-bold">{dashboardStats?.landlords?.rejected || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-2 border-slate-300">
                  <span className="text-sm font-medium text-slate-700">🏠 With Properties</span>
                  <Badge variant="outline" className="border-2 border-orange-300 text-orange-700 font-bold">{dashboardStats?.landlords?.total || 0}</Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1 border-2 border-orange-300 text-orange-700 hover:bg-orange-50 font-bold rounded-xl transition-all duration-300 hover:scale-105" 
                  onClick={() => router.push('/admin/users/landlords')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
                <Button 
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                  onClick={() => router.push('/admin/landlord-verification')}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Review
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tenants Management */}
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-purple-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-t-2xl pb-4">
              <CardTitle className="flex items-center gap-3 text-purple-900 font-bold text-lg">
                <div className="p-2 bg-purple-500 rounded-lg shadow-lg">
                  <Users className="w-5 h-5 text-white" />
                </div>
                Tenants
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Total Registered</span>
                <span className="text-3xl font-bold text-purple-600">{dashboardStats?.tenants?.total || 0}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border-2 border-green-200">
                  <span className="text-sm font-medium text-slate-700">✓ Verified</span>
                  <Badge className="bg-green-500 text-white font-bold">{dashboardStats?.tenants?.verified || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded-xl border-2 border-purple-200">
                  <span className="text-sm font-medium text-slate-700">⏳ Pending</span>
                  <Badge className="bg-purple-500 text-white font-bold">{dashboardStats?.tenants?.pending_verification || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border-2 border-red-200">
                  <span className="text-sm font-medium text-slate-700">✗ Rejected</span>
                  <Badge className="bg-red-500 text-white font-bold">{dashboardStats?.tenants?.rejected || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-2 border-slate-300">
                  <span className="text-sm font-medium text-slate-700">📋 With Applications</span>
                  <Badge variant="outline" className="border-2 border-purple-300 text-purple-700 font-bold">{dashboardStats?.tenants?.total || 0}</Badge>
                </div>
              </div>
              <div className="flex gap-2 pt-4 border-t border-slate-200">
                <Button 
                  variant="outline"
                  size="sm"
                  className="flex-1 border-2 border-purple-300 text-purple-700 hover:bg-purple-50 font-bold rounded-xl transition-all duration-300 hover:scale-105" 
                  onClick={() => router.push('/admin/users/tenants')}
                >
                  <Eye className="w-4 h-4 mr-2" />
                  View All
                </Button>
                <Button 
                  size="sm"
                  className="flex-1 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                  onClick={() => router.push('/admin/users/tenants')}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Manage
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Properties Management */}
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-green-200 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl pb-4">
              <CardTitle className="flex items-center gap-3 text-green-900 font-bold text-lg">
                <div className="p-2 bg-green-500 rounded-lg shadow-lg">
                  <Home className="w-5 h-5 text-white" />
                </div>
                Properties
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-3">
              <div className="flex justify-between items-center pb-3 border-b border-slate-200">
                <span className="text-sm font-semibold text-slate-700">Total Listed</span>
                <span className="text-3xl font-bold text-green-600">{dashboardStats?.properties.total || 0}</span>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-xl border-2 border-green-200">
                  <span className="text-sm font-medium text-slate-700">✓ Verified</span>
                  <Badge className="bg-green-500 text-white font-bold">{dashboardStats?.properties.verified || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border-2 border-orange-200">
                  <span className="text-sm font-medium text-slate-700">⏳ Pending Review</span>
                  <Badge className="bg-orange-500 text-white font-bold">{dashboardStats?.properties.pending_verification || 0}</Badge>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded-xl border-2 border-red-200">
                  <span className="text-sm font-medium text-slate-700">✗ Rejected</span>
                  <Badge className="bg-red-500 text-white font-bold">{dashboardStats?.properties.rejected || 0}</Badge>
                </div>
                {/* <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border-2 border-slate-300">
                  <span className="text-sm font-medium text-slate-700">👁 Total Views</span>
                  <Badge variant="outline" className="border-2 border-green-300 text-green-700 font-bold">{dashboardStats?.properties.total_views || 0}</Badge>
                </div> */}
              </div>
              <Button 
                className="w-full mt-4 pt-4 border-t border-slate-200 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                onClick={() => router.push('/admin/property-verification')}
              >
                <Eye className="w-4 h-4 mr-2" />
                Review Properties
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* 📈 PLATFORM ACTIVITY - Key Metrics Summary */}
        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8 sm:mb-12">
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-slate-300 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">New Tenants Today</p>
                  <p className="text-3xl font-bold text-slate-900 mt-2">
                    {dashboardStats?.recent_activity.new_tenant_signups_today || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-slate-100 to-slate-200 rounded-xl shadow-lg">
                  <Users className="w-6 h-6 text-slate-700" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/80 backdrop-blur-lg border-2 border-orange-300 rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-600 uppercase tracking-wider">New Landlords Today</p>
                  <p className="text-3xl font-bold text-orange-600 mt-2">
                    {dashboardStats?.recent_activity.new_landlord_signups_today || 0}
                  </p>
                </div>
                <div className="p-3 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl shadow-lg">
                  <Building className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* 👥 RECENT LANDLORD SIGNUPS - WITH LOADING & EMPTY STATES */}
        {recentSignupsLoading && (
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-orange-300 rounded-2xl shadow-2xl mb-8 sm:mb-12 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl pb-4">
              <CardTitle className="flex items-center gap-3 text-orange-900 font-bold text-lg">
                <Building className="w-5 h-5 animate-spin" />
                Loading Recent Signups...
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {recentSignups.length > 0 && !recentSignupsLoading && (
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-orange-300 rounded-2xl shadow-2xl mb-8 sm:mb-12 hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-3 text-orange-900 font-bold text-lg">
                    <Building className="w-5 h-5" />
                    Recent Landlord Signups
                  </CardTitle>
                  <CardDescription className="text-orange-700 font-medium text-sm mt-1">
                    Landlords completed onboarding in the last 7 days
                  </CardDescription>
                </div>
                <Badge className="bg-gradient-to-r from-orange-500 to-orange-600 text-white border-0 font-bold shadow-lg whitespace-nowrap">
                  <Clock className="h-3 w-3 mr-2" />
                  {recentSignups.length} Recent
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                {recentSignups.slice(0, 5).map((landlord) => (
                  <div 
                    key={landlord.id}
                    className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-2 border-slate-200 rounded-2xl hover:border-orange-300 hover:bg-orange-50/50 transition-all duration-300 cursor-pointer group hover:shadow-lg"
                    onClick={() => router.push(`/admin/landlord-verification`)}
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-14 h-14 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg flex-shrink-0">
                        {landlord.account_type === 'company' ? (
                          <Building className="w-7 h-7 text-orange-600" />
                        ) : (
                          <UserCheck className="w-7 h-7 text-orange-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-slate-900 text-base">
                          {landlord.full_name}
                        </p>
                        {landlord.company_name && (
                          <p className="text-sm text-slate-600 font-medium">
                            {landlord.company_name}
                          </p>
                        )}
                        <p className="text-sm text-slate-600 truncate">{landlord.email}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <Badge className={`text-xs font-bold ${
                            landlord.account_type === 'company' 
                              ? 'bg-purple-100 text-purple-800 border-2 border-purple-200' 
                              : 'bg-orange-100 text-orange-800 border-2 border-orange-200'
                          }`}>
                            {landlord.account_type === 'company' ? '🏢 Company' : '👤 Individual'}
                          </Badge>
                          {landlord.onboarding_completed_at && (
                            <span className="text-xs text-slate-500 font-medium">
                              {new Date(landlord.onboarding_completed_at).toLocaleDateString('en-US', { 
                                month: 'short', 
                                day: 'numeric', 
                                year: 'numeric' 
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 whitespace-nowrap w-full sm:w-auto"
                    >
                      Review
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                ))}
                
                {recentSignups.length > 5 && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-orange-600 hover:bg-orange-50 font-bold rounded-xl text-base py-3 border-2 border-dashed border-orange-300"
                    onClick={() => router.push('/admin/landlord-verification')}
                  >
                    View All {recentSignups.length} Recent Signups
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        
        {recentSignups.length === 0 && !recentSignupsLoading && (
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-orange-300 rounded-2xl shadow-2xl mb-8 sm:mb-12 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl pb-4">
              <CardTitle className="flex items-center gap-3 text-orange-900 font-bold text-lg">
                <Building className="w-5 h-5" />
                Recent Landlord Signups
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 text-center py-12">
              <div className="flex flex-col items-center gap-4">
                {recentSignupsError ? (
                  <>
                    <AlertCircle className="w-12 h-12 text-orange-400" />
                    <p className="text-orange-700 font-medium">{recentSignupsError}</p>
                  </>
                ) : (
                  <>
                    <Building className="w-12 h-12 text-slate-300" />
                    <p className="text-slate-600 font-medium">No recent landlord signups yet</p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* ✅ VERIFICATION SUMMARY - Status Overview */}
        {dashboardStats && (
          <Card className="bg-white/80 backdrop-blur-lg border-2 border-orange-300 rounded-2xl shadow-2xl hover:shadow-xl transition-all duration-300 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100 rounded-t-2xl pb-4">
              <CardTitle className="flex items-center gap-3 text-orange-900 font-bold text-lg">
                <CheckCircle className="w-5 h-5" />
                Verification Summary
              </CardTitle>
              <CardDescription className="text-orange-700 font-medium text-sm mt-1">
                Complete overview of all verification statuses across the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
                <div className="text-center p-4 bg-slate-50 rounded-xl border-2 border-slate-300 hover:border-slate-400 transition-all hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Total</p>
                  <p className="text-3xl font-bold text-slate-900">{adminDashboardAPI.getTotalPendingVerifications(dashboardStats)}</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-xl border-2 border-orange-300 hover:border-orange-400 transition-all hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Pending</p>
                  <p className="text-3xl font-bold text-orange-600">{adminDashboardAPI.getTotalPendingVerifications(dashboardStats)}</p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-xl border-2 border-yellow-300 hover:border-yellow-400 transition-all hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Onboarding</p>
                  <p className="text-3xl font-bold text-yellow-600">{dashboardStats?.landlords?.pending_onboarding || 0}</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-xl border-2 border-green-300 hover:border-green-400 transition-all hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Verified</p>
                  <p className="text-3xl font-bold text-green-600">{adminDashboardAPI.getTotalVerifiedUsers(dashboardStats)}</p>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-xl border-2 border-red-300 hover:border-red-400 transition-all hover:shadow-lg">
                  <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">Rejected</p>
                  <p className="text-3xl font-bold text-red-600">{dashboardStats?.landlords?.rejected + dashboardStats?.tenants?.rejected || 0}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border-2 border-orange-200">
                <p className="text-sm font-semibold text-slate-700 mb-2">🎯 Quick Actions:</p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <Button 
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105"
                    onClick={() => router.push('/admin/landlord-verification')}
                  >
                    Review Landlords
                  </Button>
                  <Button 
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-lg transition-all duration-300 hover:scale-105"
                    onClick={() => router.push('/admin/property-verification')}
                  >
                    Review Properties
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  )
}