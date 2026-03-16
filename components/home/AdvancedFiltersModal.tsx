"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sliders, Bed, Bath, DollarSign, Home } from 'lucide-react'
import { Button } from "@/components/ui/button"

const PRICE_CONFIG = {
  MIN: 0,
  MAX: 50000000,
  DEFAULT_MAX: 10000000,
  STEP: 100000,
  COMMON_RANGES: [
    { label: 'Budget', min: 0, max: 1000000 },
    { label: 'Standard', min: 1000000, max: 3000000 },
    { label: 'Premium', min: 3000000, max: 10000000 },
    { label: 'Luxury', min: 10000000, max: 50000000 }
  ]
}

interface AdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    priceRange: [number, number]
    bedrooms: string
    bathrooms: string
    minSize: string
  }
  onFiltersChange: (filters: {
    priceRange: [number, number]
    bedrooms: string
    bathrooms: string
    minSize: string
  }) => void
  onApply: () => void
}

export function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  onApply
}: AdvancedFiltersModalProps) {
  const [localFilters, setLocalFilters] = useState(filters)

  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const handlePriceRange = (preset: typeof PRICE_CONFIG.COMMON_RANGES[number]) => {
    setLocalFilters(prev => ({
      ...prev,
      priceRange: [preset.min, preset.max] as [number, number]
    }))
  }

  const handleMinPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || 0
    setLocalFilters(prev => ({
      ...prev,
      priceRange: [value, prev.priceRange[1]]
    }))
  }

  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || PRICE_CONFIG.MAX
    setLocalFilters(prev => ({
      ...prev,
      priceRange: [prev.priceRange[0], value]
    }))
  }

  const handleApply = () => {
    onFiltersChange(localFilters)
    onApply()
    onClose()
  }

  const handleReset = () => {
    const resetFilters = {
      priceRange: [0, PRICE_CONFIG.DEFAULT_MAX] as [number, number],
      bedrooms: 'Any',
      bathrooms: 'Any',
      minSize: ''
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const activeFiltersCount = [
    localFilters.priceRange[0] > 0 || localFilters.priceRange[1] < PRICE_CONFIG.DEFAULT_MAX ? 1 : 0,
    localFilters.bedrooms !== 'Any' ? 1 : 0,
    localFilters.bathrooms !== 'Any' ? 1 : 0,
    localFilters.minSize ? 1 : 0
  ].reduce((a, b) => a + b, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="max-w-2xl w-full max-h-[90vh] bg-white rounded-3xl shadow-2xl overflow-y-auto">
              {/* Header */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-orange-100 rounded-full p-2">
                    <Sliders className="h-5 w-5 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900">Advanced Filters</h2>
                    {activeFiltersCount > 0 && (
                      <p className="text-xs text-orange-600 font-semibold">{activeFiltersCount} filters active</p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Price Range */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Price Range</h3>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                    {PRICE_CONFIG.COMMON_RANGES.map((preset) => (
                      <button
                        key={preset.label}
                        onClick={() => handlePriceRange(preset)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          localFilters.priceRange[0] === preset.min &&
                          localFilters.priceRange[1] === preset.max
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>

                  {/* Custom Range Sliders */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 font-semibold block mb-2">
                        Min: ₦{localFilters.priceRange[0].toLocaleString('en-NG')}
                      </label>
                      <input
                        type="range"
                        min={PRICE_CONFIG.MIN}
                        max={PRICE_CONFIG.MAX}
                        step={PRICE_CONFIG.STEP}
                        value={localFilters.priceRange[0]}
                        onChange={handleMinPrice}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-semibold block mb-2">
                        Max: ₦{localFilters.priceRange[1].toLocaleString('en-NG')}
                      </label>
                      <input
                        type="range"
                        min={PRICE_CONFIG.MIN}
                        max={PRICE_CONFIG.MAX}
                        step={PRICE_CONFIG.STEP}
                        value={localFilters.priceRange[1]}
                        onChange={handleMaxPrice}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bed className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Bedrooms</h3>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                    {['Any', '1', '2', '3', '4', '5+'].map((num) => (
                      <button
                        key={num}
                        onClick={() => setLocalFilters(prev => ({ ...prev, bedrooms: num }))}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          localFilters.bedrooms === num
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Bathrooms */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Bath className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Bathrooms</h3>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                    {['Any', '1', '2', '3', '4+'].map((num) => (
                      <button
                        key={num}
                        onClick={() => setLocalFilters(prev => ({ ...prev, bathrooms: num }))}
                        className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                          localFilters.bathrooms === num
                            ? 'bg-orange-500 text-white shadow-lg'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {num}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Min Size */}
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Home className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Minimum Size (sqft)</h3>
                  </div>
                  <input
                    type="number"
                    value={localFilters.minSize}
                    onChange={(e) => setLocalFilters(prev => ({ ...prev, minSize: e.target.value }))}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              {/* Footer */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-6 py-4 flex gap-3">
                <Button
                  onClick={handleReset}
                  variant="outline"
                  className="flex-1 border-slate-300 text-slate-700 hover:bg-slate-50"
                >
                  Reset
                </Button>
                <Button
                  onClick={handleApply}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold"
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
