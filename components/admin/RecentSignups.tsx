"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { AlertCircle, Building, ArrowRight, Clock, UserCheck } from "lucide-react"
import { useRouter } from "next/navigation"
import adminDashboardAPI from "@/lib/api/adminDashboard"
import type { RecentSignup } from "@/lib/api/adminDashboard"

interface RecentSignupsProps {
  limit?: number
  showViewAll?: boolean
}

export default function RecentSignups({ limit = 5, showViewAll = true }: RecentSignupsProps) {
  const router = useRouter()
  const [recentSignups, setRecentSignups] = useState<RecentSignup[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRecentSignups = async () => {
    try {
      setLoading(true)
      setError(null)
      const data = await adminDashboardAPI.getRecentSignups(7)
      setRecentSignups(data.recent_signups || [])
    } catch (error: any) {
      console.error('❌ [RECENT SIGNUPS] Failed to fetch:', error)
      const errorMessage = error?.message?.includes('timeout') 
        ? 'API request timed out. Please try again.'
        : 'Failed to load recent signups.'
      setError(errorMessage)
      setRecentSignups([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRecentSignups()
  }, [])

  if (loading) {
    return (
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
    )
  }

  return (
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
        {error ? (
          <div className="text-center py-12">
            <AlertCircle className="w-12 h-12 text-orange-400 mx-auto mb-4" />
            <p className="text-orange-700 font-medium">{error}</p>
            <Button 
              size="sm" 
              className="mt-4 bg-orange-500 hover:bg-orange-600"
              onClick={fetchRecentSignups}
            >
              Retry
            </Button>
          </div>
        ) : recentSignups.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600 font-medium">No recent landlord signups yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentSignups.slice(0, limit).map((landlord) => (
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
            
            {showViewAll && recentSignups.length > limit && (
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
        )}
      </CardContent>
    </Card>
  )
}
