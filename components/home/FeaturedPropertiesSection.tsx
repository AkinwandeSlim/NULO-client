import Link from "next/link"
import { ArrowRight } from "lucide-react"
import PropertyCardGrid from "@/components/properties/PropertyCardGrid"
import { useTheme } from "@/contexts/ThemeContext"

interface Property {
  id: string
  title: string
  location: string
  price: number
  beds: number
  baths: number
  images: string[]
  status?: string
  application_count?: number
}

interface FeaturedPropertiesSectionProps {
  properties: Property[]
  loading?: boolean
  formatPrice: (price: number) => string
  favorites?: string[]
  onFavorite?: (propertyId: string, isFavorite: boolean) => void
  isAuthLoading?: boolean
  theme?: "dark" | "light"
}

export function FeaturedPropertiesSection({ 
  properties, 
  loading,
  favorites = [],
  onFavorite,
  isAuthLoading = false,
  theme = "dark"
}: FeaturedPropertiesSectionProps) {
  if (loading) {
    return (
      <section className={`py-24 relative overflow-hidden ${theme === "dark" ? "bg-[#0A0A0A]" : "bg-white"}`}>
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className={`h-8 rounded w-64 mx-auto mb-4 ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`}></div>
              <div className={`h-4 rounded w-48 mx-auto ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`}></div>
            </div>
          </div>
        </div>
      </section>
    )
  }

  if (properties.length === 0) {
    return null
  }

  const handleSelectProperty = () => {
    // No-op for featured properties
  }

  const handleFave = (propertyId: string, isFavorite: boolean) => {
    if (onFavorite) {
      onFavorite(propertyId, isFavorite)
    }
  }

  return (
    <div className="py-28 lg:py-32 relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-5">
        <div className={`absolute top-20 right-20 w-64 h-64 rounded-full blur-3xl animate-pulse ${theme === "dark" ? "bg-orange-500" : "bg-orange-200"}`}></div>
        <div 
          className={`absolute bottom-20 left-20 w-48 h-48 rounded-full blur-2xl animate-bounce ${theme === "dark" ? "bg-slate-500" : "bg-slate-300"}`}
          style={{animationDelay: '2s', animationDuration: '4s'}}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-14 lg:mb-16">
          <p className="text-[13px] font-medium uppercase tracking-[0.18em] text-orange-400 mb-3">
            Featured Listings
          </p>
          <h2 className={`text-[28px] font-semibold leading-tight tracking-tight mb-4 ${theme === "dark" ? "text-white" : "text-slate-900"} sm:text-[32px] lg:text-[38px]`}>
            Recently Added <span className="text-orange-600">Properties</span>
          </h2>
          <p className={`text-[15px] leading-relaxed tracking-wide max-w-3xl mx-auto ${theme === "dark" ? "text-white/60" : "text-slate-800"}`}>
            Exclusively vacant properties just listed on our platform
          </p>
        </div>

        {/* Properties Grid - Using reusable PropertyCardGrid component */}
        <PropertyCardGrid
          properties={properties}
          onSelect={handleSelectProperty}
          onFavorite={handleFave}
          favorites={favorites}
          variant="featured"
          isAuthLoading={isAuthLoading}
          emptyMessage="No featured properties available"
        />

        {/* View All Button */}
        <div className="text-center">
          <Link href="/properties">
            <button className="h-14 px-8 bg-orange-600 text-white hover:bg-orange-700 rounded-xl font-semibold text-lg transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl inline-flex items-center gap-2">
              View All Properties
              <ArrowRight className="h-5 w-5" />
            </button>
          </Link>
        </div>
      </div>
    </div>
  )
}