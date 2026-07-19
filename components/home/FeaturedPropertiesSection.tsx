import { useRouter } from "next/navigation"
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
  const router = useRouter()

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <div className="text-center">
          <div className="animate-pulse">
            <div className={`h-8 rounded w-64 mx-auto mb-4 ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`}></div>
            <div className={`h-4 rounded w-48 mx-auto ${theme === "dark" ? "bg-white/10" : "bg-slate-200"}`}></div>
          </div>
        </div>
      </div>
    )
  }

  if (properties.length === 0) {
    return null
  }

  const handleSelectProperty = (property: any) => {
    router.push(`/properties/${property.id}`)
  }

  const handleFave = (propertyId: string, isFavorite: boolean) => {
    if (onFavorite) {
      onFavorite(propertyId, isFavorite)
    }
  }

  return (
    <div className="mt-12">
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
    </div>
  )
}