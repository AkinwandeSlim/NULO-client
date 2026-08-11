"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useSignupCallbackUrl } from "@/hooks/useSignupCallbackUrl"
import { PublicHeader } from "@/components/navigation/PublicHeader"
import { useTheme } from "@/contexts/ThemeContext"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  MapPin, Bed, Bath, Square, Heart, Share2, ChevronRight, X,
  Home, Wifi, Car, Dumbbell, Shield, Wind, Tv, Coffee, Check,
  Phone, Mail, Calendar, Star, MessageCircle, Eye, Grid,
  CheckCircle2, Video, Clock, ArrowRight, FileText, Lock,
  TrendingDown, Users, ZapIcon, AlertTriangle, Sparkles, Sun, Moon, LayoutGrid, User, LogOut
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import ViewingRequestModal from "@/components/rental/ViewingRequestModal"
import { ChatModal } from "@/components/ChatModal"
import { favoritesAPI } from "@/lib/api/favorites"
import { formatNGN, calculateRentalBreakdown, RentalBreakdown, getPaymentFrequencyMultiplier } from "@/lib/utils/rentalCalculations"
import { viewingRequestsAPI } from "@/lib/api/viewingRequestsTenant"
import { propertiesAPI } from "@/lib/api/properties"
import { applicationsAPI } from "@/lib/api/applications"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"
import SearchBar from "@/components/properties/SearchBar"
import { MarketplaceHeader } from "@/components/navigation/MarketplaceHeader"

// ── Dynamic map import ─────────────────────────────────────────────────────────
const PropertyMap = dynamic(() => import("@/components/PropertyMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-100 dark:bg-zinc-800 rounded-xl flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto mb-2" />
        <p className="text-slate-500 dark:text-white/50 text-sm">Loading map...</p>
      </div>
    </div>
  ),
})

// ── Constants ─────────────────────────────────────────────────────────────────
const PLACEHOLDER_IMAGES = [
  "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop",
  "https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop",
]

const ensureMinimumImages = (images: string[] = []): string[] => {
  const valid = images.filter(img => img && img.trim() !== "")
  if (valid.length >= 5) return valid
  return [...valid, ...PLACEHOLDER_IMAGES.slice(0, 5 - valid.length)]
}

// ── Amenity icon helper ────────────────────────────────────────────────────────
const getAmenityIcon = (amenity: string) => {
  const k = amenity.toLowerCase().replace(/[^a-z]/g, "")
  if (k.includes("wifi") || k.includes("internet")) return Wifi
  if (k.includes("park"))                            return Car
  if (k.includes("gym") || k.includes("fitness"))   return Dumbbell
  if (k.includes("security") || k.includes("guard")) return Shield
  if (k.includes("air") || k.includes("ac"))        return Wind
  if (k.includes("smart") || k.includes("tv"))      return Tv
  if (k.includes("kitchen"))                         return Coffee
  if (k.includes("balcony") || k.includes("terrace")) return Home
  return Home
}

// ── Tab type ──────────────────────────────────────────────────────────────────
type Tab = "description" | "amenities" | "landlord" | "location"

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export default function PropertyDetailPage() {
  const [activeTab,           setActiveTab]           = useState<Tab>("description")
  const [selectedImage,       setSelectedImage]       = useState(0)
  const [showGallery,         setShowGallery]         = useState(false)
  const [showViewingModal,    setShowViewingModal]    = useState(false)
  const [viewingType,         setViewingType]         = useState<"PHYSICAL" | "VIRTUAL" | "LIVE_VIDEO">("PHYSICAL")
  const [showChatModal,       setShowChatModal]       = useState(false)
  const [showReportModal,     setShowReportModal]     = useState(false)
  const [isFavorite,          setIsFavorite]          = useState(false)
  const [isTogglingFavorite,  setIsTogglingFavorite]  = useState(false)
  const [propertyData,        setPropertyData]        = useState<any>(null)
  const [isLoading,           setIsLoading]           = useState(true)
  const [shouldShowSkeleton,  setShouldShowSkeleton]  = useState(false)
  const [error,               setError]               = useState<string | null>(null)
  const [hasViewedVideo,      setHasViewedVideo]      = useState(false)
  const [completedViewingId,  setCompletedViewingId]  = useState<string | null>(null)
  const [hasExistingViewing,  setHasExistingViewing]  = useState(false)
  const [isCheckingViewings,  setIsCheckingViewings]  = useState(false)
  const [hasExistingApplication, setHasExistingApplication] = useState(false)
  const [isCheckingApplications, setIsCheckingApplications] = useState(false)

  const router     = useRouter()
  const params     = useParams()
  const { user, loading: authLoading } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const propertyId = (params?.id as string) || ""

  useSignupCallbackUrl()

  // ── Redirect landlords ───────────────────────────────────────────────────
  useEffect(() => {
    if (user?.user_type === "landlord") router.replace("/landlord/overview")
  }, [user, router])

  // ── Fetch property ───────────────────────────────────────────────────────
  useEffect(() => {
    let isMounted = true
    const fetchProperty = async () => {
      if (!propertyId || !isMounted) {
        if (isMounted) { setError("No property ID provided"); setIsLoading(false) }
        return
      }
      if (isMounted) { setIsLoading(true); setError(null); setShouldShowSkeleton(true) }
      try {
        const data = await propertiesAPI.getById(propertyId)
        if (!isMounted) return
        data.images = data.images ? ensureMinimumImages(data.images) : PLACEHOLDER_IMAGES
        setPropertyData(data)
        setIsFavorite(data.is_favorited || false)
      } catch (err: any) {
        if (!isMounted) return
        let msg = err.message || "Failed to load property"
        if (msg.includes("taking too long"))           msg = "Property details are taking too long. Please check your connection."
        else if (msg.includes("Network connection"))   msg = "Network connection lost. Please check your internet."
        else if (msg.includes("Cannot reach"))         msg = "Cannot reach the property server. Please try again."
        setError(msg)
        toast.error(msg)
      } finally {
        if (isMounted) { setIsLoading(false); setShouldShowSkeleton(false) }
      }
    }
    fetchProperty()
    return () => { isMounted = false }
  }, [propertyId])

  // ── Check if user already has a pending/confirmed viewing ──────────────────
  useEffect(() => {
    if (!user || !propertyId) return
    let isMounted = true
    const checkExistingViewings = async () => {
      setIsCheckingViewings(true)
      try {
        const result = await viewingRequestsAPI.getMyRequests()
        if (!isMounted) return
        if (result.success && result.data && Array.isArray(result.data)) {
          const found = result.data.some(
            (req: any) =>
              req.property_id === propertyId &&
              ["pending", "confirmed"].includes(req.status)
          )
          setHasExistingViewing(found)
        }
      } catch (err) {
        console.warn("Could not check existing viewing requests:", err)
      } finally {
        if (isMounted) setIsCheckingViewings(false)
      }
    }
    checkExistingViewings()
    return () => { isMounted = false }
  }, [user, propertyId])

  // ── Check if user already has an application for this property ──────────
  useEffect(() => {
    if (!user || !propertyId) return
    let isMounted = true
    const checkExistingApplications = async () => {
      setIsCheckingApplications(true)
      try {
        const result = await applicationsAPI.getMyApplications()
        if (!isMounted) return
        if (result.success && result.applications && Array.isArray(result.applications)) {
          const found = result.applications.some(
            (app: any) => app.property_id === propertyId
          )
          setHasExistingApplication(found)
        }
      } catch (err) {
        console.warn("Could not check existing applications:", err)
      } finally {
        if (isMounted) setIsCheckingApplications(false)
      }
    }
    checkExistingApplications()
    return () => { isMounted = false }
  }, [user, propertyId])

  // ── Helpers ──────────────────────────────────────────────────────────────
  const formatPrice = (value: number) =>
    new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN", minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(value)

  const authRedirect = (msg: string) => {
    toast.info(msg)
    router.push(`/signup/tenant?redirect_to=${encodeURIComponent(`/properties/${propertyId}`)}`)
  }

  // ── Handlers ─────────────────────────────────────────────────────────────
  const toggleFavorite = async () => {
    if (isTogglingFavorite) return
    if (!user) { authRedirect("Sign up to save favorites. You'll return here after verification."); return }
    if (!propertyData?.id) { toast.error("Property data not loaded yet"); return }
    try {
      setIsTogglingFavorite(true)
      const id = String(propertyData.id)
      if (isFavorite) {
        await favoritesAPI.remove(id)
        setIsFavorite(false)
        toast.success(
          <div className="flex items-center justify-between gap-4">
            <span>Removed from favorites</span>
            <button onClick={async () => { await favoritesAPI.add(id); setIsFavorite(true); toast.dismiss(); toast.success("Added back!") }} className="text-xs font-semibold underline">Undo</button>
          </div>,
          { duration: 5000 }
        )
      } else {
        await favoritesAPI.add(id)
        setIsFavorite(true)
        toast.success("Saved to Favorites!")
      }
    } catch (err: any) {
      setIsFavorite(prev => !prev)
      const msg = err.response?.data?.detail || "Failed to update favorites"
      if (msg.includes("already in favorites"))    { toast.info("Already in favorites"); setIsFavorite(true) }
      else if (err.response?.status === 401)       toast.error("Please sign in to add favorites")
      else if (err.response?.status === 403)       toast.error("Only tenants can save favorites")
      else                                          toast.error(msg)
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const handleRequestViewing = (type: "PHYSICAL" | "VIRTUAL" | "LIVE_VIDEO" = "PHYSICAL") => {
    if (!user) { authRedirect("Sign up to request a viewing. You'll return here after verification."); return }

    if (hasExistingViewing) {
      toast.info("You already have a viewing request for this property.", {
        description: "Check your dashboard, or go ahead and apply.",
        duration: 5000,
      })
      return
    }

    // VIRTUAL needs a pre-recorded URL; LIVE_VIDEO is a live call so always available
    if (type === "VIRTUAL" && !propertyData.video_tour_url) {
      toast.info("No recorded virtual tour available for this property. Try Physical or Live Video instead.")
      return
    }

    setViewingType(type)
    setShowViewingModal(true)
  }

  const handleVirtualTour = () => {
    if (!user) { authRedirect("Sign up to view virtual tour. You'll return here after verification."); return }
    if (!propertyData.video_tour_url) { toast.info("Virtual tour not available."); return }
    setHasViewedVideo(true)
    toast.success("Virtual tour started!")
  }

  // SRCH-08 / VIEW-02: Virtual Viewing is a premium feature planned for
  // the next phase (360° inspections). Surface a friendly "coming soon"
  // toast instead of a dead greyed-out tab.
  const handleVirtualComingSoon = () => {
    toast(
      <div className="flex items-start gap-3">
        <Sparkles className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
        <div>
          <div className="font-semibold text-slate-900">Coming Soon - Premium Feature</div>
          <div className="text-sm text-slate-600 mt-0.5">
            360° virtual inspections are launching in the next phase. Stay tuned!
          </div>
        </div>
      </div>,
      { duration: 4500 }
    )
  }

  const handleChatLandlord = () => {
    if (!user) { authRedirect("Sign up to message the landlord."); return }
    setShowChatModal(true)
  }

  const handleReportConcern = () => {
    if (!user) { authRedirect("Sign up to report concerns."); return }
    setShowReportModal(true)
  }

  const confirmViewing = (viewingRequest: any) => {
    // A request is pending landlord review; keep the property page in sync so
    // tenants cannot immediately submit another request from a stale button.
    if (viewingRequest?.id) setCompletedViewingId(viewingRequest.id)
    setHasExistingViewing(true)
  }

  const shareProperty = () => {
    if (navigator.share) {
      navigator.share({ title: propertyData.title, text: `Check out: ${propertyData.title}`, url: window.location.href })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied to clipboard!")
    }
  }

  const handleApply = () => {
    if (!user) {
      toast.info("Sign up to apply for this property.")
      router.push(`/signup/tenant?redirect_to=${encodeURIComponent(`/properties/${propertyId}/apply`)}`)
      return
    }
    if (hasExistingApplication) {
      toast.info("You've already applied for this property!")
      router.push(`/tenant/applications`)
      return
    }
    const applyUrl = completedViewingId
      ? `/properties/${propertyId}/apply?viewing_id=${completedViewingId}`
      : `/properties/${propertyId}/apply`
    router.push(applyUrl)
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (authLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-orange-500 mx-auto mb-3" />
          <p className={`font-medium text-sm ${theme === "dark" ? "text-white/70" : "text-slate-600"}`}>Verifying account...</p>
        </div>
      </div>
    )
  }

  if (isLoading && shouldShowSkeleton) {
    return (
      <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        <div className={`border-b ${theme === "dark" ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"}`}>
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
            <div className="flex items-center gap-2">
              {[20, 24, 40].map(w => <div key={w} className={`h-3.5 w-${w} bg-slate-200 dark:bg-zinc-700 rounded animate-pulse`} />)}
            </div>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <div className="h-[300px] md:h-[500px] rounded-2xl bg-slate-200 dark:bg-zinc-800 animate-pulse" />
        </div>
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {[96, 48, 72].map(h => <div key={h} className={`h-${h} bg-white dark:bg-zinc-900 rounded-xl animate-pulse`} />)}
            </div>
            <div className="space-y-4">
              <div className="h-80 bg-white dark:bg-zinc-900 rounded-xl animate-pulse" />
              <div className="h-40 bg-white dark:bg-zinc-900 rounded-xl animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error && !propertyData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        <div className="text-center max-w-md mx-auto px-4">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${theme === "dark" ? "bg-zinc-800" : "bg-slate-100"}`}>
            <Home className={`h-8 w-8 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
          </div>
          <h2 className={`text-xl font-bold mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Property Not Available</h2>
          <p className={`text-sm mb-6 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{error}</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600" disabled={isLoading}>
              {isLoading ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Retrying…</> : "Try Again"}
            </Button>
            <Button variant="outline" onClick={() => router.push("/properties")}>Browse All</Button>
          </div>
        </div>
      </div>
    )
  }

  if (!propertyData) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${theme === "dark" ? "bg-black" : "bg-slate-50"}`}>
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // MAIN RENDER
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className={`min-h-screen ${theme === "dark" ? "bg-black" : "bg-[#F8F7F4]"}`}>

      {/* ── Marketplace Header (same as properties page, but without second row) ──────────────── */}
      <MarketplaceHeader hideSecondRow={true} />

      {/* ── Breadcrumb ──────────────────────────────────────────────────────── */}
      <div className={`${theme === "dark" ? "bg-zinc-900/80 border-white/5" : "bg-white border-slate-200"} border-b`}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2.5">
          <nav className="flex items-center gap-1.5 text-xs md:text-sm overflow-x-auto scrollbar-hide">
            <Link href="/" className={`hover:text-orange-600 transition-colors font-medium whitespace-nowrap ${theme === "dark" ? "text-white/60" : "text-slate-500"}`}>Home</Link>
            <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ${theme === "dark" ? "text-white/20" : "text-slate-300"}`} />
            <Link href="/properties" className={`hover:text-orange-600 transition-colors font-medium whitespace-nowrap ${theme === "dark" ? "text-white/60" : "text-slate-500"}`}>Properties</Link>
            <ChevronRight className={`h-3.5 w-3.5 flex-shrink-0 ${theme === "dark" ? "text-white/20" : "text-slate-300"}`} />
            <span className="text-orange-600 font-semibold whitespace-nowrap">
              {propertyData.title}
            </span>
          </nav>
        </div>
      </div>



















            {/* ── Gallery ─────────────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-5 pb-3">
        <div className="grid grid-cols-4 gap-1.5 h-[260px] md:h-[480px] rounded-2xl overflow-hidden">
          {/* Main image — left 50% */}
          <div
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-slate-200 dark:bg-zinc-800"
            onClick={() => { setSelectedImage(0); setShowGallery(true) }}
          >
            <img
              src={propertyData.images[0]}
              alt="Main"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            {/* Badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5">
              {propertyData.featured && (
                <span className="bg-orange-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md">⭐ Featured</span>
              )}
              {propertyData.landlord?.verified && (
                <span className="bg-emerald-500 text-white text-[11px] font-bold px-2.5 py-1 rounded-lg shadow-md flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Verified
                </span>
              )}
            </div>

            {/* Share / Save overlay top-right */}
            <div className="absolute top-3 right-3 flex gap-1.5">
              <button
                onClick={e => { e.stopPropagation(); shareProperty() }}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105"
              >
                <Share2 className="h-3.5 w-3.5 text-slate-700" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); toggleFavorite() }}
                disabled={isTogglingFavorite}
                className="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md transition-all hover:scale-105 disabled:opacity-50"
              >
                <Heart className={`h-3.5 w-3.5 transition-colors ${isFavorite ? "fill-red-500 text-red-500" : "text-slate-700"} ${isTogglingFavorite ? "animate-pulse" : ""}`} />
              </button>
            </div>
          </div>

          {/* 4 smaller images — right 50% in a 2×2 grid */}
          {propertyData.images.slice(1, 5).map((img: string, i: number) => (
            <div
              key={i}
              className="relative group cursor-pointer overflow-hidden bg-slate-200 dark:bg-zinc-800"
              onClick={() => { setSelectedImage(i + 1); setShowGallery(true) }}
            >
              <img
                src={img}
                alt={`View ${i + 2}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/15 transition-colors" />
              {i === 3 && (
                <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                  <button className="bg-white hover:bg-slate-50 text-slate-900 text-xs font-semibold px-3 py-1.5 rounded-lg flex items-center gap-1.5 shadow-md transition-all hover:scale-105">
                    <Grid className="h-3.5 w-3.5" />
                    All {propertyData.images.length} photos
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* ── Main content grid ────────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-28 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-8 items-start">

          {/* ════════════════════════════════════════════════════════════════
              LEFT / MAIN CONTENT  (2/3)
          ════════════════════════════════════════════════════════════════ */}
          <div className="lg:col-span-2 space-y-4">

            {/* Title & price card */}
            <Card className="border-0 shadow-sm rounded-2xl overflow-hidden dark:bg-zinc-900 dark:border-white/5">
              <CardContent className="p-5 md:p-7">

                {/* Title row */}
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3 mb-4">
                  <div className="flex-1 min-w-0">
                    <h1 className={`text-2xl md:text-[1.75rem] font-bold leading-tight mb-2 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>
                      {propertyData.title}
                    </h1>
                    <div className={`flex items-center gap-1.5 text-sm mb-3 ${theme === "dark" ? "text-white/60" : "text-slate-500"}`}>
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span>{propertyData.location}</span>
                    </div>

                    {/* Verification badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        { label: "Verified Property",   color: `bg-emerald-50 border-emerald-200 text-emerald-700 ${theme === "dark" ? "dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300" : ""}`,  icon: CheckCircle2 },
                        ...(propertyData.landlord?.verified ? [{ label: "Verified Landlord", color: `bg-blue-50 border-blue-200 text-blue-700 ${theme === "dark" ? "dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300" : ""}`, icon: Shield }] : []),
                        { label: "Verified Documents",  color: `bg-purple-50 border-purple-200 text-purple-700 ${theme === "dark" ? "dark:bg-purple-950/40 dark:border-purple-800 dark:text-purple-300" : ""}`, icon: Check },
                        { label: propertyData.availability || "Available Now", color: `bg-orange-50 border-orange-200 text-orange-700 ${theme === "dark" ? "dark:bg-orange-950/40 dark:border-orange-800 dark:text-orange-300" : ""}`, icon: Eye },
                      ].map(({ label, color, icon: Icon }) => (
                        <span key={label} className={`inline-flex items-center gap-1 border text-[11px] font-semibold px-2 py-0.5 rounded-md ${color}`}>
                          <Icon className="h-3 w-3" />{label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Price */}
                  <div className="shrink-0 text-left md:text-right">
                    <div className="text-3xl md:text-4xl font-bold text-orange-600 leading-none">
                      {formatPrice(propertyData.price)}
                    </div>
                    <div className={`text-sm mt-1 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>/month</div>
                  </div>
                </div>

                {/* Key specs row */}
                <div className={`flex flex-wrap gap-x-6 gap-y-2 py-4 border-t border-b mb-4 ${theme === "dark" ? "border-white/10" : "border-slate-100"}`}>
                  {[
                    { icon: Bed,    val: propertyData.beds || propertyData.bedrooms || 0,            label: "Beds"  },
                    { icon: Bath,   val: propertyData.baths || propertyData.bathrooms || 0,          label: "Baths" },
                    { icon: Square, val: propertyData.sqft || propertyData.square_feet || 0,         label: "sqft"  },
                    { icon: Home,   val: propertyData.type || "Apartment",                            label: "Type"  },
                  ].map(({ icon: Icon, val, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <Icon className={`h-4.5 w-4.5 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                      <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{val}</span>
                      <span className={`text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{label}</span>
                    </div>
                  ))}
                </div>

                {/* Pricing breakdown — matches agreement & application pages exactly */}
                {(() => {
                  const breakdown = calculateRentalBreakdown(propertyData)
                  const { monthlyRent, annualRent, periodRent, cautionFee, platformFee, serviceCharge, totalDue, periodLabel, paymentFrequency } = breakdown
                  const frequencyMultiplier = getPaymentFrequencyMultiplier(paymentFrequency)

                  return (
                    <div className={`bg-gradient-to-r rounded-xl p-4 md:p-5 ${theme === "dark" ? "from-orange-950/30 to-blue-950/30 border border-orange-900/30" : "from-orange-50/70 to-blue-50/70 border border-orange-100"}`}>
                      <h3 className={`text-sm font-bold mb-3 flex items-center gap-2 ${theme === "dark" ? "text-white/90" : "text-slate-800"}`}>
                        <TrendingDown className="h-4 w-4 text-green-600" />
                        What You'll Pay on Move-In
                        <span className={`ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full ${theme === "dark" ? "bg-green-900/40 text-green-400" : "bg-green-100 text-green-700"}`}>Zero Agency Fee</span>
                      </h3>

                      <div className="space-y-2">
                        {/* Monthly rent — context line */}
                        <div className="flex justify-between items-center text-sm">
                          <span className={`${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>Monthly Rent</span>
                          <span className={`font-medium ${theme === "dark" ? "text-white/70" : "text-slate-600"}`}>{formatPrice(monthlyRent)}</span>
                        </div>

                        {/* Period rent — the actual charge based on payment frequency */}
                        <div className="flex justify-between items-center text-sm">
                          <span className={`font-medium ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>{periodLabel} <span className={`font-normal ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>(×{frequencyMultiplier})</span></span>
                          <span className={`font-semibold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{formatPrice(periodRent)}</span>
                        </div>

                        {/* Caution Fee - show as waived when 0 */}
                        <div className="flex justify-between items-center text-sm">
                          <div className="flex flex-col">
                            <span className={`${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>Caution Fee <span className={`text-xs ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>(Security Deposit)</span></span>
                            <span className="text-xs text-blue-600 font-medium">{cautionFee > 0 ? "2 months' rent" : "Waived for MVP"}</span>
                          </div>
                          <div className="text-right">
                            <span className={`font-semibold ${cautionFee === 0 ? "text-green-600" : theme === "dark" ? "text-white" : "text-slate-900"}`}>                              {cautionFee === 0 ? "₦0 — Waived" : formatPrice(cautionFee)}                            </span>
                            {cautionFee > 0 && <div className={`text-xs ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{formatPrice(monthlyRent)} × 2</div>}
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className={`${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>Platform Fee</span>
                          <span className={`font-semibold ${platformFee === 0 ? "text-green-600" : theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {platformFee === 0 ? "₦0 — Waived" : formatPrice(platformFee)}
                          </span>
                        </div>

                        <div className="flex justify-between items-center text-sm">
                          <span className={`${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>Service Charge</span>
                          <span className={`font-semibold ${serviceCharge === 0 ? "text-green-600" : theme === "dark" ? "text-white" : "text-slate-900"}`}>
                            {serviceCharge === 0 ? "₦0 — Waived" : formatPrice(serviceCharge)}
                          </span>
                        </div>

                        {/* Total */}
                        <div className={`border-t pt-2.5 mt-1 flex justify-between items-center ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
                          <div className="flex flex-col">
                            <span className={`font-bold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Total Due on Move-In</span>
                            <span className={`text-[11px] ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                              {cautionFee > 0 ? `${periodLabel.toLowerCase()} + 2 months deposit` : periodLabel.toLowerCase()}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="text-lg font-bold text-orange-600">{formatPrice(totalDue)}</span>
                            <div className={`text-[11px] ${theme === "dark" ? "text-white/30" : "text-slate-400"}`}>
                              {platformFee > 0 ? " + fees" : serviceCharge > 0 ? " + fees" : ""}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            {/* Tabbed content card */}
            <Card className={`border-0 shadow-sm rounded-2xl overflow-hidden ${theme === "dark" ? "dark:bg-zinc-900 dark:border-white/5" : ""}`}>
              <CardContent className="p-0">

                {/* Tab bar */}
                <div className={`flex border-b overflow-x-auto scrollbar-hide ${theme === "dark" ? "border-white/10" : "border-slate-100"}`}>
                  {(["description", "amenities", "landlord", "location"] as Tab[]).map(tab => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-5 py-3.5 text-sm font-semibold whitespace-nowrap border-b-2 transition-all capitalize ${
                        activeTab === tab
                          ? "text-orange-600 border-orange-600 bg-orange-50/50 dark:bg-orange-950/20"
                          : theme === "dark"
                            ? "text-white/50 border-transparent hover:text-white hover:bg-white/5"
                            : "text-slate-500 border-transparent hover:text-slate-900 hover:bg-slate-50"
                      }`}
                    >
                      {tab === "landlord" ? "Landlord" : tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="p-5 md:p-7">

                  {/* ── Description ── */}
                  {activeTab === "description" && (
                    <div>
                      <h2 className={`text-lg font-bold mb-3 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>About this property</h2>
                      <p className={`leading-relaxed text-sm whitespace-pre-line ${theme === "dark" ? "text-white/70" : "text-slate-600"}`}>
                        {propertyData.description}
                      </p>
                      <div className={`mt-5 flex items-start gap-2.5 p-3.5 border rounded-xl ${theme === "dark" ? "bg-blue-950/40 border-blue-900/50" : "bg-blue-50 border-blue-100"}`}>
                        <CheckCircle2 className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                        <p className={`text-xs ${theme === "dark" ? "text-blue-300" : "text-blue-700"}`}>
                          <strong>Verified listing:</strong> This property was verified{propertyData.lastVerified ? ` on ${propertyData.lastVerified}` : ""}. Landlord details are locked after verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* ── Amenities ── */}
                  {activeTab === "amenities" && (
                    <div>
                      <h2 className={`text-lg font-bold mb-4 ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Amenities & Features</h2>
                      {(propertyData.amenities || []).length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {(propertyData.amenities || []).map((amenity: string, i: number) => {
                            const Icon = getAmenityIcon(amenity)
                            return (
                              <div key={i} className={`flex items-center gap-3 p-3 border rounded-xl transition-colors ${theme === "dark" ? "bg-zinc-800 border-zinc-700 hover:bg-orange-950/30 hover:border-orange-800/50" : "bg-slate-50 border-slate-100 hover:bg-orange-50 hover:border-orange-200"}`}>
                                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${theme === "dark" ? "bg-orange-900/40" : "bg-orange-100"}`}>
                                  <Icon className="h-4.5 w-4.5 text-orange-600" />
                                </div>
                                <span className={`text-sm font-medium ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>{amenity}</span>
                              </div>
                            )
                          })}
                        </div>
                      ) : (
                        <p className={`text-sm ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>No amenities listed for this property.</p>
                      )}
                    </div>
                  )}

                  {/* ── Landlord ── */}
                  {activeTab === "landlord" && (
                    <div className="space-y-4">
                      <h2 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Landlord Information</h2>

                      {/* Profile */}
                      <div className={`flex items-start gap-4 p-4 rounded-xl border ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100"}`}>
                        <Avatar className="h-16 w-16 ring-2 ring-orange-100">
                          <AvatarImage src={propertyData.landlord?.avatar_url} />
                          <AvatarFallback className="bg-orange-500 text-white text-xl font-bold">
                            {propertyData.landlord?.name?.[0] || "L"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <h3 className={`font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{propertyData.landlord?.name || "Property Owner"}</h3>
                            {propertyData.landlord?.verifiedId && (
                              <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-0.5">
                                <CheckCircle2 className="h-2.5 w-2.5" /> ID Verified
                              </span>
                            )}
                          </div>
                          <p className={`text-xs mb-2 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>Member since {propertyData.landlord?.joined_year || 2024}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span><strong className={`${theme === "dark" ? "text-white" : "text-slate-900"}`}>{Math.max(1, propertyData.landlord?.properties_count || 0)}</strong> <span className={`${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>properties</span></span>
                            <span><strong className="text-green-600">{propertyData.landlord?.trust_score || 50}%</strong> <span className={`${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>trust</span></span>
                          </div>
                          <div className="flex mt-1.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className={`text-xs ml-1 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>(4.9)</span>
                          </div>
                        </div>
                      </div>

                      {/* Contact */}
                      {user ? (
                        <div className={`p-4 rounded-xl border space-y-2 ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100"}`}>
                          <h4 className={`text-sm font-semibold mb-2 ${theme === "dark" ? "text-white/90" : "text-slate-800"}`}>Contact Information</h4>
                          <div className={`flex items-center gap-2.5 text-sm ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                            <Phone className={`h-4 w-4 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                            <span>{propertyData.landlord?.phone || "Contact via chat"}</span>
                          </div>
                          <div className={`flex items-center gap-2.5 text-sm ${theme === "dark" ? "text-white/70" : "text-slate-700"}`}>
                            <Mail className={`h-4 w-4 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                            <span className="truncate">{propertyData.landlord?.email || "Contact via chat"}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-xl">
                          <div className="flex items-center gap-2 mb-2">
                            <Lock className="h-4 w-4 text-orange-600" />
                            <p className="text-sm font-semibold text-orange-900">Contact Details Protected</p>
                          </div>
                          <p className="text-xs text-orange-700 mb-3">Sign in to view the landlord's phone and email. This protects both parties from spam and fraud.</p>
                          <Button size="sm" className="w-full bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                            onClick={() => router.push(`/signin?redirect_to=${encodeURIComponent(`/properties/${propertyId}`)}`)}
                          >
                            Sign In to View Contact
                          </Button>
                        </div>
                      )}

                      {/* Trust */}
                      <div className={`p-4 border rounded-xl ${theme === "dark" ? "bg-blue-950/40 border-blue-900/50" : "bg-blue-50 border-blue-100"}`}>
                        <h4 className={`text-sm font-semibold mb-2 flex items-center gap-1.5 ${theme === "dark" ? "text-blue-300" : "text-blue-900"}`}>
                          <Shield className="h-4 w-4" /> Trust & Safety
                        </h4>
                        <ul className="space-y-1">
                          {["Identity verified by Nulo Africa", "Responds within 24 hours", "Messages protected by escrow system", "Fair use policy enforced"].map(item => (
                            <li key={item} className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-blue-300/80" : "text-blue-700"}`}>
                              <Check className="h-3 w-3 flex-shrink-0" />{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}

                  {/* ── Location ── */}
                  {activeTab === "location" && (
                    <div className="space-y-4">
                      <h2 className={`text-lg font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>Location & Neighbourhood</h2>

                      {/* Address */}
                      <div className={`flex items-start gap-3 p-3.5 border rounded-xl ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100"}`}>
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${theme === "dark" ? "bg-orange-900/40" : "bg-orange-100"}`}>
                          <MapPin className="h-4 w-4 text-orange-600" />
                        </div>
                        <div>
                          <p className={`font-semibold text-sm ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{propertyData.full_address || propertyData.location}</p>
                          <p className={`text-xs mt-0.5 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{propertyData.city}, {propertyData.state}, Nigeria</p>
                        </div>
                      </div>

                      {/* Map placeholder */}
                      <div className={`relative h-56 md:h-72 rounded-xl overflow-hidden border ${theme === "dark" ? "border-zinc-700 bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900" : "border-slate-200 bg-gradient-to-br from-blue-50 via-green-50 to-orange-50"}`}>
                        {/* Grid pattern */}
                        <div className={`absolute inset-0 opacity-20 grid grid-cols-10 grid-rows-8 ${theme === "dark" ? "opacity-10" : ""}`}>
                          {[...Array(80)].map((_, i) => <div key={i} className={`${theme === "dark" ? "border-white/5" : "border-slate-300/40"} border`} />)}
                        </div>
                        {/* Pin */}
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <div className="w-14 h-14 bg-orange-500 rounded-full border-4 border-white shadow-2xl flex items-center justify-center mx-auto mb-3">
                              <MapPin className="h-7 w-7 text-white" />
                            </div>
                            <div className={`backdrop-blur px-4 py-2 rounded-xl shadow-lg ${theme === "dark" ? "bg-black/80" : "bg-white/95"}`}>
                              <p className={`text-sm font-bold ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{propertyData.location || "Property Location"}</p>
                              <p className={`text-xs ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{propertyData.city || "Lagos"}, Nigeria</p>
                            </div>
                          </div>
                        </div>
                        {/* Coords */}
                        <div className={`absolute bottom-3 left-3 backdrop-blur px-2 py-1 rounded-lg text-xs ${theme === "dark" ? "bg-black/80 text-white/50" : "bg-white/90 text-slate-500"}`}>
                          {propertyData.latitude?.toFixed(4) || "6.5244"}°N, {propertyData.longitude?.toFixed(4) || "3.3792"}°E
                        </div>
                      </div>

                      {/* Nearby */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className={`p-3.5 border rounded-xl ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100"}`}>
                          <h4 className={`text-sm font-semibold mb-2.5 ${theme === "dark" ? "text-white/90" : "text-slate-800"}`}>🚌 Transport</h4>
                          {[["Lekki Bus Stop","5 min walk"],["Eko Hotel","10 min drive"],["Victoria Island","15 min drive"]].map(([name,time]) => (
                            <div key={name} className="flex justify-between items-center py-1">
                              <span className={`text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>{name}</span>
                              <span className="text-xs text-green-600 font-medium">{time}</span>
                            </div>
                          ))}
                        </div>
                        <div className={`p-3.5 border rounded-xl ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100"}`}>
                          <h4 className={`text-sm font-semibold mb-2.5 ${theme === "dark" ? "text-white/90" : "text-slate-800"}`}>🏫 Nearby</h4>
                          {[["Corona School","2 km"],["Shoprite Mall","1.5 km"],["Lekki Clinic","3 km"]].map(([name,dist]) => (
                            <div key={name} className="flex justify-between items-center py-1">
                              <span className={`text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>{name}</span>
                              <span className="text-xs text-green-600 font-medium">{dist}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Similar properties CTA */}
                      <div className={`flex items-center justify-between p-4 border rounded-xl ${theme === "dark" ? "bg-orange-950/30 border-orange-900/50" : "bg-orange-50 border-orange-100"}`}>
                        <div>
                          <p className={`text-sm font-semibold ${theme === "dark" ? "text-orange-300" : "text-orange-900"}`}>Explore similar properties</p>
                          <p className={`text-xs ${theme === "dark" ? "text-orange-400" : "text-orange-600"}`}>In {propertyData.city || "this area"}</p>
                        </div>
                        <Link href="/properties">
                          <Button size="sm" className="bg-orange-500 hover:bg-orange-600 text-white rounded-lg">
                            <ArrowRight className="h-3.5 w-3.5 mr-1" /> Browse
                          </Button>
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* ════════════════════════════════════════════════════════════════
              RIGHT / SIDEBAR  (1/3) — sticky on desktop
          ════════════════════════════════════════════════════════════════ */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-32 space-y-4">

              {/* ── Main action card ─────────────────────────────────── */}
              <Card className={`border-0 shadow-lg rounded-2xl overflow-hidden ${theme === "dark" ? "dark:bg-zinc-900 dark:border-white/5" : ""}`}>
                <CardContent className="p-5">

                  {/* Landlord mini-profile */}
                  <div className={`flex items-center gap-3 pb-4 mb-4 border-b ${theme === "dark" ? "border-white/10" : "border-slate-100"}`}>
                    <Avatar className="h-11 w-11 ring-2 ring-orange-100">
                      <AvatarImage src={propertyData.landlord?.avatar_url} />
                      <AvatarFallback className="bg-orange-500 text-white font-bold text-sm">
                        {propertyData.landlord?.name?.[0] || "L"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className={`font-semibold text-sm truncate ${theme === "dark" ? "text-white" : "text-slate-900"}`}>{propertyData.landlord?.name || "Property Owner"}</p>
                        {propertyData.landlord?.verified && (
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 flex-shrink-0" />
                        )}
                      </div>
                      <p className={`text-xs ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>{propertyData.landlord?.properties_count || 0} properties listed</p>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-orange-600">{formatPrice(propertyData.price)}</div>
                      <div className={`text-[10px] ${theme === "dark" ? "text-white/30" : "text-slate-400"}`}>/month</div>
                    </div>
                  </div>

                  {/* Protected contact */}
                  {user ? (
                    <div className={`space-y-1.5 pb-4 mb-4 border-b ${theme === "dark" ? "border-white/10" : "border-slate-100"}`}>
                      <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                        <Phone className={`h-3.5 w-3.5 flex-shrink-0 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                        {propertyData.landlord?.phone || "Contact via chat"}
                      </div>
                      <div className={`flex items-center gap-2 text-xs ${theme === "dark" ? "text-white/60" : "text-slate-600"}`}>
                        <Mail className={`h-3.5 w-3.5 flex-shrink-0 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`} />
                        <span className="truncate">{propertyData.landlord?.email || "Contact via chat"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mb-4">
                      <div className="flex items-center gap-1.5 mb-1">
                        <Lock className="h-3.5 w-3.5 text-orange-600" />
                        <p className="text-xs font-semibold text-orange-900">Contact Protected</p>
                      </div>
                      <p className="text-[11px] text-orange-700 mb-2">Sign in to view contact details</p>
                      <Button size="sm" className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg"
                        onClick={() => router.push(`/signin?redirect_to=${encodeURIComponent(`/properties/${propertyId}`)}`)}
                      >
                        Sign In to View
                      </Button>
                    </div>
                  )}

                  {/* ── PRIMARY CTAs ─────────────────────────────────── */}
                  <div className="space-y-2.5">

                    {/* Already-requested banner */}
                    {hasExistingViewing && (
                      <div className={`flex items-start gap-2 p-3 border rounded-xl ${theme === "dark" ? "bg-blue-950/40 border-blue-900/50" : "bg-blue-50 border-blue-200"}`}>
                        <CheckCircle2 className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className={`text-xs font-semibold ${theme === "dark" ? "text-blue-300" : "text-blue-800"}`}>Viewing Request Sent</p>
                          <p className={`text-[11px] mt-0.5 ${theme === "dark" ? "text-blue-300/80" : "text-blue-600"}`}>
                            Awaiting landlord confirmation. You can apply while you wait.
                          </p>
                        </div>
                      </div>
                    )}
                    {/* Already-applied banner */}
                    {hasExistingApplication && (
                      <div className={`flex items-start gap-2 p-3 border rounded-xl ${theme === "dark" ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50 border-emerald-200"}`}>
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className={`text-xs font-semibold ${theme === "dark" ? "text-emerald-300" : "text-emerald-800"}`}>Application Submitted</p>
                          <p className={`text-[11px] mt-0.5 ${theme === "dark" ? "text-emerald-300/80" : "text-emerald-700"}`}>
                            You've already applied for this property! Check your applications dashboard to see its status.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Viewing type — 3-option segmented control */}
                    <div>
                      <p className={`text-[11px] font-semibold uppercase tracking-wider mb-1.5 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>
                        Viewing Type
                      </p>
                      <div className={`flex rounded-xl p-1 gap-1 ${theme === "dark" ? "bg-zinc-800" : "bg-slate-100"}`}>

                        {/* Physical — always available */}
                        <button
                          onClick={() => !hasExistingViewing && setViewingType("PHYSICAL")}
                          className={`flex-1 flex items-center justify-center gap-1 h-9 text-[11px] font-bold rounded-lg transition-all ${
                            hasExistingViewing
                              ? "text-slate-300 cursor-not-allowed"
                              : viewingType === "PHYSICAL"
                                ? `bg-white ${theme === "dark" ? "text-orange-500 shadow-md" : "text-orange-600 shadow-sm"}`
                                : theme === "dark" ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Calendar className="h-3.5 w-3.5 flex-shrink-0" />
                          Physical
                        </button>

                        {/* Virtual — premium feature, show "Coming Soon" toast (SRCH-08) */}
                        <button
                          onClick={() => {
                            if (hasExistingViewing) return
                            if (propertyData.video_tour_url) {
                              setViewingType("VIRTUAL")
                            } else {
                              handleVirtualComingSoon()
                            }
                          }}
                          disabled={hasExistingViewing}
                          title={hasExistingViewing ? undefined : "360° virtual inspection - coming soon"}
                          className={`flex-1 flex flex-col items-center justify-center gap-0 h-9 text-[11px] font-bold rounded-lg transition-all ${
                            hasExistingViewing
                              ? theme === "dark" ? "text-white/20 cursor-not-allowed" : "text-slate-300 cursor-not-allowed"
                              : propertyData.video_tour_url
                                ? viewingType === "VIRTUAL"
                                  ? `bg-white ${theme === "dark" ? "text-blue-500 shadow-md" : "text-blue-600 shadow-sm"}`
                                  : theme === "dark" ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
                                : theme === "dark" ? "text-amber-400 hover:text-amber-300 hover:bg-amber-950/30" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            {propertyData.video_tour_url ? (
                              <Video className="h-3.5 w-3.5 flex-shrink-0" />
                            ) : (
                              <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                            )}
                            Virtual
                          </div>
                          {!propertyData.video_tour_url && !hasExistingViewing && (
                            <span className="text-[9px] font-normal leading-none -mt-0.5">(Soon)</span>
                          )}
                        </button>

                        {/* Live Video — always available (scheduled call) */}
                        <button
                          onClick={() => !hasExistingViewing && setViewingType("LIVE_VIDEO")}
                          className={`flex-1 flex items-center justify-center gap-1 h-9 text-[11px] font-bold rounded-lg transition-all ${
                            hasExistingViewing
                              ? theme === "dark" ? "text-white/20 cursor-not-allowed" : "text-slate-300 cursor-not-allowed"
                              : viewingType === "LIVE_VIDEO"
                                ? `bg-white ${theme === "dark" ? "text-purple-500 shadow-md" : "text-purple-600 shadow-sm"}`
                                : theme === "dark" ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
                          }`}
                        >
                          <Video className="h-3.5 w-3.5 flex-shrink-0" />
                          Live
                        </button>

                      </div>
                    </div>

                    {/* Single action button — tracks selected type */}
                    <Button
                      disabled={hasExistingViewing || isCheckingViewings}
                      className={`w-full h-12 text-sm font-bold text-white rounded-xl shadow-md transition-all group
                        ${hasExistingViewing || isCheckingViewings
                          ? theme === "dark" ? "bg-zinc-700 cursor-not-allowed shadow-none" : "bg-slate-300 cursor-not-allowed shadow-none"
                          : viewingType === "PHYSICAL"
                            ? "bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 shadow-orange-100 dark:shadow-orange-900/30 hover:shadow-lg"
                            : viewingType === "VIRTUAL"
                              ? "bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-blue-100 dark:shadow-blue-900/30 hover:shadow-lg"
                              : "bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 shadow-purple-100 dark:shadow-purple-900/30 hover:shadow-lg"
                        }`}
                      onClick={() => handleRequestViewing(viewingType)}
                    >
                      {isCheckingViewings ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Checking…
                        </>
                      ) : hasExistingViewing ? (
                        <>
                          <CheckCircle2 className="h-4.5 w-4.5 mr-2" />
                          Viewing Already Requested
                        </>
                      ) : viewingType === "PHYSICAL" ? (
                        <>
                          <Calendar className="h-4.5 w-4.5 mr-2 group-hover:scale-110 transition-transform" />
                          Schedule Physical Viewing
                        </>
                      ) : viewingType === "VIRTUAL" ? (
                        <>
                          <Video className="h-4.5 w-4.5 mr-2 group-hover:scale-110 transition-transform" />
                          Request Virtual Tour
                        </>
                      ) : (
                        <>
                          <Video className="h-4.5 w-4.5 mr-2 group-hover:scale-110 transition-transform" />
                          Request Live Video Tour
                        </>
                      )}
                    </Button>

                    {/* Secondary row: Chat + Save */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        variant="outline"
                        className={`h-10 text-xs font-semibold border-2 rounded-xl group transition-all ${theme === "dark" ? "border-blue-800 text-blue-400 hover:border-blue-600 hover:bg-blue-950/30" : "border-blue-200 text-blue-700 hover:border-blue-400 hover:bg-blue-50"}`}
                        onClick={handleChatLandlord}
                      >
                        <MessageCircle className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                        Chat
                      </Button>
                      <Button
                        variant="outline"
                        className={`h-10 text-xs font-semibold border-2 rounded-xl group transition-all disabled:opacity-50 ${
                          isFavorite
                            ? theme === "dark" ? "border-red-800 bg-red-950/30 text-red-400 hover:bg-red-950/50" : "border-red-200 bg-red-50 text-red-700 hover:bg-red-100"
                            : theme === "dark" ? "border-zinc-600 text-white/60 hover:border-red-700 hover:bg-red-950/30 hover:text-red-400" : "border-slate-200 text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                        }`}
                        onClick={toggleFavorite}
                        disabled={isTogglingFavorite}
                      >
                        <Heart className={`h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform ${isFavorite ? "fill-red-500 text-red-500" : ""} ${isTogglingFavorite ? "animate-pulse" : ""}`} />
                        {isFavorite ? "Saved" : "Save"}
                      </Button>
                    </div>

                    {/* ══════════════════════════════════════════════════
                        APPLY NOW — from apply-button-sidebar.tsx
                        Separated by divider to signal a different intent
                    ══════════════════════════════════════════════════ */}
                    <div className={`pt-2 border-t ${theme === "dark" ? "border-white/10" : "border-slate-100"}`}>

                      {/* Smart banner when viewing already scheduled */}
                      {completedViewingId && user && (
                        <div className={`flex items-start gap-2 p-3 border rounded-xl mb-2.5 ${theme === "dark" ? "bg-emerald-950/30 border-emerald-900/50" : "bg-emerald-50 border-emerald-200"}`}>
                          <CheckCircle2 className="h-4 w-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className={`text-xs font-semibold ${theme === "dark" ? "text-emerald-300" : "text-emerald-800"}`}>Viewing Scheduled!</p>
                            <p className={`text-[11px] ${theme === "dark" ? "text-emerald-300/80" : "text-emerald-700"}`}>Ready to take the next step?</p>
                          </div>
                        </div>
                      )}

                      <Button
                        disabled={hasExistingApplication || isCheckingApplications}
                        className={`w-full h-12 font-bold text-sm rounded-xl shadow-md group transition-all hover:shadow-lg
                          ${hasExistingApplication || isCheckingApplications
                            ? theme === "dark" ? "bg-zinc-700 cursor-not-allowed shadow-none" : "bg-slate-300 cursor-not-allowed shadow-none"
                            : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-100 dark:shadow-emerald-900/30"
                          }`}
                        onClick={handleApply}
                      >
                        {isCheckingApplications ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Checking…
                          </>
                        ) : hasExistingApplication ? (
                          <>
                            <CheckCircle2 className="h-4.5 w-4.5 mr-2" />
                            Applied
                          </>
                        ) : (
                          <>
                            <FileText className="h-4.5 w-4.5 mr-2 group-hover:scale-110 transition-transform" />
                            Apply for This Property
                          </>
                        )}
                      </Button>
                      <p className={`text-center text-[11px] mt-1.5 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>
                        {completedViewingId ? "Viewing linked to your application" : "Viewing recommended before applying"}
                      </p>

                      {/* Continue in PropFlow — resume the AI search and apply from the chat */}
                      {user && user.user_type !== "landlord" && (
                        <button
                          onClick={() => router.push("/tenant?propflow=1")}
                          className={`w-full h-10 mt-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
                            theme === "dark" ? "border-orange-500/30 text-orange-400 hover:bg-orange-950/30" : "border-orange-200 text-orange-600 hover:bg-orange-50"
                          }`}
                        >
                          <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
                          Continue in PropFlow to Apply
                        </button>
                      )}
                    </div>

                    {/* Report — ghost, low prominence */}
                    <Button
                      variant="ghost"
                      className={`w-full h-8 text-xs rounded-lg group transition-all ${theme === "dark" ? "text-white/30 hover:text-red-400 hover:bg-red-950/30" : "text-slate-400 hover:text-red-600 hover:bg-red-50"}`}
                      onClick={handleReportConcern}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1.5 group-hover:scale-110 transition-transform" />
                      Report Concern
                    </Button>
                  </div>

                  {/* Trust note */}
                  <div className={`mt-4 p-3 border rounded-xl ${theme === "dark" ? "bg-zinc-800 border-zinc-700" : "bg-slate-50 border-slate-100"}`}>
                    <p className={`text-[11px] leading-relaxed ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>
                      <strong className={theme === "dark" ? "text-white/80" : "text-slate-700"}>🛡️ Protected by Nulo:</strong> All interactions use our secure escrow system. Both parties can rate each other after.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Similar properties nudge */}
              <div className={`p-4 border rounded-2xl shadow-sm ${theme === "dark" ? "bg-zinc-900 border-zinc-700" : "bg-white border-slate-200"}`}>
                <p className={`text-xs font-semibold mb-0.5 ${theme === "dark" ? "text-white/80" : "text-slate-700"}`}>Not the right fit?</p>
                <p className={`text-xs mb-3 ${theme === "dark" ? "text-white/50" : "text-slate-500"}`}>Browse similar properties in {propertyData.city || "Lagos"}</p>
                <Link href="/properties">
                  <Button variant="outline" size="sm" className={`w-full h-9 text-xs rounded-xl transition-all ${theme === "dark" ? "border-zinc-600 text-white/70 hover:border-orange-500 hover:text-orange-400" : "border-slate-200 hover:border-orange-300 hover:text-orange-600"}`}>
                    Browse All Properties
                    <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>

            </div>
          </div>
          {/* ── end sidebar ── */}

        </div>
      </div>

      {/* ── MOBILE BOTTOM BAR ─────────────────────────────────────────────── */}
      <div className={`fixed bottom-0 left-0 right-0 z-50 lg:hidden border-t px-4 pt-2 pb-4 safe-area-pb ${theme === "dark" ? "bg-zinc-900 border-white/10" : "bg-white border-slate-200"}`}>

        {/* 3-tab mini segmented control */}
        <div className={`flex rounded-lg p-0.5 gap-0.5 mb-2 ${theme === "dark" ? "bg-zinc-800" : "bg-slate-100"}`}>
          {/* Physical */}
          <button
            onClick={() => !hasExistingViewing && setViewingType("PHYSICAL")}
            className={`flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-bold rounded-md transition-all ${
              hasExistingViewing
                ? theme === "dark" ? "text-white/20 cursor-not-allowed" : "text-slate-300 cursor-not-allowed"
              : viewingType === "PHYSICAL"
                ? theme === "dark" ? "bg-zinc-700 text-orange-500 shadow-sm" : "bg-white text-orange-600 shadow-sm"
              : theme === "dark" ? "text-white/50" : "text-slate-500"
            }`}
          >
            <Calendar className="h-3 w-3" /> Physical
          </button>

          {/* Virtual — premium feature, show "Coming Soon" toast (SRCH-08) */}
          <button
            onClick={() => {
              if (hasExistingViewing) return
              if (propertyData.video_tour_url) {
                setViewingType("VIRTUAL")
              } else {
                handleVirtualComingSoon()
              }
            }}
            disabled={hasExistingViewing}
            className={`flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-bold rounded-md transition-all ${
              hasExistingViewing
                ? theme === "dark" ? "text-white/20 cursor-not-allowed" : "text-slate-300 cursor-not-allowed"
                : propertyData.video_tour_url
                  ? viewingType === "VIRTUAL"
                    ? theme === "dark" ? "bg-zinc-700 text-blue-500 shadow-sm" : "bg-white text-blue-600 shadow-sm"
                    : theme === "dark" ? "text-white/50 hover:text-white/80" : "text-slate-500 hover:text-slate-700"
                  : theme === "dark" ? "text-amber-400 hover:text-amber-300" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50"
            }`}
          >
            {propertyData.video_tour_url ? <Video className="h-3 w-3" /> : <Sparkles className="h-3 w-3" />}
            Virtual
            {!propertyData.video_tour_url && !hasExistingViewing && (
              <span className="text-[9px] font-normal">(Soon)</span>
            )}
          </button>

          {/* Live */}
          <button
            onClick={() => !hasExistingViewing && setViewingType("LIVE_VIDEO")}
            className={`flex-1 flex items-center justify-center gap-1 h-7 text-[11px] font-bold rounded-md transition-all ${
              hasExistingViewing
                ? theme === "dark" ? "text-white/20 cursor-not-allowed" : "text-slate-300 cursor-not-allowed"
              : viewingType === "LIVE_VIDEO"
                ? theme === "dark" ? "bg-zinc-700 text-purple-500 shadow-sm" : "bg-white text-purple-600 shadow-sm"
              : theme === "dark" ? "text-white/50" : "text-slate-500"
            }`}
          >
            <Video className="h-3 w-3" /> Live
          </button>
        </div>

        {/* Continue in PropFlow — resume the AI search from the chat */}
        {user && user.user_type !== "landlord" && (
          <button
            onClick={() => router.push("/tenant?propflow=1")}
            className={`w-full h-9 mb-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-all border ${
              theme === "dark" ? "bg-orange-500/15 border-orange-500/30 text-orange-400" : "bg-orange-50 border-orange-200 text-orange-600"
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 flex-shrink-0" />
            Continue in PropFlow to Apply
          </button>
        )}

        <div className="flex gap-2.5">
          {/* Viewing button — tracks type, disables if already requested */}
          <Button
            disabled={hasExistingViewing || isCheckingViewings}
            className={`flex-1 h-12 text-sm font-bold text-white rounded-xl shadow-md transition-all ${
              hasExistingViewing || isCheckingViewings
                ? theme === "dark" ? "bg-zinc-700 cursor-not-allowed shadow-none" : "bg-slate-300 cursor-not-allowed shadow-none"
                : viewingType === "PHYSICAL"
                  ? "bg-gradient-to-r from-orange-500 to-orange-600"
                  : viewingType === "VIRTUAL"
                    ? "bg-gradient-to-r from-blue-500 to-blue-600"
                    : "bg-gradient-to-r from-purple-500 to-purple-600"
            }`}
            onClick={() => handleRequestViewing(viewingType)}
          >
            {isCheckingViewings ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : hasExistingViewing ? (
              <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Requested</>
            ) : (
              <><Calendar className="h-4 w-4 mr-1.5" /> Schedule Viewing</>
            )}
          </Button>

          <Button
            disabled={hasExistingApplication || isCheckingApplications}
            className={`flex-1 h-12 text-sm font-bold rounded-xl shadow-md transition-all
              ${hasExistingApplication || isCheckingApplications
                ? theme === "dark" ? "bg-zinc-700 cursor-not-allowed shadow-none text-white/50" : "bg-slate-300 cursor-not-allowed shadow-none"
                : "bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white"
              }`}
            onClick={handleApply}
          >
            {isCheckingApplications ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                Checking…
              </>
            ) : hasExistingApplication ? (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                Applied
              </>
            ) : (
              <>
                <FileText className="h-4 w-4 mr-1.5" />
                Apply Now
              </>
            )}
          </Button>
        </div>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────────── */}
      <ViewingRequestModal
        isOpen={showViewingModal}
        onClose={() => setShowViewingModal(false)}
        onSuccess={confirmViewing}
        property={propertyData}
        user={user}
        viewingType={viewingType}
        landlordResponseTime="within 24 hours"
      />

      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        propertyId={propertyData.id}
        propertyTitle={propertyData.title}
        propertyPrice={formatPrice(propertyData.price)}
        propertyImage={propertyData.images?.[0] || "/placeholder-property.jpg"}
        landlordName={propertyData.landlord?.name || "Property Owner"}
        landlordId={propertyData.landlord?.id || propertyData.landlord_id}
        landlordAvatar={propertyData.landlord?.avatar_url}
        landlordVerified={propertyData.landlord?.verified}
        landlordResponseTime="within 24 hours"
      />

      {/* Full-screen gallery */}
      {showGallery && (
        <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col">
          <div className="flex items-center justify-between p-4">
            <p className="text-white text-sm font-medium">{selectedImage + 1} / {propertyData.images.length}</p>
            <button
              onClick={() => setShowGallery(false)}
              className="w-9 h-9 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center p-4 min-h-0">
            <img
              src={propertyData.images[selectedImage]}
              alt={`Property view ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          </div>
          <div className="p-4 flex gap-2 justify-center overflow-x-auto">
            {propertyData.images.map((img: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelectedImage(i)}
                className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                  selectedImage === i ? "border-orange-500 scale-110 shadow-lg shadow-orange-500/30" : "border-white/20 hover:border-white/50"
                }`}
              >
                <img src={img} alt={`Thumb ${i + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
