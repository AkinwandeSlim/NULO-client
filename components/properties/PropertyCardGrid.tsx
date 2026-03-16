"use client"

import PropertyCard from './PropertyCard'

interface PropertyCardGridProps {
  properties: any[]
  onSelect: (property: any) => void
  onFavorite: (propertyId: string, isFavorite: boolean) => void
  favorites?: string[]
  isAuthLoading?: boolean
  isPendingFavorites?: Set<string>
  variant?: 'compact' | 'featured' | 'dashboard'
  emptyMessage?: string
}

/**
 * Reusable PropertyCardGrid Component
 * 
 * Ensures consistent grid layout across:
 * - Featured Properties Section (homepage)
 * - Marketplace Search Page (split view, grid view)
 * - Dashboard Pages (landlord, admin, tenant)
 * 
 * Variants:
 * - 'compact': 6-column grid for marketplace views (max items visible)
 * - 'featured': 6-column grid for homepage featured section
 * - 'dashboard': Responsive grid for dashboard pages
 */
export default function PropertyCardGrid({
  properties,
  onSelect,
  onFavorite,
  favorites = [],
  isAuthLoading = false,
  isPendingFavorites = new Set(),
  variant = 'featured',
  emptyMessage = 'No properties found'
}: PropertyCardGridProps) {
  
  if (properties.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-500 text-center">{emptyMessage}</p>
      </div>
    )
  }

  // Grid layout configurations
  const gridClasses = {
    // Marketplace: 6-column grid on desktop, shows ~24 properties
    compact: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-12',
    
    // Featured section: 6-column grid, matches marketplace
    featured: 'grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-12',
    
    // Dashboard: More generous spacing, 3-column on desktop
    dashboard: 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
  }

  // Determine if using compact card mode
  const useCompactCard = variant === 'compact' || variant === 'featured'

  return (
    <div className={gridClasses[variant]}>
      {properties.map((property) => (
        <PropertyCard
          key={property.id}
          property={property}
          onSelect={onSelect}
          onFavorite={onFavorite}
          isFavorite={favorites.includes(property.id)}
          compact={useCompactCard}
          isAuthLoading={isAuthLoading}
          isPendingFavorite={isPendingFavorites.has(property.id)}
        />
      ))}
    </div>
  )
}
