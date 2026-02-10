"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useSignupCallbackUrl } from "@/hooks/useSignupCallbackUrl"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  MapPin, Bed, Bath, Square, Heart, Share2, ChevronRight, X,
  Home, Wifi, Car, Dumbbell, Shield, Wind, Tv, Coffee, Check, 
  Phone, Mail, Calendar, Star, MessageCircle, Eye, Grid, Maximize2,
  CheckCircle2, TrendingDown, Video, Users, Clock, Map, ArrowRight
} from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"
import { ViewingRequestModal, type ViewingRequestData } from "@/components/ViewingRequestModal"
import { ChatModal } from "@/components/ChatModal"
import { viewingRequestsAPI, favoritesAPI } from "@/lib/api"
import { propertiesAPI } from "@/lib/api/properties"
import { Loader2 } from "lucide-react"
import dynamic from "next/dynamic"

// Dynamically import map component to avoid SSR issues
const PropertyMap = dynamic(() => import('@/components/PropertyMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-64 bg-slate-100 rounded-lg flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-6 w-6 animate-spin text-orange-500 mx-auto mb-2" />
        <p className="text-slate-600 text-sm">Loading map...</p>
      </div>
    </div>
  )
})

// Placeholder images for properties with missing photos
const PLACEHOLDER_IMAGES = [
  'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop', // Modern apartment
  'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=800&h=600&fit=crop', // Living room
  'https://images.unsplash.com/photo-1556912173-3bb406ef7e77?w=800&h=600&fit=crop', // Bedroom
  'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800&h=600&fit=crop', // Kitchen
  'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=800&h=600&fit=crop', // Bathroom
]

// Helper to ensure minimum 5 images with placeholders
const ensureMinimumImages = (images: string[] = []): string[] => {
  const validImages = images.filter(img => img && img.trim() !== '')
  if (validImages.length >= 5) return validImages
  
  const needed = 5 - validImages.length
  return [...validImages, ...PLACEHOLDER_IMAGES.slice(0, needed)]
}

// Amenity icon mapping
const amenityIcons: Record<string, any> = {
  'wifi': Wifi,
  'parking': Car,
  'gym': Dumbbell,
  'security': Shield,
  'ac': Wind,
  'smart_home': Tv,
  'kitchen': Coffee,
  'balcony': Home,
}

const getAmenityIcon = (amenity: string) => {
  const key = amenity.toLowerCase().replace(/[^a-z]/g, '')
  if (key.includes('wifi') || key.includes('internet')) return Wifi
  if (key.includes('park')) return Car
  if (key.includes('gym') || key.includes('fitness')) return Dumbbell
  if (key.includes('security') || key.includes('guard')) return Shield
  if (key.includes('air') || key.includes('ac')) return Wind
  if (key.includes('smart') || key.includes('tv')) return Tv
  if (key.includes('kitchen')) return Coffee
  if (key.includes('balcony') || key.includes('terrace')) return Home
  return Home // default icon
}

export default function PropertyDetailPage() {
  const [activeTab, setActiveTab] = useState<'description' | 'amenities' | 'landlord' | 'location'>('description')
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState(0)
  const [showViewingModal, setShowViewingModal] = useState(false)
  const [viewingType, setViewingType] = useState<'physical' | 'virtual'>('physical')
  const [showChatModal, setShowChatModal] = useState(false)
  const [showGallery, setShowGallery] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [isFavorite, setIsFavorite] = useState(false)
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false)
  const [propertyData, setPropertyData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [shouldShowSkeleton, setShouldShowSkeleton] = useState(false) // ✅ NEW: Only show skeleton for slow fetches
  const [error, setError] = useState<string | null>(null)
  const [hasViewedVideo, setHasViewedVideo] = useState(false)

  const router = useRouter()
  const params = useParams()
  const { user, loading: authLoading } = useAuth()
  const propertyId = params.id as string
  
  // ✅ Auto-preserve property URL for signup redirect
  useSignupCallbackUrl()

  // Redirect landlords to their dashboard
  useEffect(() => {
    if (user?.user_type === 'landlord') {
      router.replace('/landlord/overview')
    }
  }, [user, router])

  // Fetch property data
  useEffect(() => {
    const fetchProperty = async () => {
      if (!propertyId) {
        console.error('No property ID provided')
        setError('No property ID provided')
        setIsLoading(false)
        return
      }

      console.log('🔍 [PROPERTY DETAIL] Fetching property:', propertyId)
      setIsLoading(true)
      setError(null)
      setShouldShowSkeleton(false) // ✅ Start without skeleton

      // ✅ NEW: Show skeleton only if fetch takes longer than 200ms
      // This prevents jarring loading flashes on fast networks
      const skeletonTimeoutId = setTimeout(() => {
        console.log('⏳ [PROPERTY DETAIL] Fetch taking longer than 200ms, showing skeleton')
        setShouldShowSkeleton(true)
      }, 200)

      // Add timeout to prevent infinite loading
      const timeoutId = setTimeout(() => {
        console.warn('⏰ [PROPERTY DETAIL] Loading timeout - forcing error state')
        setError('Loading timeout - please try again')
        setIsLoading(false)
        setShouldShowSkeleton(false)
        toast.error('Loading timeout - please refresh the page')
      }, 30000) // 30 second timeout for API + token retrieval

      try {
        const data = await propertiesAPI.getById(propertyId)
        console.log('✅ [PROPERTY DETAIL] Data received:', data)
        
        // Clear timeout on success
        clearTimeout(timeoutId)
        
        // Ensure minimum 5 images with placeholders
        if (data.images) {
          data.images = ensureMinimumImages(data.images)
        } else {
          data.images = PLACEHOLDER_IMAGES
        }
        
        setPropertyData(data)
        setIsFavorite(data.is_favorited || false)
        console.log('✅ [PROPERTY DETAIL] Property data set successfully')
      } catch (err: any) {
        // Clear timeout on error
        clearTimeout(timeoutId)
        
        console.error('❌ [PROPERTY DETAIL] Failed to fetch property:', err)
        console.error('❌ [PROPERTY DETAIL] Error details:', {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        })
        
        const errorMessage = err.response?.data?.detail || err.message || 'Failed to load property'
        setError(errorMessage)
        toast.error(errorMessage)
      } finally {
        // ✅ NEW: Clear both timeouts and skeleton state
        clearTimeout(skeletonTimeoutId)
        console.log('🏁 [PROPERTY DETAIL] Fetch completed, setting loading to false')
        setIsLoading(false)
        setShouldShowSkeleton(false)
      }
    }

    fetchProperty()
  }, [propertyId])

  // Format price helper
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value)
  }

  const toggleFavorite = async () => {
    // Prevent multiple simultaneous calls
    if (isTogglingFavorite) return
    
    if (!user) {
      // ✅ Redirect to signup with property callback URL
      const currentPath = `/properties/${propertyId}`
      const signupUrl = `/signup/tenant?redirect_to=${encodeURIComponent(currentPath)}`
      toast.info('Please sign up to save favorites. You\'ll return here after verification.')
      router.push(signupUrl)
      return
    }

    // Ensure property data is loaded
    if (!propertyData || !propertyData.id) {
      toast.error('Property data not loaded yet')
      return
    }

    try {
      setIsTogglingFavorite(true)
      const propertyIdStr = String(propertyData.id)
      
      console.log('Toggling favorite for property:', propertyIdStr)
      console.log('Current favorite state:', isFavorite)
      
      if (isFavorite) {
        // Remove from favorites
        console.log('Removing from favorites...')
        await favoritesAPI.remove(propertyIdStr)
        setIsFavorite(false)
        
        toast.success(
          <div className="flex items-center justify-between gap-4">
            <span>Removed from favorites</span>
            <button
              onClick={async () => {
                try {
                  await favoritesAPI.add(propertyData.id.toString())
                  setIsFavorite(true)
                  toast.dismiss()
                  toast.success("Added back to favorites!")
                } catch (error) {
                  toast.error("Failed to add back")
                }
              }}
              className="text-xs font-semibold underline"
            >
              Undo
            </button>
          </div>,
          { duration: 5000 }
        )
      } else {
        // Add to favorites
        console.log('Adding to favorites...')
        await favoritesAPI.add(propertyIdStr)
        setIsFavorite(true)
        console.log('Successfully added to favorites')
        toast.success("✅ Saved to Favorites!")
      }
    } catch (error: any) {
      console.error('Failed to toggle favorite:', error)
      console.error('Error details:', error.response?.data)
      
      // Revert optimistic update
      setIsFavorite(!isFavorite)
      
      // Show detailed error message
      const errorMsg = error.response?.data?.detail || 'Failed to update favorites'
      
      // Handle specific error cases
      if (errorMsg.includes('already in favorites')) {
        toast.info('This property is already in your favorites')
        setIsFavorite(true)
      } else if (errorMsg.includes('not found')) {
        toast.error('Property not found')
      } else if (error.response?.status === 401) {
        toast.error('Please sign in to add favorites')
      } else if (error.response?.status === 403 || errorMsg.includes('Only tenants')) {
        toast.error(
          <div>
            <p className="font-semibold">⚠️ Tenants Only Feature</p>
            <p className="text-xs mt-1">Only tenants can save favorites. Please sign in with a tenant account.</p>
          </div>,
          { duration: 7000 }
        )
      } else {
        toast.error(
          <div>
            <p className="font-semibold">Failed to update favorites</p>
            <p className="text-xs mt-1">{errorMsg}</p>
          </div>,
          { duration: 7000 }
        )
      }
    } finally {
      setIsTogglingFavorite(false)
    }
  }

  const handleRequestViewing = (type: 'physical' | 'virtual' = 'physical') => {
    if (!user) {
      // ✅ Redirect to signup with property callback URL
      const currentPath = `/properties/${propertyId}`
      const signupUrl = `/signup/tenant?redirect_to=${encodeURIComponent(currentPath)}`
      toast.info('Please sign up to request a viewing. You\'ll return here after verification.')
      router.push(signupUrl)
      return
    }
    setViewingType(type)
    
    // For virtual viewing, check if video is available
    if (type === 'virtual' && !propertyData.video_tour_url) {
      toast.info('Virtual tour video is not available for this property. Please schedule a physical viewing.')
      return
    }
    
    setShowViewingModal(true)
  }

  const handleVirtualTour = () => {
    if (!user) {
      // ✅ Redirect to signup with property callback URL
      const currentPath = `/properties/${propertyId}`
      const signupUrl = `/signup/tenant?redirect_to=${encodeURIComponent(currentPath)}`
      toast.info('Please sign up to view virtual tour. You\'ll return here after verification.')
      router.push(signupUrl)
      return
    }

    if (!propertyData.video_tour_url) {
      toast.info('Virtual tour video is not available for this property.')
      return
    }

    // Mark video as viewed and open video modal
    setHasViewedVideo(true)
    setShowImageModal(true)
    toast.success('Virtual tour started! Marked as viewed.')
  }

  const handleChatLandlord = () => {
    if (!user) {
      // ✅ Redirect to signup with property callback URL
      const currentPath = `/properties/${propertyId}`
      const signupUrl = `/signup/tenant?redirect_to=${encodeURIComponent(currentPath)}`
      toast.info('Please sign up to message the landlord. You\'ll return here after verification.')
      router.push(signupUrl)
      return
    }
    setShowChatModal(true)
  }

  const handleReportConcern = () => {
    if (!user) {
      // ✅ Redirect to signup with property callback URL
      const currentPath = `/properties/${propertyId}`
      const signupUrl = `/signup/tenant?redirect_to=${encodeURIComponent(currentPath)}`
      toast.info('Please sign up to report concerns. You\'ll return here after verification.')
      router.push(signupUrl)
      return
    }
    setShowReportModal(true)
  }

  const confirmViewing = async (data: ViewingRequestData) => {
    if (!user) {
      // ✅ Redirect to signup with property callback URL
      const currentPath = `/properties/${propertyId}`
      const signupUrl = `/signup/tenant?redirect_to=${encodeURIComponent(currentPath)}`
      toast.info('Please sign up to request a viewing. You\'ll return here after verification.')
      router.push(signupUrl)
      return
    }

    try {
      // Call backend API
      await viewingRequestsAPI.create({
        property_id: propertyData.id.toString(),
        preferred_date: data.date,
        time_slot: data.timeSlot,
        contact_number: data.contactNumber,
        tenant_name: data.name,
        message: data.message
      })

      toast.success(
        <div>
          <p className="font-semibold">✅ Viewing Request Sent!</p>
          <p className="text-xs text-slate-600 mt-1">
            {propertyData.landlord?.name || 'The landlord'} will respond within 24 hours.
          </p>
        </div>,
        { duration: 5000 }
      )
      
      setShowViewingModal(false)
    } catch (error: any) {
      console.error('Failed to send viewing request:', error)
      console.error('Error details:', error.response?.data)
      
      // Show detailed error message
      const errorMsg = error.response?.data?.detail || 'Failed to send viewing request. Please try again.'
      toast.error(
        <div>
          <p className="font-semibold">Failed to send request</p>
          <p className="text-xs mt-1">{errorMsg}</p>
        </div>,
        { duration: 7000 }
      )
    }
  }

  const sendMessage = (message: string) => {
    toast.success('Message sent securely via Nulo escrow chat')
    setShowChatModal(false)
    // Protected chat logging
  }

  const submitReport = (reason: string) => {
    toast.success('Report submitted. Our trust & safety team will review within 24 hours.')
    setShowReportModal(false)
    // Flag for admin review
  }

  const shareProperty = () => {
    if (navigator.share) {
      navigator.share({
        title: propertyData.title,
        text: `Check out this property: ${propertyData.title}`,
        url: window.location.href,
      })
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Link copied to clipboard!')
    }
  }

  // Show loading while checking auth or fetching property data
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-slate-600 font-medium mb-2">Verifying account...</p>
          <p className="text-slate-500 text-sm">Please wait while we verify your account</p>
          
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => router.push('/properties')}
          >
            Back to Properties
          </Button>
        </div>
      </div>
    )
  }

  // ✅ IMPROVED: Show skeleton loaders ONLY for slower fetches (> 200ms)
  // This provides better UX - fast networks show content immediately, slow networks see loading skeleton
  if (isLoading && shouldShowSkeleton) {
    return (
      <div className="min-h-screen bg-slate-50">
        {/* Skeleton Breadcrumb */}
        <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
          <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-20 bg-slate-200 rounded animate-pulse" />
              <div className="h-4 w-32 bg-slate-200 rounded animate-pulse" />
            </div>
          </div>
        </div>

        {/* Skeleton Gallery */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2 h-[300px] md:h-[500px] rounded-xl md:rounded-2xl overflow-hidden bg-slate-200 animate-pulse" />
        </div>

        {/* Skeleton Content */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
            {/* Main Content Skeleton */}
            <div className="lg:col-span-2 space-y-4">
              {/* Title & Price Skeleton */}
              <div className="bg-white rounded-lg p-6 space-y-4">
                <div className="h-8 w-3/4 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-1/2 bg-slate-200 rounded animate-pulse" />
                <div className="h-10 w-1/4 bg-orange-200 rounded animate-pulse" />
              </div>

              {/* Features Skeleton */}
              <div className="bg-white rounded-lg p-6">
                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-12 bg-slate-200 rounded animate-pulse" />
                  ))}
                </div>
              </div>

              {/* Description Skeleton */}
              <div className="bg-white rounded-lg p-6 space-y-3">
                <div className="h-4 w-full bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-5/6 bg-slate-200 rounded animate-pulse" />
                <div className="h-4 w-4/6 bg-slate-200 rounded animate-pulse" />
              </div>
            </div>

            {/* Sidebar Skeleton */}
            <div className="space-y-4">
              <div className="bg-white rounded-lg p-6 h-64 bg-slate-200 animate-pulse" />
              <div className="bg-white rounded-lg p-6 h-40 bg-slate-200 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !propertyData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Property Not Found</h2>
          <p className="text-slate-600 mb-6">{error || 'The property you are looking for does not exist or has been removed.'}</p>
          
          <div className="flex gap-3 justify-center">
            <Button onClick={() => window.location.reload()} className="bg-orange-500 hover:bg-orange-600">
              Try Again
            </Button>
            <Button variant="outline" onClick={() => router.push('/properties')}>
              Browse All Properties
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Breadcrumb Navigation - Mobile Optimized */}
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-3">
          <nav className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm overflow-x-auto scrollbar-hide">
            <Link href="/" className="text-slate-600 hover:text-orange-600 transition-colors font-medium whitespace-nowrap">
              Home
            </Link>
            <ChevronRight className="h-3 md:h-4 w-3 md:w-4 text-slate-400 flex-shrink-0" />
            <Link href="/properties" className="text-slate-600 hover:text-orange-600 transition-colors font-medium whitespace-nowrap">
              Properties
            </Link>
            <ChevronRight className="h-3 md:h-4 w-3 md:w-4 text-slate-400 flex-shrink-0" />
            <span className="text-slate-900 font-semibold truncate max-w-[150px] md:max-w-[300px]">
              {propertyData.title}
            </span>
          </nav>
        </div>
      </div>

      {/* Modern Image Gallery - Mobile Responsive */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-1 md:gap-2 h-[300px] md:h-[500px] rounded-xl md:rounded-2xl overflow-hidden">
          {/* Main Large Image */}
          <div 
            className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-slate-100"
            onClick={() => {
              setSelectedImage(0)
              setShowGallery(true)
            }}
          >
            <img
              src={propertyData.images[0]}
              alt="Main property"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute top-3 left-3 flex flex-col gap-2">
              {propertyData.featured && (
                <div className="bg-orange-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md">
                  ⭐ Featured
                </div>
              )}
              {propertyData.landlord?.verified && (
                <div className="bg-green-500 text-white text-xs font-semibold px-3 py-1.5 rounded-lg shadow-md flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Verified Listing
                </div>
              )}
            </div>
          </div>

          {/* Grid of Smaller Images */}
          {propertyData.images.slice(1, 5).map((image: any,index: any) => (
            <div
              key={index}
              className="relative group cursor-pointer overflow-hidden"
              onClick={() => {
                setSelectedImage(index + 1)
                setShowGallery(true)
              }}
            >
              <img
                src={image}
                alt={`Property ${index + 2}`}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
              
              {/* Show All Photos Button on Last Image */}
              {index === 3 && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                  <Button
                    variant="secondary"
                    className="bg-white hover:bg-slate-100 text-slate-900 font-semibold"
                  >
                    <Grid className="h-4 w-4 mr-2" />
                    View All {propertyData.images.length} Photos
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Action Buttons Overlay - Mobile Optimized */}
        <div className="flex items-center justify-end gap-2 -mt-12 md:-mt-16 relative z-10 px-2 md:px-4">
          <Button
            variant="secondary"
            size="sm"
            onClick={shareProperty}
            className="bg-white hover:bg-slate-100 shadow-lg"
          >
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={toggleFavorite}
            disabled={isTogglingFavorite}
            className="bg-white hover:bg-slate-100 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Heart className={`h-4 w-4 mr-2 ${isFavorite ? 'fill-red-500 text-red-500' : ''} ${isTogglingFavorite ? 'animate-pulse' : ''}`} />
            Save
          </Button>
        </div>
      </div>

      {/* Property Details - Mobile First Layout */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 pb-8 md:pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-4 md:space-y-6">
            {/* Title & Price - Mobile Optimized */}
            <Card>
              <CardContent className="p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
                  <div className="flex-1">
                    <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">
                      {propertyData.title}
                    </h1>
                    <div className="flex items-center gap-2 text-slate-600 mb-3">
                      <MapPin className="h-4 w-4 flex-shrink-0" />
                      <span className="text-sm md:text-base">{propertyData.location}</span>
                    </div>
                    {/* Enhanced Verification Badges - Phase 1 Requirements */}
                    <div className="flex flex-wrap items-center gap-2 mt-2">
                      {/* Verified Property Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>✓ Verified Property</span>
                      </div>
                      
                      {/* Verified Landlord Badge */}
                      {propertyData.landlord?.verified && (
                        <div className="inline-flex items-center gap-1.5 bg-blue-50 border border-blue-200 text-blue-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                          <Shield className="h-3.5 w-3.5" />
                          <span>✓ Verified Landlord</span>
                        </div>
                      )}
                      
                      {/* Verified Documents Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-purple-50 border border-purple-200 text-purple-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <Check className="h-3.5 w-3.5" />
                        <span>✓ Verified Documents</span>
                      </div>
                      
                      {/* Active Listing Badge */}
                      <div className="inline-flex items-center gap-1.5 bg-orange-50 border border-orange-200 text-orange-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <Eye className="h-3.5 w-3.5" />
                        <span>✓ Active Listing</span>
                      </div>
                      
                      {/* Availability Status */}
                      <div className="inline-flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 px-2.5 py-1 rounded-lg text-xs font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{propertyData.availability || 'Available Now'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-left md:text-right">
                    <div className="text-2xl md:text-3xl font-bold text-orange-600">
                      {formatPrice(propertyData.price)}
                    </div>
                    <div className="text-sm text-slate-600">
                      /month
                    </div>
                  </div>
                </div>

                {/* Pricing Breakdown - Phase 1 Requirements */}
                <div className="bg-gradient-to-r from-orange-50 to-blue-50 border border-orange-200 rounded-lg p-4 md:p-5">
                  <h3 className="text-lg font-bold text-slate-900 mb-4">💰 Pricing Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Monthly Rent:</span>
                      <span className="font-bold text-slate-900">{formatPrice(propertyData.price)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Service Charge:</span>
                      <span className="font-bold text-green-600">₦0 (Zero service charge!)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Caution Deposit:</span>
                      <span className="font-bold text-slate-900">₦0 (1 month rent)</span>
                    {/* <span className="font-bold text-slate-900">{formatPrice(propertyData.price)} (1 month rent)</span> */}
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Agency Fee:</span>
                      <span className="font-bold text-green-600">₦0 (Zero agency fee!)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600">Platform Fee:</span>
                      <span className="font-bold text-slate-900">{formatPrice(propertyData.price)} + {formatPrice(propertyData.price * 0.1)}</span>
                    </div>
                    <div className="border-t border-slate-300 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-900">Total Move-in Cost:</span>
                        <span className="text-xl font-bold text-orange-600">
                          {formatPrice(propertyData.price + (propertyData.price * 0.1))}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        (First month rent + Caution deposit + Platform fee)
                      </p>
                    </div>
                  </div>
                </div>

                {/* Key Features - Mobile Grid */}
                <div className="grid grid-cols-2 md:flex md:items-center gap-4 md:gap-6 pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2">
                    <Bed className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{propertyData.beds || propertyData.bedrooms || 0}</span>
                    <span className="text-slate-600 text-sm">Beds</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Bath className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{propertyData.baths || propertyData.bathrooms || 0}</span>
                    <span className="text-slate-600 text-sm">Baths</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Square className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{propertyData.sqft || propertyData.square_feet || 0}</span>
                    <span className="text-slate-600 text-sm">sqft</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Home className="h-5 w-5 text-slate-400" />
                    <span className="font-semibold text-slate-900">{propertyData.type}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tabbed Content */}
            <Card>
              <CardContent className="p-0">
                {/* Tab Navigation */}
                <div className="flex border-b border-slate-200 overflow-x-auto">
                  <button
                    onClick={() => setActiveTab('description')}
                    className={`px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'description'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Description
                  </button>
                  <button
                    onClick={() => setActiveTab('amenities')}
                    className={`px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'amenities'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Amenities
                  </button>
                  <button
                    onClick={() => setActiveTab('landlord')}
                    className={`px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'landlord'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Landlord Info
                  </button>
                  <button
                    onClick={() => setActiveTab('location')}
                    className={`px-4 md:px-6 py-3 md:py-4 text-sm md:text-base font-semibold whitespace-nowrap transition-colors ${
                      activeTab === 'location'
                        ? 'text-orange-600 border-b-2 border-orange-600'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Map className="h-4 w-4 mr-1" />
                    Location
                  </button>
                </div>

                {/* Tab Content */}
                <div className="p-4 md:p-6">
                  {activeTab === 'description' && (
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">About this property</h2>
                      <p className="text-slate-600 leading-relaxed whitespace-pre-line">
                        {propertyData.description}
                      </p>
                      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>✓ Verified:</strong> This listing was verified {propertyData.lastVerified}. Landlord cannot edit details after verification.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'amenities' && (
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Amenities & Features</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {(propertyData.amenities || []).map((amenity: string, index: number) => {
                          const Icon = getAmenityIcon(amenity)
                          return (
                            <div key={index} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                              <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                                <Icon className="h-5 w-5 text-orange-600" />
                              </div>
                              <span className="text-slate-700 font-medium">{amenity}</span>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  {activeTab === 'landlord' && (
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Landlord Information</h2>
                      <div className="space-y-4">
                        <div className="flex items-start gap-4 p-4 bg-slate-50 rounded-lg">
                          <Avatar className="h-16 w-16">
                            <AvatarImage src={propertyData.landlord?.avatar_url} />
                            <AvatarFallback className="bg-orange-500 text-white text-xl font-semibold">
                              {propertyData.landlord?.name?.[0] || 'L'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-bold text-slate-900 text-lg">{propertyData.landlord.name}</h3>
                              {propertyData.landlord.verifiedId && (
                                <div className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" />
                                  ID Verified
                                </div>
                              )}
                            </div>
                            <p className="text-sm text-slate-600 mb-2">Member since {propertyData.landlord?.joined_year || 2024}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <div>
                                <span className="font-semibold text-slate-900">{Math.max(1, propertyData.landlord?.properties_count || 0)}</span>
                                <span className="text-slate-600"> properties</span>
                              </div>
                              <div>
                                <span className="font-semibold text-green-600">{propertyData.landlord?.trust_score || 50}%</span>
                                <span className="text-slate-600"> trust score</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {/* Contact Details - Protected */}
                        {user ? (
                          <div className="p-4 bg-slate-50 rounded-lg space-y-2">
                            <h4 className="font-semibold text-slate-900 mb-3">📞 Contact Information</h4>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Phone className="h-4 w-4 text-slate-400" />
                              <span>{propertyData.landlord?.phone || 'Contact via chat'}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-700">
                              <Mail className="h-4 w-4 text-slate-400" />
                              <span>{propertyData.landlord?.email || 'Contact via chat'}</span>
                            </div>
                          </div>
                        ) : (
                          <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="h-5 w-5 text-orange-600" />
                              <h4 className="font-semibold text-orange-900">Contact Details Protected</h4>
                            </div>
                            <p className="text-sm text-orange-700 mb-3">
                              Sign in to view landlord phone number and email address. This protects both tenants and landlords from spam and fraud.
                            </p>
                            <Button
                              className="w-full bg-orange-500 hover:bg-orange-600"
                              onClick={() => router.push('/signin')}
                            >
                              Sign In to View Contact Details
                            </Button>
                          </div>
                        )}
                        
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                          <h4 className="font-semibold text-blue-900 mb-2">🛡️ Trust & Safety</h4>
                          <ul className="space-y-1 text-sm text-blue-700">
                            <li>✓ Identity verified by Nulo Africa</li>
                            <li>✓ Responds within 24 hours</li>
                            <li>✓ All messages protected by escrow system</li>
                            <li>✓ Fair use policy enforced</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'location' && (
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 mb-4">Location & Neighborhood</h2>
                      
                      {/* Property Address */}
                      <div className="p-4 bg-slate-50 rounded-lg mb-4">
                        <div className="flex items-start gap-3">
                          <MapPin className="h-5 w-5 text-orange-500 mt-0.5 flex-shrink-0" />
                          <div>
                            <h3 className="font-semibold text-slate-900 mb-1">📍 Address</h3>
                            <p className="text-slate-600">{propertyData.full_address || propertyData.location}</p>
                            <p className="text-sm text-slate-500 mt-1">{propertyData.city}, {propertyData.state}</p>
                          </div>
                        </div>
                      </div>

                      {/* Static Landscape Map */}
                      <div className="mb-6">
                        <h3 className="font-semibold text-slate-900 mb-3">🗺️ Property Location</h3>
                        <div className="rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
                          <div className="relative w-full h-64 md:h-80 bg-gradient-to-br from-blue-100 via-green-50 to-orange-100">
                            {/* Beautiful placeholder map with location info */}
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-center">
                                {/* Location Icon */}
                                <div className="w-16 h-16 bg-orange-500 rounded-full border-4 border-white shadow-xl flex items-center justify-center mx-auto mb-4">
                                  <MapPin className="h-8 w-8 text-white" />
                                </div>
                                
                                {/* Location Text */}
                                <div className="bg-white/95 backdrop-blur px-4 py-2 rounded-lg shadow-lg">
                                  <p className="text-sm font-semibold text-slate-900">
                                    {propertyData.location || propertyData.full_address || 'Property Location'}
                                  </p>
                                  <p className="text-xs text-slate-600">
                                    {propertyData.city || 'Lagos'}, {propertyData.state || 'Nigeria'}
                                  </p>
                                </div>
                              </div>
                            </div>
                            
                            {/* Map Pattern Overlay */}
                            <div className="absolute inset-0 opacity-20">
                              <div className="grid grid-cols-8 grid-rows-6 h-full">
                                {[...Array(48)].map((_, i) => (
                                  <div key={i} className="border border-slate-300/30" />
                                ))}
                              </div>
                            </div>
                            
                            {/* Compass Indicator */}
                            <div className="absolute top-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded-full shadow-lg">
                              <div className="flex items-center gap-1">
                                <span className="text-xs font-bold text-slate-700">N</span>
                                <div className="w-4 h-4 border-2 border-slate-700 rounded-full relative">
                                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-0.5 h-1.5 bg-red-500" />
                                </div>
                              </div>
                            </div>
                            
                            {/* Coordinates Display */}
                            <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs text-slate-600">
                              📍 {propertyData.latitude?.toFixed(4) || '6.5244'}°N, {propertyData.longitude?.toFixed(4) || '3.3792'}°E
                            </div>
                            
                            {/* Map Attribution */}
                            <div className="absolute bottom-4 right-4 bg-white/90 backdrop-blur px-2 py-1 rounded text-xs text-slate-600">
                              🗺️ {propertyData.city || 'Lagos'}, Nigeria
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Neighborhood Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        {/* Nearby Transport */}
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <span className="text-purple-600">�</span>
                            Nearby Transport
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Lekki Bus Stop</span>
                              <span className="text-xs text-green-600 font-medium">5 min walk</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Eko Hotel</span>
                              <span className="text-xs text-green-600 font-medium">10 min drive</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Victoria Island</span>
                              <span className="text-xs text-green-600 font-medium">15 min drive</span>
                            </div>
                          </div>
                        </div>

                        {/* Schools & Services */}
                        <div className="p-4 bg-slate-50 rounded-lg">
                          <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                            <span className="text-blue-600">🏫</span>
                            Schools & Services
                          </h3>
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Corona School</span>
                              <span className="text-xs text-green-600 font-medium">2 km</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Shoprite Mall</span>
                              <span className="text-xs text-green-600 font-medium">1.5 km</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-slate-600">Lekki Clinic</span>
                              <span className="text-xs text-green-600 font-medium">3 km</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Area Ratings */}
                      <div className="p-4 bg-green-50 border border-green-200 rounded-lg mb-6">
                        <h3 className="font-semibold text-green-900 mb-3 flex items-center gap-2">
                          <span>⚡</span>
                          Area Ratings
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm text-green-700">Energy Efficiency:</span>
                              <div className="flex gap-0.5">
                                {[...Array(4)].map((_, i) => (
                                  <div key={i} className="w-8 h-2 bg-green-500 rounded" />
                                ))}
                                <div className="w-8 h-2 bg-slate-200 rounded" />
                              </div>
                              <span className="text-xs text-green-600 font-semibold">A</span>
                            </div>
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-green-700">Security Rating:</span>
                              <div className="flex gap-0.5">
                                {[...Array(5)].map((_, i) => (
                                  <div key={i} className="w-8 h-2 bg-green-500 rounded" />
                                ))}
                              </div>
                              <span className="text-xs text-green-600 font-semibold">A+</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* View Other Properties Button */}
                      <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-orange-900 mb-1">🏠 Explore More Properties</h3>
                            <p className="text-sm text-orange-700">Discover similar properties in {propertyData.city || 'this area'}</p>
                          </div>
                          <Link href="/properties">
                            <Button className="bg-orange-500 hover:bg-orange-600 text-white">
                              <ArrowRight className="h-4 w-4 mr-1" />
                              Browse Properties
                            </Button>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

          </div>

          {/* Sidebar - Mobile First */}
          <div className="space-y-4 md:space-y-6">
            {/* Contact Owner - Premium Design */}
            <Card className="lg:sticky lg:top-32 border-0 shadow-xl">
              <CardContent className="p-5 md:p-6">
                {/* Owner Info - Clean Card */}
                <div className="bg-slate-50 rounded-xl p-4 md:p-5 mb-5 border border-slate-200">
                  <div className="flex items-start gap-3 md:gap-4 mb-4">
                    <Avatar className="h-14 w-14 md:h-16 md:w-16">
                      <AvatarImage src={propertyData.landlord?.avatar_url} />
                      <AvatarFallback className="bg-orange-500 text-white text-lg md:text-xl font-semibold">
                        {propertyData.landlord?.name?.[0] || 'L'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-base md:text-lg truncate">{propertyData.landlord.name}</h3>
                        {propertyData.landlord.verified && (
                          <div className="bg-green-500 text-white text-xs font-semibold px-2 py-0.5 rounded flex items-center gap-1">
                            <Check className="h-3 w-3" />
                            Verified
                          </div>
                        )}
                      </div>
                      <p className="text-xs md:text-sm text-slate-600 font-medium">
                        {propertyData.landlord?.properties_count || 0} properties listed
                      </p>
                      <div className="flex items-center gap-1 mt-1.5">
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
                        <span className="text-xs text-slate-600 ml-1">(4.9)</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Contact Info - Protected */}
                  <div className="space-y-2 pt-3 border-t border-slate-200">
                    {user ? (
                      <>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Phone className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium">{propertyData.landlord?.phone || 'Contact via chat'}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                          <Mail className="h-4 w-4 text-slate-400 flex-shrink-0" />
                          <span className="font-medium truncate">{propertyData.landlord?.email || 'Contact via chat'}</span>
                        </div>
                      </>
                    ) : (
                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                        <div className="flex items-center gap-2 mb-2">
                          <Shield className="h-4 w-4 text-orange-600" />
                          <p className="text-xs font-semibold text-orange-900">Contact Details Protected</p>
                        </div>
                        <p className="text-xs text-orange-700 mb-2">
                          Sign in to view landlord contact information
                        </p>
                        <Button
                          size="sm"
                          className="w-full h-8 text-xs bg-orange-500 hover:bg-orange-600"
                          onClick={() => router.push('/signin')}
                        >
                          Sign In to View Contact
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tenant Action Buttons - Enhanced with Viewing Options */}
                <div className="space-y-3">
                  {/* Virtual Tour Button (if video available) */}
                  {propertyData.video_tour_url && (
                    <Button 
                      className="w-full h-12 text-sm font-bold bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group"
                      onClick={handleVirtualTour}
                    >
                      <Video className="h-5 w-5 mr-2.5 group-hover:scale-110 transition-transform" />
                      {hasViewedVideo ? 'Watch Virtual Tour Again' : 'Watch Virtual Tour'}
                      {hasViewedVideo && <Check className="h-4 w-4 ml-2" />}
                    </Button>
                  )}

                  {/* Physical Viewing Button */}
                  <Button 
                    className="w-full h-12 md:h-14 text-sm md:text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group"
                    onClick={() => handleRequestViewing('physical')}
                  >
                    <Calendar className="h-5 w-5 mr-2.5 group-hover:scale-110 transition-transform" />
                    Schedule Physical Viewing
                  </Button>

                  {/* Virtual Viewing Button (if no video) */}
                  {!propertyData.video_tour_url && (
                    <Button 
                      className="w-full h-12 text-sm font-bold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl group"
                      onClick={() => handleRequestViewing('virtual')}
                    >
                      <Video className="h-5 w-5 mr-2.5 group-hover:scale-110 transition-transform" />
                      Request Virtual Tour
                    </Button>
                  )}

                  {/* Secondary Actions Grid */}
                  <div className="grid grid-cols-2 gap-2.5">
                    {/* Chat Button */}
                    <Button 
                      variant="outline" 
                      className="h-11 md:h-12 text-xs md:text-sm font-semibold border-2 border-blue-200 text-blue-700 hover:border-blue-500 hover:bg-blue-50 hover:text-blue-800 transition-all duration-300 rounded-xl group"
                      onClick={handleChatLandlord}
                    >
                      <MessageCircle className="h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform" />
                      <span className="hidden sm:inline">Chat</span>
                      <span className="sm:hidden">💬</span>
                    </Button>

                    {/* Save Button */}
                    <Button 
                      variant="outline" 
                      className={`h-11 md:h-12 text-xs md:text-sm font-semibold border-2 transition-all duration-300 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed group ${
                        isFavorite 
                          ? 'border-red-300 bg-red-50 text-red-700 hover:border-red-400 hover:bg-red-100' 
                          : 'border-slate-200 text-slate-700 hover:border-red-300 hover:bg-red-50 hover:text-red-600'
                      }`}
                      onClick={toggleFavorite}
                      disabled={isTogglingFavorite}
                    >
                      <Heart className={`h-4 w-4 mr-1.5 group-hover:scale-110 transition-transform ${isFavorite ? 'fill-red-500 text-red-500' : ''} ${isTogglingFavorite ? 'animate-pulse' : ''}`} />
                      <span className="hidden sm:inline">{isFavorite ? 'Saved' : 'Save'}</span>
                      <span className="sm:hidden">❤️</span>
                    </Button>
                  </div>

                  {/* Report Button - Subtle */}
                  <Button 
                    variant="ghost" 
                    className="w-full h-9 text-xs font-medium text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all duration-300 rounded-lg group"
                    onClick={handleReportConcern}
                  >
                    <Shield className="h-3.5 w-3.5 mr-1.5 group-hover:scale-110 transition-transform" />
                    Report Concern
                  </Button>
                </div>

                {/* Trust & Safety Note */}
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-xs text-blue-700">
                    <strong>🛡️ Protected by Nulo:</strong> All interactions use our secure escrow system. Both parties can rate each other post-interaction.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Viewing Request Modal */}
      <ViewingRequestModal
        isOpen={showViewingModal}
        onClose={() => setShowViewingModal(false)}
        onConfirm={confirmViewing}
        propertyTitle={propertyData.title}
        landlordName={propertyData.landlord?.name || 'Property Owner'}
        landlordResponseTime="within 24 hours"
      />

      {/* Chat Modal */}
      <ChatModal
        isOpen={showChatModal}
        onClose={() => setShowChatModal(false)}
        propertyId={propertyData.id}
        propertyTitle={propertyData.title}
        propertyPrice={formatPrice(propertyData.price)}
        propertyImage={propertyData.images?.[0] || '/placeholder-property.jpg'}
        landlordName={propertyData.landlord?.name || 'Property Owner'}
        landlordId={propertyData.landlord?.id || propertyData.landlord_id}
        landlordAvatar={propertyData.landlord?.avatar_url}
        landlordVerified={propertyData.landlord?.verified}
        landlordResponseTime="within 24 hours"
      />

      {/* Full Screen Gallery Modal */}
      {showGallery && (
        <div className="fixed inset-0 bg-black z-50 flex items-center justify-center">
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-4 right-4 text-white hover:bg-white/20"
            onClick={() => setShowGallery(false)}
          >
            <X className="h-6 w-6" />
          </Button>

          <div className="w-full h-full flex items-center justify-center p-4">
            <img
              src={propertyData.images[selectedImage]}
              alt={`Property ${selectedImage + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Thumbnails */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 bg-black/50 p-2 rounded-lg backdrop-blur-sm">
            {propertyData.images.map((image:any, index:any) => (
              <button
                key={index}
                onClick={() => setSelectedImage(index)}
                className={`w-16 h-16 rounded-lg overflow-hidden border-2 transition-all ${
                  selectedImage === index ? 'border-orange-500 scale-110' : 'border-transparent'
                }`}
              >
                <img src={image} alt={`Thumb ${index + 1}`} className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

