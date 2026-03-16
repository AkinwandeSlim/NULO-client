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
    
    // Dashboard: More generous spacing, responsive based on property count
    dashboard: 'gap-6 mb-12'
  }

  // Determine if using compact card mode
  const useCompactCard = variant === 'compact' || variant === 'featured'

  // Dashboard-specific responsive layout: adapt grid columns based on property count
  let dashboardGridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  if (variant === 'dashboard') {
    if (properties.length === 1) {
      // Single property: center it with appropriate max-width for visibly
      dashboardGridClass = 'flex justify-center'
    } else if (properties.length === 2) {
      // Two properties: 2 columns centered on desktop for symmetry
      dashboardGridClass = 'grid grid-cols-1 sm:grid-cols-2 lg:max-w-2xl lg:mx-auto'
    } else if (properties.length === 3) {
      // Three properties: full 3-column grid but better spacing
      dashboardGridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    } else {
      // 4+ properties: maintain consistent 3-column grid
      dashboardGridClass = 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
    }
  }

  const finalGridClass = variant === 'dashboard' 
    ? `${dashboardGridClass} ${gridClasses[variant]}`
    : gridClasses[variant]

  return (
    <div className={finalGridClass}>
      {properties.length === 1 && variant === 'dashboard' ? (
        // Wrap single card in a container to control width
        <div className="w-full max-w-sm">
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
      ) : (
        // Multiple cards: render directly
        <>
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
        </>
      )}
    </div>
  )
}
