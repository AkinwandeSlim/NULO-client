"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Home,
  Clock,
  CheckCircle2,
  Eye,
  Search,
  MapPin,
  Banknote,
  User,
  Wrench,
  MessageSquare,
  Calendar
} from "lucide-react"
import Link from "next/link"
import { agreementsAPI, type AgreementWithDetails } from "@/lib/api/agreements"
import { toast } from "sonner"
import { ReportIssueModal } from "@/components/maintenance/ReportIssueModal"

const DEFAULT_PROPERTY_IMAGE = "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatNGN = (amount: number) =>
  `₦${Number(amount).toLocaleString("en-NG")}`

const formatDate = (dateStr: string | null | undefined) => {
  if (!dateStr) return "—"
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const getDaysRemaining = (leaseEndDate: string | null | undefined) => {
  if (!leaseEndDate) return null
  const end = new Date(leaseEndDate)
  const now = new Date()
  const diffTime = end.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays
}

// ─────────────────────────────────────────────────────────────────────────────
// ActiveRentCard
// ─────────────────────────────────────────────────────────────────────────────

function ActiveRentCard({ agreement }: { agreement: AgreementWithDetails }) {
  const { property, landlord } = agreement
  const daysRemaining = getDaysRemaining(agreement.lease_end_date)
  const [reportModalOpen, setReportModalOpen] = useState(false)

  return (
    <>
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 border-l-4 border-l-emerald-500">
        <CardContent className="p-5">
          <div className="flex flex-col lg:flex-row gap-5">

            {/* Property thumbnail */}
            <div className="relative flex-shrink-0 lg:w-80">
              <div className="w-full h-48 rounded-xl overflow-hidden bg-slate-100">
                <img
                  src={property?.images?.[0] ?? DEFAULT_PROPERTY_IMAGE}
                  alt={property?.title ?? "Property"}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white px-3 py-1 rounded-full text-sm font-bold shadow-sm">
                {formatNGN(agreement.rent_amount)}/mo
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">

              {/* Title + badge */}
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="min-w-0">
                  <h3 className="text-xl font-bold text-slate-900 truncate" style={{ fontFamily: "Syne, sans-serif" }}>
                    {property?.title ?? "Property Agreement"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-slate-500 mt-1">
                    <MapPin className="h-4 w-4 text-orange-400 flex-shrink-0" />
                    <span className="truncate">
                      {property?.city ?? property?.location ?? "—"}
                      {property?.state ? `, ${property.state}` : ""}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-emerald-100 text-emerald-700">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500" />
                    Active Lease
                  </span>
                </div>
              </div>

              {/* Landlord pill */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-slate-50 rounded-lg border border-slate-100">
                <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-orange-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-slate-800 truncate">
                    {landlord?.full_name ?? "—"}
                  </p>
                  <p className="text-xs text-slate-500">Property Owner</p>
                </div>
                <Link href={`/tenant/messages?conversation=${property?.id}`}>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 h-8">
                    <MessageSquare className="mr-1.5 h-4 w-4" />
                    Message
                  </Button>
                </Link>
              </div>

              {/* Key figures */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Monthly Rent</p>
                  <p className="text-lg font-bold text-orange-600">{formatNGN(agreement.rent_amount)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Lease Duration</p>
                  <p className="text-lg font-bold text-slate-800">{agreement.lease_duration} months</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Start Date</p>
                  <p className="text-lg font-bold text-slate-800">{formatDate(agreement.lease_start_date)}</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-400 uppercase tracking-wider font-medium mb-1">Days Remaining</p>
                  <p className={`text-lg font-bold ${daysRemaining && daysRemaining < 30 ? 'text-red-600' : 'text-slate-800'}`}>
                    {daysRemaining !== null ? `${daysRemaining} days` : "—"}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-100 flex-wrap">
                <Link href={`/tenant/agreements/${agreement.id}`}>
                  <Button size="sm" className="bg-gradient-to-r from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 text-white h-9">
                    <Eye className="mr-2 h-4 w-4" />
                    View Agreement
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-9"
                  onClick={() => setReportModalOpen(true)}
                >
                  <Wrench className="mr-2 h-4 w-4" />
                  Report Maintenance
                </Button>
                <Link href={`/tenant/maintenance?property=${property?.id}`}>
                  <Button size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-50 hover:border-orange-400 h-9">
                    <Calendar className="mr-2 h-4 w-4" />
                    Maintenance History
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Report Issue Modal */}
      <ReportIssueModal
        isOpen={reportModalOpen}
        onClose={() => setReportModalOpen(false)}
        rentedProperties={[{
          property_id: property?.id ?? agreement.id,
          property: property ? {
            id: property.id,
            title: property.title,
            address: property.address ?? property.location ?? undefined,
            city: property.city ?? undefined
          } : undefined
        }]}
        onSuccess={() => {
          // Refresh after successful submission
          toast.success("Maintenance request submitted successfully!")
        }}
      />
    </>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function TenantActiveRentPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [activeAgreements, setActiveAgreements] = useState<AgreementWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchActiveAgreements()
  }, [user]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchActiveAgreements = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await agreementsAPI.getMyAgreements("ACTIVE")

      if (response.success && response.agreements) {
        setActiveAgreements(response.agreements)
      } else {
        toast.error(response.error ?? "Failed to load active agreements")
      }
    } catch (error) {
      console.error("[TenantActiveRent] fetch error:", error)
      toast.error("Failed to load active agreements")
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Client-side filter
  const filteredAgreements = activeAgreements.filter((a) => {
    const q = searchTerm.toLowerCase()
    return !q ||
      a.property?.title?.toLowerCase().includes(q) ||
      a.property?.city?.toLowerCase().includes(q) ||
      a.property?.location?.toLowerCase().includes(q) ||
      a.landlord?.full_name?.toLowerCase().includes(q)
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Active Leases</h3>
          <p className="text-slate-600">Fetching your active rental agreements...</p>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-8">
          <Link href="/tenant">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <Home className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3" style={{ fontFamily: "Syne, sans-serif" }}>
                My Active Leases
              </h1>
              <p className="text-slate-600">
                Manage your current rental properties and maintenance requests
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-8">
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Active Leases</p>
                <p className="text-3xl font-bold text-emerald-600">{activeAgreements.length}</p>
              </div>
              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                <Home className="h-6 w-6 text-emerald-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Total Monthly Rent</p>
                <p className="text-3xl font-bold text-orange-600">
                  {formatNGN(activeAgreements.reduce((sum, a) => sum + a.rent_amount, 0))}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                <Banknote className="h-6 w-6 text-orange-600" />
              </div>
            </CardContent>
          </Card>

          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-5 flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600 mb-0.5">Expiring Soon</p>
                <p className="text-3xl font-bold text-red-600">
                  {activeAgreements.filter((a) => {
                    const days = getDaysRemaining(a.lease_end_date)
                    return days !== null && days < 30
                  }).length}
                </p>
              </div>
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-red-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        {activeAgreements.length > 0 && (
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by property name, location, or landlord..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 text-sm border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white"
              />
            </div>
          </div>
        )}

        {/* List / empty state */}
        {filteredAgreements.length === 0 ? (
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="p-14 text-center">
              <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-6">
                <Home className="h-8 w-8 text-orange-500" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">
                No Active Leases Yet
              </h3>
              <p className="text-slate-600 mb-8 max-w-sm mx-auto">
                {activeAgreements.length === 0
                  ? "You don't have any active rental agreements yet. Once a landlord approves your application and the agreement is signed, it will appear here."
                  : "Try adjusting your search."}
              </p>
              <Link href="/properties">
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                  <Home className="h-4 w-4 mr-2" />
                  Browse Properties
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filteredAgreements.map((agreement) => (
              <ActiveRentCard key={agreement.id} agreement={agreement} />
            ))}
          </div>
        )}

      </div>
    </div>
  )
}
