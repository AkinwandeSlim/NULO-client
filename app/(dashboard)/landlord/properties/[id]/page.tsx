"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams, usePathname } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  MapPin, Bed, Bath, Square, Eye, Heart, Calendar,
  Edit, Trash2, ArrowLeft, MessageSquare,
  Home, Wifi, Car, Dumbbell, Shield, Wind,
  ChevronRight, TrendingUp, AlertCircle, Building2, ZoomIn, X
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { propertiesAPI } from "@/lib/api/properties"

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
  const [mounted, setMounted]               = useState(false)
  const [deleting, setDeleting]             = useState(false)
  const [selectedImage, setSelectedImage]   = useState(0)
  const [lightboxOpen, setLightboxOpen]     = useState(false)
  const [activeTab, setActiveTab]           = useState("overview")

  const router     = useRouter()
  const params     = useParams()
  const pathname   = usePathname()
  const { user }   = useAuth()
  const propertyId = params.id as string

  const fetchProperty = useCallback(async () => {
    try {
      setLoading(true)
      const data = await propertiesAPI.getById(propertyId)
      setProperty(data)
    } catch (error: any) {
      toast.error(error.message || "Failed to load property")
    } finally {
      setLoading(false)
    }
  }, [propertyId])

  useEffect(() => { setMounted(true) }, [])

  // FIX #7: Correct loading trigger — fetch as soon as mounted is true
  useEffect(() => {
    if (mounted) fetchProperty()
  }, [mounted, fetchProperty])

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
  // FIX #8: Always pad to exactly 4 slots for grid layout
  const displayImages =
    images.length >= 4
      ? images.slice(0, 4)
      : [...images, ...Array(4 - images.length).fill(DEFAULT_PROPERTY_IMAGE)]

  const vConfig = VERIFICATION_CONFIG[property.verification_status] ?? VERIFICATION_CONFIG.pending
  const sConfig = STATUS_CONFIG[property.status] ?? STATUS_CONFIG.vacant
  const location = resolveLocation(property)
  const address  = resolveAddress(property)
  // FIX #4: Consistent /year label matching properties list page
  const priceLabel = property.price_period === "month" ? "/month" : "/year"

  return (
    // FIX #9: Match gradient background from properties list page
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">

      {/* ── Sticky breadcrumb + actions bar ────────────────────────────────────
          FIX #2: Move action buttons here — remove broken -mt-16 hack
          FIX #10: sticky top-0 so it stays visible while scrolling          */}
      <div className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3 flex items-center justify-between gap-4">
          <nav className="flex items-center gap-2 text-sm min-w-0">
            <Link href="/landlord/overview"
              className="text-slate-500 hover:text-orange-600 transition-colors font-medium whitespace-nowrap">
              Dashboard
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
            <Link href="/landlord/properties"
              className="text-slate-500 hover:text-orange-600 transition-colors font-medium whitespace-nowrap">
              My Properties
            </Link>
            <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
            <span className="text-slate-900 font-semibold truncate">{property.title}</span>
          </nav>

          {/* Action buttons — always visible in sticky bar */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <Link href={`/landlord/properties/${propertyId}/edit`}>
              <Button
                size="sm"
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm"
              >
                <Edit className="h-3.5 w-3.5 mr-1.5" />
                Edit
              </Button>
            </Link>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
              disabled={deleting}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
            >
              {deleting
                ? <div className="w-3.5 h-3.5 border-2 border-red-400 border-t-transparent rounded-full animate-spin" />
                : <><Trash2 className="h-3.5 w-3.5 mr-1.5" />Delete</>
              }
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">

        {/* ── Image Gallery ────────────────────────────────────────────────────
            FIX #1 + #8: Added grid-rows-2 so col-span-2 row-span-2 works      */}
        <div className="grid grid-cols-4 grid-rows-2 gap-2 h-[480px] rounded-2xl overflow-hidden mb-8 shadow-lg">

          {/* Main large image */}
          <div
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-slate-100"
            onClick={() => { setSelectedImage(0); setLightboxOpen(true) }}
          >
            <img
              src={displayImages[0]}
              alt={property.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
            {/* FIX #6: Show BOTH status badges (was only showing property.status) */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              <Badge className={sConfig.className}>{sConfig.label}</Badge>
              <Badge className={vConfig.className}>{vConfig.label}</Badge>
            </div>
            {/* Zoom hint */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="bg-white/90 backdrop-blur-sm rounded-full p-3 shadow-lg">
                <ZoomIn className="h-5 w-5 text-slate-700" />
              </div>
            </div>
          </div>

          {/* Three smaller images */}
          {displayImages.slice(1, 4).map((img: string, idx: number) => (
            <div
              key={idx}
              className="relative group cursor-pointer overflow-hidden bg-slate-100"
              onClick={() => { setSelectedImage(idx + 1); setLightboxOpen(true) }}
            >
              <img
                src={img}
                alt={`Photo ${idx + 2}`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
              {/* "+N more" on last thumbnail */}
              {idx === 2 && images.length > 4 && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                  <span className="text-white text-3xl font-bold">+{images.length - 4}</span>
                  <span className="text-white/80 text-xs font-medium">more photos</span>
                </div>
              )}
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
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

            {/* Tabbed content — FIX #11: orange active state on tabs */}
            <Card className="border-2 border-slate-200 shadow-sm overflow-hidden">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="border-b border-slate-100 px-6 pt-5">
                  <TabsList className="bg-orange-50 border border-orange-100">
                    <TabsTrigger
                      value="overview"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-medium"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="amenities"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-medium"
                    >
                      Amenities
                    </TabsTrigger>
                    <TabsTrigger
                      value="performance"
                      className="data-[state=active]:bg-white data-[state=active]:text-orange-600 data-[state=active]:shadow-sm font-medium"
                    >
                      Performance
                    </TabsTrigger>
                  </TabsList>
                </div>

                <CardContent className="p-6">

                  {/* Overview */}
                  <TabsContent value="overview" className="space-y-6 mt-0">
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
                  </TabsContent>

                  {/* Amenities — FIX #17: hover states + icon box treatment */}
                  <TabsContent value="amenities" className="mt-0">
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
                  </TabsContent>

                  {/* Performance — FIX #14: consistent card style */}
                  <TabsContent value="performance" className="mt-0">
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
                  </TabsContent>

                </CardContent>
              </Tabs>
            </Card>
          </div>

          {/* ── Sidebar ────────────────────────────────────────────────────── */}
          <div className="space-y-5">

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

                <div className="pt-1 space-y-2 border-t border-slate-100">
                  <Link href={`/landlord/properties/${propertyId}/edit`} className="block">
                    <Button className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-sm">
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Property
                    </Button>
                  </Link>
                  {/* FIX #16: Delete also available in sidebar */}
                  <Button
                    variant="outline"
                    onClick={handleDelete}
                    disabled={deleting}
                    className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                  >
                    {deleting
                      ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin mr-2" />
                      : <Trash2 className="mr-2 h-4 w-4" />
                    }
                    Delete Property
                  </Button>
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
























// "use client"

// import { useState, useEffect, useCallback } from "react"
// import { useRouter, useParams, usePathname } from "next/navigation"
// import { useAuth } from "@/contexts/AuthContext"
// import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// import { Button } from "@/components/ui/button"
// import { Badge } from "@/components/ui/badge"
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
// import { 
//   MapPin, Bed, Bath, Square, Eye, Heart, Calendar, 
//   Edit, Trash2, ArrowLeft, MessageSquare,
//   Home, Wifi, Car, Dumbbell, Shield, Wind, CheckCircle2,
//   ChevronRight, TrendingUp, Users, Clock
// } from "lucide-react"
// import Link from "next/link"
// import { toast } from "sonner"
// import { propertiesAPI } from "@/lib/api/properties"

// const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

// export default function LandlordPropertyViewPage() {
//   const [property, setProperty] = useState<any>(null)
//   const [loading, setLoading] = useState(true)
//   const [mounted, setMounted] = useState(false)
//   const [deleting, setDeleting] = useState(false)
//   const [selectedImage, setSelectedImage] = useState(0)
//   const [activeTab, setActiveTab] = useState('overview')
//   const [hasInitialLoadRef] = useState({ current: false })

//   const router = useRouter()
//   const params = useParams()
//   const pathname = usePathname()
//   const { user } = useAuth()
//   const propertyId = params.id as string

//   const fetchProperty = useCallback(async () => {
//     try {
//       console.log('🔄 [PROPERTY DETAIL] Starting fetch for:', propertyId)
//       setLoading(true)
//       const data = await propertiesAPI.getById(propertyId)
//       console.log('📦 [PROPERTY DETAIL] Property data received:', data)
//       setProperty(data)
//     } catch (error: any) {
//       console.error('❌ [PROPERTY DETAIL] Failed to fetch property:', error)
//       console.error('❌ [PROPERTY DETAIL] Error details:', {
//         message: error.message,
//         status: error.response?.status,
//         data: error.response?.data
//       })
//       toast.error(error.message || 'Failed to load property')
//     } finally {
//       console.log('✅ [PROPERTY DETAIL] Fetch completed, setting loading to false')
//       setLoading(false)
//     }
//   }, [propertyId])

//   useEffect(() => {
//     setMounted(true)
//   }, [])

//   useEffect(() => {
//     if (mounted) {
//       setLoading(true)
//       fetchProperty()
//       hasInitialLoadRef.current = true
//     }
//   }, [pathname, fetchProperty]) // Add pathname to trigger refresh on navigation

//   const handleDelete = async () => {
//     if (!confirm(`Are you sure you want to delete "${property?.title}"? This action cannot be undone.`)) {
//       return
//     }

//     try {
//       setDeleting(true)
//       await propertiesAPI.delete(propertyId)
//       toast.success('Property deleted successfully')
//       router.push('/landlord/properties')
//     } catch (error: any) {
//       console.error('Failed to delete property:', error)
//       toast.error(error.message || 'Failed to delete property')
//     } finally {
//       setDeleting(false)
//     }
//   }

//   const formatPrice = (price: number) => {
//     return new Intl.NumberFormat('en-NG', {
//       style: 'currency',
//       currency: 'NGN',
//       minimumFractionDigits: 0,
//       maximumFractionDigits: 0
//     }).format(price)
//   }

//   const getAmenityIcon = (amenity: string) => {
//     const key = amenity.toLowerCase()
//     if (key.includes('wifi')) return Wifi
//     if (key.includes('park')) return Car
//     if (key.includes('gym')) return Dumbbell
//     if (key.includes('security')) return Shield
//     if (key.includes('air') || key.includes('ac')) return Wind
//     return Home
//   }

//   if (loading && !hasInitialLoadRef.current && !mounted) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center">
//           <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
//           <p className="text-slate-600">Loading property...</p>
//         </div>
//       </div>
//     )
//   }

//   if (!property) {
//     return (
//       <div className="flex items-center justify-center min-h-[60vh]">
//         <div className="text-center">
//           <p className="text-slate-600 mb-4">Property not found</p>
//           <Link href="/landlord/properties">
//             <Button>Back to Properties</Button>
//           </Link>
//         </div>
//       </div>
//     )
//   }

//   const images = property.photos || property.images || [DEFAULT_PROPERTY_IMAGE]
//   const displayImages = images.length >= 4 ? images.slice(0, 4) : [...images, ...Array(4 - images.length).fill(DEFAULT_PROPERTY_IMAGE)]

//   return (
//     <div className="min-h-screen bg-slate-50">
//       {/* Breadcrumb Navigation */}
//       <div className="bg-white border-b border-slate-200">
//         <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
//           <nav className="flex items-center gap-2 text-sm">
//             <Link href="/landlord/overview" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">
//               Dashboard
//             </Link>
//             <ChevronRight className="h-4 w-4 text-slate-400" />
//             <Link href="/landlord/properties" className="text-slate-600 hover:text-orange-600 transition-colors font-medium">
//               My Properties
//             </Link>
//             <ChevronRight className="h-4 w-4 text-slate-400" />
//             <span className="text-slate-900 font-semibold truncate max-w-[300px]">
//               {property.title}
//             </span>
//           </nav>
//         </div>
//       </div>

//       {/* Modern Image Gallery */}
//       <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
//         <div className="grid grid-cols-4 gap-2 h-[500px] rounded-2xl overflow-hidden">
//           {/* Main Large Image */}
//           <div 
//             className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-slate-100"
//             onClick={() => setSelectedImage(0)}
//           >
//             <img
//               src={displayImages[0]}
//               alt={property.title}
//               className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//             />
//             <Badge className="absolute top-4 left-4 bg-green-500 text-white">
//               {property.status || 'vacant'}
//             </Badge>
//           </div>

//           {/* Three Smaller Images */}
//           {displayImages.slice(1, 4).map((img: string, idx: number) => (
//             <div
//               key={idx}
//               className="relative group cursor-pointer overflow-hidden bg-slate-100"
//               onClick={() => setSelectedImage(idx + 1)}
//             >
//               <img
//                 src={img}
//                 alt={`View ${idx + 2}`}
//                 className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
//               />
//               {idx === 2 && images.length > 4 && (
//                 <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
//                   <span className="text-white text-2xl font-bold">+{images.length - 4}</span>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>

//         {/* Action Buttons Overlay */}
//         <div className="flex items-center justify-end gap-2 -mt-16 relative z-10 px-4">
//           <Link href={`/landlord/properties/${propertyId}/edit`}>
//             <Button className="bg-orange-500 hover:bg-orange-600 shadow-lg">
//               <Edit className="h-4 w-4 mr-2" />
//               Edit Property
//             </Button>
//           </Link>
//           <Button
//             variant="destructive"
//             onClick={handleDelete}
//             disabled={deleting}
//             className="shadow-lg"
//           >
//             {deleting ? (
//               <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
//             ) : (
//               <Trash2 className="h-4 w-4 mr-2" />
//             )}
//             Delete
//           </Button>
//         </div>
//       </div>

//       {/* Property Details */}
//       <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
//         <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
//           {/* Main Content */}
//           <div className="lg:col-span-2 space-y-6">
//             {/* Title & Price */}
//             <Card>
//               <CardContent className="p-6">
//                 <div className="flex items-start justify-between gap-4 mb-4">
//                   <div className="flex-1">
//                     <h1 className="text-3xl font-bold text-slate-900 mb-2">
//                       {property.title}
//                     </h1>
//                     <div className="flex items-center gap-2 text-slate-600 mb-3">
//                       <MapPin className="h-4 w-4" />
//                       <span>{property.location}</span>
//                     </div>
//                     {/* Performance Badges */}
//                     <div className="flex flex-wrap items-center gap-2 mt-2">
//                       <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
//                         <Eye className="h-3.5 w-3.5" />
//                         <span>{property.view_count || 0} views</span>
//                       </div>
//                       <div className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
//                         <Heart className="h-3.5 w-3.5" />
//                         <span>{property.favorites_count || 0} favorites</span>
//                       </div>
//                       <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
//                         <CheckCircle2 className="h-3.5 w-3.5" />
//                         <span>{property.status || 'vacant'}</span>
//                       </div>
//                     </div>
//                   </div>
//                   <div className="text-right">
//                     <div className="text-3xl font-bold text-orange-600">
//                       {formatPrice(property.rent_amount || property.price || 0)}
//                     </div>
//                     <div className="text-sm text-slate-600">/month</div>
//                   </div>
//                 </div>

//                 {/* Key Features */}
//                 <div className="flex items-center gap-6 pt-4 border-t border-slate-200">
//                   <div className="flex items-center gap-2">
//                     <Bed className="h-5 w-5 text-slate-400" />
//                     <span className="font-semibold text-slate-900">{property.bedrooms || property.beds || 0}</span>
//                     <span className="text-slate-600 text-sm">Beds</span>
//                   </div>
//                   <div className="flex items-center gap-2">
//                     <Bath className="h-5 w-5 text-slate-400" />
//                     <span className="font-semibold text-slate-900">{property.bathrooms || property.baths || 0}</span>
//                     <span className="text-slate-600 text-sm">Baths</span>
//                   </div>
//                   {(property.square_feet || property.sqft) && (
//                     <div className="flex items-center gap-2">
//                       <Square className="h-5 w-5 text-slate-400" />
//                       <span className="font-semibold text-slate-900">{property.square_feet || property.sqft}</span>
//                       <span className="text-slate-600 text-sm">sqft</span>
//                     </div>
//                   )}
//                   <div className="flex items-center gap-2">
//                     <Home className="h-5 w-5 text-slate-400" />
//                     <span className="font-semibold text-slate-900 capitalize">{property.property_type}</span>
//                   </div>
//                 </div>
//               </CardContent>
//             </Card>

//             {/* Tabbed Content */}
//             <Card>
//               <Tabs value={activeTab} onValueChange={setActiveTab}>
//                 <CardHeader className="pb-3">
//                   <TabsList className="w-full justify-start">
//                     <TabsTrigger value="overview">Overview</TabsTrigger>
//                     <TabsTrigger value="amenities">Amenities</TabsTrigger>
//                     <TabsTrigger value="performance">Performance</TabsTrigger>
//                   </TabsList>
//                 </CardHeader>
//                 <CardContent>
//                   <TabsContent value="overview" className="space-y-4">
//                     <div>
//                       <h3 className="font-semibold text-slate-900 mb-2">Description</h3>
//                       <p className="text-slate-700 leading-relaxed whitespace-pre-line">
//                         {property.description || 'No description provided.'}
//                       </p>
//                     </div>
//                     {property.address && (
//                       <div>
//                         <h3 className="font-semibold text-slate-900 mb-2">Address</h3>
//                         <p className="text-slate-700">{property.address}</p>
//                       </div>
//                     )}
//                   </TabsContent>

//                   <TabsContent value="amenities">
//                     {property.amenities && property.amenities.length > 0 ? (
//                       <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
//                         {property.amenities.map((amenity: string, idx: number) => {
//                           const Icon = getAmenityIcon(amenity)
//                           return (
//                             <div key={idx} className="flex items-center gap-2 p-3 bg-slate-50 rounded-lg">
//                               <Icon className="h-5 w-5 text-orange-500" />
//                               <span className="text-slate-700">{amenity}</span>
//                             </div>
//                           )
//                         })}
//                       </div>
//                     ) : (
//                       <p className="text-slate-600">No amenities listed</p>
//                     )}
//                   </TabsContent>

//                   <TabsContent value="performance">
//                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
//                       <div className="text-center p-4 bg-blue-50 rounded-lg">
//                         <Eye className="h-6 w-6 text-blue-500 mx-auto mb-2" />
//                         <p className="text-2xl font-bold text-slate-900">{property.view_count || 0}</p>
//                         <p className="text-sm text-slate-600">Total Views</p>
//                       </div>
//                       <div className="text-center p-4 bg-red-50 rounded-lg">
//                         <Heart className="h-6 w-6 text-red-500 mx-auto mb-2" />
//                         <p className="text-2xl font-bold text-slate-900">{property.favorites_count || 0}</p>
//                         <p className="text-sm text-slate-600">Favorites</p>
//                       </div>
//                       <div className="text-center p-4 bg-green-50 rounded-lg">
//                         <Calendar className="h-6 w-6 text-green-500 mx-auto mb-2" />
//                         <p className="text-2xl font-bold text-slate-900">{property.viewings_count || 0}</p>
//                         <p className="text-sm text-slate-600">Viewing Requests</p>
//                       </div>
//                       <div className="text-center p-4 bg-purple-50 rounded-lg">
//                         <MessageSquare className="h-6 w-6 text-purple-500 mx-auto mb-2" />
//                         <p className="text-2xl font-bold text-slate-900">{property.messages_count || 0}</p>
//                         <p className="text-sm text-slate-600">Messages</p>
//                       </div>
//                     </div>
//                   </TabsContent>
//                 </CardContent>
//               </Tabs>
//             </Card>
//           </div>

//           {/* Sidebar */}
//           <div className="space-y-6">
//             {/* Quick Actions */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Quick Actions</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3">
//                 <Link href={`/landlord/viewings?property=${propertyId}`}>
//                   <Button variant="outline" className="w-full justify-start">
//                     <Calendar className="mr-2 h-4 w-4" />
//                     Viewing Requests ({property.viewings_count || 0})
//                   </Button>
//                 </Link>
//                 <Link href={`/landlord/messages?property=${propertyId}`}>
//                   <Button variant="outline" className="w-full justify-start">
//                     <MessageSquare className="mr-2 h-4 w-4" />
//                     Messages ({property.messages_count || 0})
//                   </Button>
//                 </Link>
//                 <Link href={`/landlord/properties/${propertyId}/edit`}>
//                   <Button variant="outline" className="w-full justify-start border-orange-500 text-orange-600 hover:bg-orange-50">
//                     <Edit className="mr-2 h-4 w-4" />
//                     Edit Property
//                   </Button>
//                 </Link>
//               </CardContent>
//             </Card>

//             {/* Property Info */}
//             <Card>
//               <CardHeader>
//                 <CardTitle>Property Information</CardTitle>
//               </CardHeader>
//               <CardContent className="space-y-3 text-sm">
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Property Type</span>
//                   <span className="font-medium capitalize">{property.property_type}</span>
//                 </div>
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Status</span>
//                   <Badge className={property.status === 'vacant' ? 'bg-green-500' : 'bg-slate-500'}>
//                     {property.status}
//                   </Badge>
//                 </div>
//                 {property.availability_start && (
//                   <div className="flex justify-between">
//                     <span className="text-slate-600">Available From</span>
//                     <span className="font-medium">
//                       {new Date(property.availability_start).toLocaleDateString()}
//                     </span>
//                   </div>
//                 )}
//                 <div className="flex justify-between">
//                   <span className="text-slate-600">Listed On</span>
//                   <span className="font-medium">
//                     {new Date(property.created_at).toLocaleDateString()}
//                   </span>
//                 </div>
//               </CardContent>
//             </Card>
//           </div>
//         </div>
//       </div>
//     </div>
//   )
// }
