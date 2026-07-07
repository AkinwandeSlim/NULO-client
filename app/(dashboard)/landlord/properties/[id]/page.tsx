"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin, Bed, Bath, Square, Eye, Heart, Calendar,
  Edit, Trash2, ArrowLeft, MessageSquare,
  Home, Wifi, Car, Dumbbell, Shield, Wind,
  ChevronRight, TrendingUp, AlertCircle, Building2, ZoomIn, X,
  Grid, Wrench, User
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"
import { maintenanceAPI, type MaintenanceRequest } from "@/lib/api/maintenance"

// ─── Constants ───────────────────────────────────────────────────────────────

const DEFAULT_PROPERTY_IMAGE =
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop"

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)

// FIX #3: Robust location display — backend stores address parts separately
const resolveLocation = (p: any): string => {
  if (p.location) return p.location
  const parts = [p.neighborhood, p.city, p.state].filter(Boolean)
  return parts.length ? parts.join(", ") : "Location not specified"
}

// FIX #5: Backend uses different address field names
const resolveAddress = (p: any): string | null =>
  p.full_address || p.street_address || p.address || null

const getAmenityIcon = (amenity: string) => {
  const k = amenity.toLowerCase()
  if (k.includes("wifi") || k.includes("internet")) return Wifi
  if (k.includes("park") || k.includes("car"))        return Car
  if (k.includes("gym") || k.includes("fitness"))     return Dumbbell
  if (k.includes("security") || k.includes("guard"))  return Shield
  if (k.includes("air") || k.includes("ac"))          return Wind
  return Home
}

// Status configs — consistent with properties list page badge colours
const VERIFICATION_CONFIG: Record<string, { label: string; className: string }> = {
  approved:     { label: "✅ Verified",     className: "bg-green-600 text-white" },
  rejected:     { label: "❌ Rejected",     className: "bg-red-600 text-white" },
  pending:      { label: "⏳ Pending",      className: "bg-yellow-500 text-white" },
  needs_review: { label: "📋 Review",       className: "bg-blue-600 text-white" },
}

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  vacant:      { label: "Vacant",      className: "bg-green-500 text-white" },
  rented:      { label: "Rented",      className: "bg-slate-500 text-white" },
  occupied:    { label: "Occupied",    className: "bg-slate-500 text-white" },
  maintenance: { label: "Maintenance", className: "bg-orange-500 text-white" },
}

const MAINTENANCE_STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  PENDING: { label: "Pending", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  ACKNOWLEDGED: { label: "Acknowledged", className: "bg-blue-100 text-blue-700 border-blue-200" },
  IN_PROGRESS: { label: "In Progress", className: "bg-orange-100 text-orange-700 border-orange-200" },
  RESOLVED: { label: "Resolved", className: "bg-green-100 text-green-700 border-green-200" },
  CLOSED: { label: "Closed", className: "bg-slate-100 text-slate-700 border-slate-200" },
}

const MAINTENANCE_URGENCY_CONFIG: Record<string, { label: string; className: string }> = {
  LOW: { label: "Low", className: "bg-slate-100 text-slate-700 border-slate-200" },
  MEDIUM: { label: "Medium", className: "bg-yellow-100 text-yellow-700 border-yellow-200" },
  HIGH: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-200" },
  EMERGENCY: { label: "Emergency", className: "bg-red-100 text-red-700 border-red-200" },
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SpecPill({
  icon: Icon, value, label,
}: { icon: any; value: any; label: string }) {
  return (
    <div className="flex items-center gap-2 px-4 py-3 bg-orange-50 rounded-xl border border-orange-100">
      <Icon className="h-4 w-4 text-orange-500 flex-shrink-0" />
      <span className="font-bold text-slate-900">{value}</span>
      <span className="text-xs text-slate-500">{label}</span>
    </div>
  )
}

function StatChip({
  icon: Icon, value, label, color,
}: { icon: any; value: number; label: string; color: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      <span>{value} {label}</span>
    </div>
  )
}

function PerfCard({
  icon: Icon, value, label, bg, iconColor,
}: { icon: any; value: number; label: string; bg: string; iconColor: string }) {
  return (
    <div className={`flex flex-col items-center gap-2 p-5 rounded-2xl border ${bg}`}>
      <div className="p-2.5 rounded-xl bg-white shadow-sm">
        <Icon className={`h-5 w-5 ${iconColor}`} />
      </div>
      <p className="text-3xl font-bold text-slate-900 leading-none">{value}</p>
      <p className="text-xs text-slate-500 font-medium text-center leading-tight">{label}</p>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LandlordPropertyViewPage() {
  const [property, setProperty]             = useState<any>(null)
  const [loading, setLoading]               = useState(true)
  const [deleting, setDeleting]             = useState(false)
  const [selectedImage, setSelectedImage]   = useState(0)
  const [lightboxOpen, setLightboxOpen]     = useState(false)
  const [activeTab, setActiveTab]           = useState("overview")
  const [maintenanceRequests, setMaintenanceRequests] = useState<MaintenanceRequest[]>([])
  const [maintenanceLoading, setMaintenanceLoading] = useState(false)

  const router     = useRouter()
  const params     = useParams()
  const pathname   = usePathname()
  const { user }   = useAuth()
  const propertyId = (params?.id as string) || ""

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true)
      const data = await propertiesAPI.getById(propertyId, { skipCache: true })
      setProperty(data)

      //region debug-point H3-detail-page-fetches
      // Debug: Log what the detail page receives
      console.log('🔍 [DETAIL-PAGE] Fetched property:', {
        id: data.id,
        title: data.title,
        price: data.price,
        beds: data.beds
      })

      // Report to debug server
      fetch('http://127.0.0.1:7778/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hypothesisId: 'H3',
          stage: 'detail-page-fetches',
          propertyId,
          fetchedFields: {
            title: data.title,
            price: data.price,
            beds: data.beds,
            baths: data.baths,
            status: data.status
          },
          timestamp: new Date().toISOString()
        })
      }).catch(() => {})
      //endregion debug-point H3-detail-page-fetches
    } catch (error: any) {
      toast.error(error.message || "Failed to load property")
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  const fetchMaintenanceRequests = useCallback(async () => {
    try {
      setMaintenanceLoading(true)
      const data = await maintenanceAPI.getByProperty(propertyId)
      setMaintenanceRequests(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load maintenance requests")
    } finally {
      setMaintenanceLoading(false)
    }
  }, [propertyId])

  useEffect(() => {
    fetchProperty()
  }, [fetchProperty])

  // Fetch maintenance requests when active tab is maintenance
  useEffect(() => {
    if (activeTab === "maintenance") {
      fetchMaintenanceRequests()
    }
  }, [activeTab, fetchMaintenanceRequests])

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete "${property?.title}"? This cannot be undone.`))
      return
    try {
      setDeleting(true)
      await propertiesAPI.delete(propertyId)
      toast.success("Property deleted successfully")
      router.push("/landlord/properties")
    } catch (error: any) {
      toast.error(error.message || "Failed to delete property")
    } finally {
      setDeleting(false)
    }
  }

  // ─── Loading state ──────────────────────────────────────────────────────────
  // FIX #7: Show spinner while loading (removed broken inverted condition)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Loading property...</p>
        </div>
      </div>
    )
  }

  // ─── Not found ──────────────────────────────────────────────────────────────
  if (!property) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-slate-900 mb-2">Property not found</h3>
          <p className="text-slate-500 mb-6">This property may have been removed or you don't have access.</p>
          <Link href="/landlord/properties">
            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Properties
            </Button>
          </Link>
        </div>
      </div>
    )
  }

  // ─── Derived values ─────────────────────────────────────────────────────────
  const images = property.photos || property.images || [DEFAULT_PROPERTY_IMAGE]
  // FIX #8: Always pad to exactly 5 slots for grid layout
  const displayImages =
    images.length >= 5
      ? images.slice(0, 5)
      : [...images, ...Array(5 - images.length).fill(DEFAULT_PROPERTY_IMAGE)]

  const vConfig = VERIFICATION_CONFIG[property.verification_status] ?? VERIFICATION_CONFIG.pending
  const sConfig = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.vacant
  const location = resolveLocation(property)
  const address  = resolveAddress(property)
  // FIX #4: Consistent /year label matching properties list page
  const priceLabel = property.price_period === "month" ? "/month" : "/year"

  return (
    // FIX #9: Match gradient background from properties list page
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Header — matches viewings and application detail page pattern exactly */}
        <div className="mb-8">
          <Link href="/landlord/properties">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Properties
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3 leading-tight">
                {property.title}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className={sConfig.className}>{sConfig.label}</Badge>
                <Badge className={vConfig.className}>{vConfig.label}</Badge>
                <span className="text-slate-500 text-sm flex items-center gap-1">
                  <MapPin className="h-3.5 w-3.5 text-orange-500" />
                  {location}
                </span>
              </div>
            </div>
            {/* Action buttons — same slot as primary action in viewings page */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <Link href={`/landlord/properties/${propertyId}/edit`}>
                <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm">
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Property
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                disabled={deleting}
                className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
              >
                {deleting
                  ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                  : <><Trash2 className="h-4 w-4 mr-2" />Delete</>
                }
              </Button>
            </div>
          </div>
        </div>

        {/* ── Image Gallery ────────────────────────────────────────────────────
            Updated to 5-image layout: 1 large left + 2×2 grid right      */}
        <div className="grid grid-cols-4 gap-1.5 h-[260px] md:h-[480px] rounded-2xl overflow-hidden mb-8 shadow-lg">

          {/* Main large image — left 50% */}
          <div
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-slate-200"
            onClick={() => { setSelectedImage(0); setLightboxOpen(true) }}
          >
            <img
              src={displayImages[0]}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500"
            />
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge className={sConfig.className}>{sConfig.label}</Badge>
              <Badge className={vConfig.className}>{vConfig.label}</Badge>
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>

          {/* 4 smaller images — right 50% in a 2×2 grid */}
          {displayImages.slice(1, 5).map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative group cursor-pointer overflow-hidden bg-slate-200"
              onClick={() => { setSelectedImage(idx + 1); setLightboxOpen(true) }}
            >
              <img
                src={img}
                alt={`Photo ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
              {/* "All X photos" overlay on the last thumbnail */}
              {idx === 3 && images.length > 5 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <button className="bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all hover:scale-105">
                    <Grid className="h-3.5 w-3.5" />
                    All {images.length} photos
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* ── Main 2-col layout ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* ── Left — main content ────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">

            {/* Title + price card */}
            <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4 mb-5">
                  <div className="flex-1 min-w-0">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2 leading-tight">
                      {property.title}
                    </h1>
                    {/* FIX #3: Use resolveLocation fallback */}
                    <div className="flex items-center gap-1.5 text-slate-500 text-sm mb-4">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="line-clamp-1">{location}</span>
                    </div>
                    {/* Stat chips */}
                    <div className="flex flex-wrap gap-2">
                      <StatChip icon={Eye}          value={property.view_count || 0}      label="views"    color="bg-blue-50 border-blue-200 text-blue-700" />
                      <StatChip icon={Heart}        value={property.favorites_count || 0} label="saves"    color="bg-red-50 border-red-200 text-red-700" />
                      <StatChip icon={Calendar}     value={property.viewings_count || 0}  label="viewings" color="bg-orange-50 border-orange-200 text-orange-700" />
                      <StatChip icon={MessageSquare} value={property.messages_count || 0} label="messages" color="bg-purple-50 border-purple-200 text-purple-700" />
                    </div>
                  </div>

                  {/* Price — FIX #4: consistent /year label */}
                  <div className="text-right flex-shrink-0">
                    <div className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
                      {formatPrice(property.rent_amount || property.price || 0)}
                    </div>
                    <div className="text-sm text-slate-500 font-medium">{priceLabel}</div>
                  </div>
                </div>

                {/* Spec pills — FIX #12: orange-500 icons matching list page */}
                <div className="flex flex-wrap gap-3 pt-5 border-t border-slate-100">
                  <SpecPill icon={Bed}      value={property.bedrooms || property.beds || 0}   label="Bedrooms" />
                  <SpecPill icon={Bath}     value={property.bathrooms || property.baths || 0} label="Bathrooms" />
                  {(property.square_feet || property.sqft) && (
                    <SpecPill icon={Square} value={property.square_feet || property.sqft}     label="sqft" />
                  )}
                  <SpecPill
                    icon={Building2}
                    value={(property.property_type || "property").replace(/_/g, " ")}
                    label="Type"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tabbed content — plain buttons matching public property page style */}
            <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
              {/* Tab bar — plain buttons matching public property page style */}
              <div className="flex border-b border-slate-100 overflow-x-auto scrollbar-hide">
                {(["overview", "amenities", "performance", "maintenance"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all capitalize ${
                      activeTab === tab
                        ? "text-orange-600 border-orange-600 bg-orange-50/50"
                        : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-50"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                  </button>
                ))}
              </div>

              <div className="p-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <span className="w-1 h-5 bg-orange-500 rounded-full" />
                        Description
                      </h3>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line text-sm">
                        {property.description || "No description provided."}
                      </p>
                    </div>
                    {/* FIX #5: Use resolveAddress for correct field name */}
                    {address && (
                      <div>
                        <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                          <span className="w-1 h-5 bg-orange-500 rounded-full" />
                          Full Address
                        </h3>
                        <div className="flex items-start gap-2.5 p-3 bg-orange-50 rounded-xl border border-orange-100">
                          <MapPin className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                          <p className="text-slate-700 text-sm">{address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "amenities" && (
                  <div>
                    {property.amenities && property.amenities.length > 0 ? (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {property.amenities.map((amenity: string, idx: number) => {
                          const Icon = getAmenityIcon(amenity)
                          return (
                            <div
                              key={idx}
                              className="flex items-center gap-3 p-3 bg-slate-50 hover:bg-orange-50 border border-slate-100 hover:border-orange-200 rounded-xl transition-colors group cursor-default"
                            >
                              <div className="p-2 bg-white rounded-lg shadow-sm group-hover:bg-orange-100 transition-colors flex-shrink-0">
                                <Icon className="h-4 w-4 text-orange-500" />
                              </div>
                              <span className="text-slate-700 text-sm font-medium capitalize">{amenity}</span>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="text-center py-10">
                        <Home className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">No amenities listed for this property</p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "performance" && (
                  <div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <PerfCard icon={Eye}           value={property.view_count || 0}      label="Total Views"      bg="bg-blue-50 border-blue-100"    iconColor="text-blue-500" />
                      <PerfCard icon={Heart}         value={property.favorites_count || 0} label="Saved by Tenants" bg="bg-red-50 border-red-100"      iconColor="text-red-500" />
                      <PerfCard icon={Calendar}      value={property.viewings_count || 0}  label="Viewing Requests" bg="bg-orange-50 border-orange-100" iconColor="text-orange-500" />
                      <PerfCard icon={MessageSquare} value={property.messages_count || 0}  label="Messages"         bg="bg-purple-50 border-purple-100" iconColor="text-purple-500" />
                    </div>
                    {/* Engagement rate — only show if there are views */}
                    {(property.view_count || 0) > 0 && (
                      <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-100 rounded-xl">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-sm font-semibold text-slate-900">Viewing Conversion</span>
                        </div>
                        <p className="text-xs text-slate-600">
                          {(((property.viewings_count || 0) / property.view_count) * 100).toFixed(1)}% of visitors
                          requested a viewing
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "maintenance" && (
                  <div>
                    {maintenanceLoading ? (
                      <div className="text-center py-10">
                        <div className="w-10 h-10 border-4 border-orange-200 border-t-orange-600 rounded-full animate-spin mx-auto mb-3" />
                        <p className="text-slate-500 text-sm">Loading maintenance requests...</p>
                      </div>
                    ) : maintenanceRequests.length === 0 ? (
                      <div className="text-center py-10">
                        <div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-3">
                          <Wrench className="h-8 w-8 text-orange-500" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">No Maintenance Requests</h3>
                        <p className="text-slate-500 text-sm">No maintenance requests have been submitted for this property yet.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {maintenanceRequests.map((request) => {
                          const statusConfig = MAINTENANCE_STATUS_CONFIG[request.status] || MAINTENANCE_STATUS_CONFIG.PENDING
                          const urgencyConfig = MAINTENANCE_URGENCY_CONFIG[request.urgency] || MAINTENANCE_URGENCY_CONFIG.MEDIUM
                          return (
                            <Card key={request.id} className="border-orange-200 bg-white/80 shadow-sm">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div>
                                    <h4 className="font-semibold text-slate-900">{request.title}</h4>
                                    <p className="text-sm text-slate-500 mt-1">
                                      {new Date(request.created_at).toLocaleDateString("en-NG", {
                                        day: "numeric", month: "short", year: "numeric"
                                      })}
                                    </p>
                                  </div>
                                  <div className="flex flex-col items-end gap-2">
                                    <Badge className={`${statusConfig.className} text-xs`}>{statusConfig.label}</Badge>
                                    <Badge className={`${urgencyConfig.className} text-xs`}>{urgencyConfig.label}</Badge>
                                  </div>
                                </div>
                                <p className="text-slate-600 text-sm mb-3">{request.description}</p>
                                <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <Home className="h-3.5 w-3.5" />
                                    {request.category}
                                  </span>
                                  {request.tenant && (
                                    <span className="flex items-center gap-1">
                                      <User className="h-3.5 w-3.5" />
                                      {request.tenant.full_name}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100">
                                  <Link href={`/landlord/maintenance/${request.id}`}>
                                    <Button size="sm" className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white h-8">
                                      View Details
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="space-y-5 lg:sticky lg:top-8">

            {/* Quick Actions — FIX #13: orange header treatment */}
            <Card className="border-2 border-orange-100 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 bg-gradient-to-r from-orange-50 to-amber-50 border-b border-orange-100">
                <CardTitle className="text-base text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2">
                <Link href={`/landlord/viewings?property=${propertyId}`} className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-between border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-orange-500" />
                      Viewing Requests
                    </span>
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-semibold">
                      {property.viewings_count || 0}
                    </Badge>
                  </Button>
                </Link>
                <Link href={`/landlord/messages?property=${propertyId}`} className="block">
                  <Button
                    variant="outline"
                    className="w-full justify-between border-slate-200 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
                  >
                    <span className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-orange-500" />
                      Messages
                    </span>
                    <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-semibold">
                      {property.messages_count || 0}
                    </Badge>
                  </Button>
                </Link>
                <button
                  onClick={() => setActiveTab("maintenance")}
                  className="w-full flex items-center justify-between border border-slate-200 rounded-lg px-4 py-2.5 text-sm font-semibold hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700 transition-all"
                >
                  <span className="flex items-center gap-2">
                    <Wrench className="h-4 w-4 text-orange-500" />
                    Maintenance Requests
                  </span>
                  <Badge className="bg-orange-100 text-orange-700 border-0 text-xs font-semibold">
                    {maintenanceRequests.length}
                  </Badge>
                </button>

                <div className="pt-1 space-y-2 border-t border-slate-100">
                  <Link href={`/landlord/properties/${propertyId}/edit`} className="block">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Property
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            {/* Property Info */}
            <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
              <CardHeader className="pb-3 border-b border-slate-100">
                <CardTitle className="text-base text-slate-900">Property Information</CardTitle>
              </CardHeader>
              <CardContent className="p-4">
                <div className="divide-y divide-slate-50">
                  {/* Occupancy & verification as badges */}
                  <div className="flex items-center justify-between py-3">
                    <span className="text-slate-500 text-sm">Occupancy</span>
                    <Badge className={`${sConfig.className} text-xs`}>{sConfig.label}</Badge>
                  </div>
                  <div className="flex items-center justify-between py-3">
                    <span className="text-slate-500 text-sm">Verification</span>
                    <Badge className={`${vConfig.className} text-xs`}>{vConfig.label}</Badge>
                  </div>

                  {/* Text rows */}
                  {[
                    { label: "Type",   value: (property.property_type || "–").replace(/_/g, " "), cap: true },
                    { label: "City",   value: property.city || "–" },
                    ...(property.neighborhood ? [{ label: "Area", value: property.neighborhood }] : []),
                    ...(property.availability_start
                      ? [{ label: "Available From", value: new Date(property.availability_start).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) }]
                      : []),
                    { label: "Listed On", value: new Date(property.created_at).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" }) },
                  ].map(({ label, value, cap }) => (
                    <div key={label} className="flex items-center justify-between py-3">
                      <span className="text-slate-500 text-sm">{label}</span>
                      <span className={`text-slate-900 text-sm font-medium ${cap ? "capitalize" : ""}`}>{value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* FIX #15: Back button in sidebar */}
            <Link href="/landlord/properties">
              <Button
                variant="outline"
                className="w-full border-slate-200 text-slate-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-all"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                All Properties
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ── Lightbox ─────────────────────────────────────────────────────────── */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxOpen(false)}
        >
          <div className="relative max-w-4xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={displayImages[selectedImage]}
              alt="Property photo"
              className="w-full max-h-[80vh] object-contain rounded-xl shadow-2xl"
            />
            {/* Thumbnail strip */}
            <div className="flex gap-2 justify-center mt-4 flex-wrap">
              {displayImages.map((img: string, idx: number) => (
                <button
                  key={idx}
                  onClick={() => setSelectedImage(idx)}
                  className={`w-14 h-14 rounded-lg overflow-hidden border-2 transition-all ${
                    selectedImage === idx
                      ? "border-orange-500 scale-110"
                      : "border-white/30 opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            {/* Close button */}
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute -top-4 -right-4 bg-white text-slate-900 rounded-full w-9 h-9 flex items-center justify-center shadow-lg hover:bg-orange-50 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}




















