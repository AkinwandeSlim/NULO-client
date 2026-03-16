"use client"

import * as React from "react"
import { X, Bed, Bath, Home, DollarSign, Maximize2, Wifi, Car, Dumbbell, Shield, Waves, Wind, Zap, Dog, Sparkles } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"

interface PropertyFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    priceRange: [number, number]
    propertyType: string
    bedrooms: number
    bathrooms: number
  }
  onFiltersChange: (filters: {
    priceRange?: [number, number]
    propertyType?: string
    bedrooms?: number
    bathrooms?: number
  }) => void
}

const propertyTypes = ["all", "Villa", "Apartment", "House", "Penthouse", "Bungalow", "Duplex", "Mansion", "Terrace"]

const amenities = [
  { id: 'wifi', label: 'WiFi', icon: Wifi },
  { id: 'parking', label: 'Parking', icon: Car },
  { id: 'gym', label: 'Gym', icon: Dumbbell },
  { id: 'security', label: '24/7 Security', icon: Shield },
  { id: 'pool', label: 'Swimming Pool', icon: Waves },
  { id: 'ac', label: 'Air Conditioning', icon: Wind },
  { id: 'generator', label: 'Generator', icon: Zap },
  { id: 'pets', label: 'Pet Friendly', icon: Dog },
]

const preferences = [
  'Furnished', 'Unfurnished', 'Serviced', 'Newly Built',
  'Gated Estate', 'Close to School', 'Close to Market', 'Waterfront'
]

const formatPrice = (value: number) => {
  if (value >= 1000000) return `₦${(value / 1000000).toFixed(1)}M`
  if (value >= 1000) return `₦${(value / 1000).toFixed(0)}K`
  return `₦${value}`
}

export function PropertyFiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange
}: PropertyFiltersModalProps) {
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Modal - Sleek Design */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 30 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed inset-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-5xl md:max-h-[85vh] bg-white rounded-2xl shadow-2xl z-[201] flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header - Sleeker */}
            <div className="relative px-6 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-500 flex items-center justify-center">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Filter Properties</h2>
                    <p className="text-sm text-slate-600">Filter properties by your preferences</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <X className="h-5 w-5 text-slate-600" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-6 py-6">
              <div className="space-y-8">
                {/* Price Range */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-orange-500" />
                    <label className="text-base font-bold text-slate-900">Price Range</label>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-200">
                        <span className="text-sm font-semibold text-orange-700">{formatPrice(filters.priceRange[0])}</span>
                      </div>
                      <div className="text-slate-400">—</div>
                      <div className="px-4 py-2 bg-orange-50 rounded-xl border border-orange-200">
                        <span className="text-sm font-semibold text-orange-700">{formatPrice(filters.priceRange[1])}</span>
                      </div>
                    </div>
                    <div className="relative pt-2">
                      <div className="relative h-3 bg-slate-100 rounded-full">
                        <div 
                          className="absolute h-3 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full transition-all duration-300"
                          style={{
                            left: `${(filters.priceRange[0] / 1000000) * 100}%`,
                            right: `${100 - (filters.priceRange[1] / 1000000) * 100}%`
                          }}
                        />
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="10000"
                        value={filters.priceRange[0]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          if (value < filters.priceRange[1]) {
                            onFiltersChange({ priceRange: [value, filters.priceRange[1]] })
                          }
                        }}
                        className="absolute w-full h-3 top-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                      />
                      <input
                        type="range"
                        min="0"
                        max="1000000"
                        step="10000"
                        value={filters.priceRange[1]}
                        onChange={(e) => {
                          const value = parseInt(e.target.value)
                          if (value > filters.priceRange[0]) {
                            onFiltersChange({ priceRange: [filters.priceRange[0], value] })
                          }
                        }}
                        className="absolute w-full h-3 top-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-3 [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-lg [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
                      />
                    </div>
                    <div className="flex justify-between text-xs font-medium text-slate-500 px-1">
                      <span>₦0</span>
                      <span>₦250K</span>
                      <span>₦500K</span>
                      <span>₦750K</span>
                      <span>₦1M+</span>
                    </div>
                  </div>
                </div>

                {/* Property Type */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5 text-orange-500" />
                    <label className="text-base font-bold text-slate-900">Property Type</label>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {propertyTypes.map(type => (
                      <button
                        key={type}
                        onClick={() => onFiltersChange({ propertyType: type })}
                        className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                          filters.propertyType === type
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30 scale-105'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        {type === 'all' ? 'All' : type}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Bedrooms */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Bed className="h-5 w-5 text-orange-500" />
                      <label className="text-base font-bold text-slate-900">Bedrooms</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2, 3, 4, 5].map(num => (
                        <button
                          key={num}
                          onClick={() => onFiltersChange({ bedrooms: num })}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            filters.bedrooms === num
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {num === 0 ? 'Any' : `${num}+`}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Bathrooms */}
                  <div>
                    <div className="flex items-center gap-2 mb-4">
                      <Bath className="h-5 w-5 text-orange-500" />
                      <label className="text-base font-bold text-slate-900">Bathrooms</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {[0, 1, 2, 3, 4].map(num => (
                        <button
                          key={num}
                          onClick={() => onFiltersChange({ bathrooms: num })}
                          className={`px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                            filters.bathrooms === num
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/30'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {num === 0 ? 'Any' : `${num}+`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  onClick={() => {
                    onFiltersChange({
                      priceRange: [0, 1000000],
                      propertyType: 'all',
                      bedrooms: 0,
                      bathrooms: 0
                    })
                  }}
                  className="flex-1 h-12 text-base font-semibold border-slate-300 hover:bg-slate-100 text-slate-700"
                >
                  Clear All
                </Button>
                <Button
                  variant="outline"
                  onClick={onClose}
                  className="flex-1 h-12 text-base font-semibold border-slate-300 hover:bg-slate-100"
                >
                  Cancel
                </Button>
                <Button
                  onClick={onClose}
                  className="flex-1 h-12 text-base font-bold bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-lg shadow-orange-500/30"
                >
                  Apply Filters
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Export as FilterModal for backward compatibility
export default PropertyFiltersModal
export { PropertyFiltersModal as FilterModal }
