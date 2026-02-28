"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, AlertCircle, Users, Building, Home } from "lucide-react"
import { useRouter } from "next/navigation"
import adminDashboardAPI from "@/lib/api/adminDashboard"
import type { AdminDashboardStats } from "@/lib/api/adminDashboard"

interface VerificationSummaryProps {
  stats: AdminDashboardStats
}

export default function VerificationSummary({ stats }: VerificationSummaryProps) {
  const router = useRouter()

  const totalPending = adminDashboardAPI.getTotalPendingVerifications(stats)
  const totalVerified = adminDashboardAPI.getTotalVerifiedUsers(stats)
  const totalRejected = stats.landlords.rejected + stats.tenants.rejected

  const summaryCards = [
    {
      title: "Total",
      value: totalPending,
      color: "slate",
      bgColor: "bg-slate-50",
      borderColor: "border-slate-300 hover:border-slate-400"
    },
    {
      title: "Pending",
      value: totalPending,
      color: "orange",
      bgColor: "bg-orange-50",
      borderColor: "border-orange-300 hover:border-orange-400"
    },
    {
      title: "Onboarding",
      value: stats.landlords.pending_onboarding || 0,
      color: "yellow",
      bgColor: "bg-yellow-50",
      borderColor: "border-yellow-300 hover:border-yellow-400"
    },
    {
      title: "Verified",
      value: totalVerified,
      color: "green",
      bgColor: "bg-green-50",
      borderColor: "border-green-300 hover:border-green-400"
    },
    {
      title: "Rejected",
      value: totalRejected,
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-300 hover:border-red-400"
    }
  ]

  return (
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
          {summaryCards.map((card, index) => (
            <div 
              key={index}
              className={`text-center p-4 ${card.bgColor} rounded-xl border-2 ${card.borderColor} transition-all hover:shadow-lg cursor-pointer`}
              onClick={() => {
                if (card.title === "Pending" || card.title === "Onboarding") {
                  router.push('/admin/landlord-verification')
                } else if (card.title === "Verified") {
                  router.push('/admin/users/landlords')
                }
              }}
            >
              <p className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                {card.title}
              </p>
              <p className={`text-3xl font-bold ${
                card.color === 'orange' ? 'text-orange-600' :
                card.color === 'green' ? 'text-green-600' :
                card.color === 'red' ? 'text-red-600' :
                card.color === 'yellow' ? 'text-yellow-600' :
                'text-slate-900'
              }`}>
                {card.value}
              </p>
            </div>
          ))}
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

        {/* Priority Alert */}
        {totalPending > 10 && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-red-900">
                  High Volume of Pending Verifications
                </p>
                <p className="text-xs text-red-700 mt-1">
                  Consider allocating more resources to handle the current workload.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Efficiency Metrics */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="text-center p-3 bg-blue-50 rounded-xl border border-blue-200">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-wider">Approval Rate</p>
            <p className="text-xl font-bold text-blue-900">
              {totalVerified + totalRejected > 0 
                ? Math.round((totalVerified / (totalVerified + totalRejected)) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center p-3 bg-purple-50 rounded-xl border border-purple-200">
            <p className="text-xs font-semibold text-purple-600 uppercase tracking-wider">Pending Rate</p>
            <p className="text-xl font-bold text-purple-900">
              {stats.landlords.total + stats.tenants.total > 0
                ? Math.round((totalPending / (stats.landlords.total + stats.tenants.total)) * 100)
                : 0}%
            </p>
          </div>
          <div className="text-center p-3 bg-green-50 rounded-xl border border-green-200">
            <p className="text-xs font-semibold text-green-600 uppercase tracking-wider">Completion Rate</p>
            <p className="text-xl font-bold text-green-900">
              {stats.landlords.total > 0
                ? Math.round(((stats.landlords.verified + stats.landlords.rejected) / stats.landlords.total) * 100)
                : 0}%
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
