import Link from "next/link"
import { ArrowRight } from "lucide-react"
import PropertyCardGrid from "@/components/properties/PropertyCardGrid"

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
}

export function FeaturedPropertiesSection({ 
  properties, 
  loading,
  favorites = [],
  onFavorite,
  isAuthLoading = false
}: FeaturedPropertiesSectionProps) {
  if (loading) {
    return (
      <section className="py-24 bg-white relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-slate-200 rounded w-64 mx-auto mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-48 mx-auto"></div>
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
    <section className="py-24 bg-white relative overflow-hidden">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-20 right-20 w-64 h-64 bg-orange-200 rounded-full blur-3xl animate-pulse"></div>
        <div 
          className="absolute bottom-20 left-20 w-48 h-48 bg-slate-300 rounded-full blur-2xl animate-bounce" 
          style={{animationDelay: '2s', animationDuration: '4s'}}
        ></div>
      </div>
      
      <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-6">
            Recently Added <span className="text-orange-600">Properties</span>
          </h2>
          <p className="text-xl text-slate-700 max-w-3xl mx-auto">
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
    </section>
  )
}