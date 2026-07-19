"use client"

/**
 * AdvancedFiltersModal - Floating card for advanced property filters
 * Uses consistent dark theme and positioned to allow page visibility
 */

import { useState, useEffect } from "react"
import { X, Sliders, Home, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useTheme } from "@/contexts/ThemeContext"

interface AdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    priceRange: [number, number]
    propertyType: string
    bedrooms: number
    bathrooms: number
  }
  onApply: (filters: {
    priceRange: [number, number]
    propertyType: string
    bedrooms: number
    bathrooms: number
  }) => void
  onClear: () => void
  maxPrice?: number
}

const PROPERTY_TYPES = [
  { label: "All Types", value: "all" },
  { label: "Apartment", value: "apartment" },
  { label: "House", value: "house" },
  { label: "Duplex", value: "duplex" },
  { label: "Studio", value: "studio" },
  { label: "Commercial", value: "commercial" },
]

export function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onApply,
  onClear,
  maxPrice = 10000000,
}: AdvancedFiltersModalProps) {
  const { theme } = useTheme()
  const [localFilters, setLocalFilters] = useState(filters)

  // Update local filters when props change
  useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
    }
  }, [isOpen, filters])

  if (!isOpen) return null

  const handleApply = () => {
    onApply(localFilters)
    onClose()
  }

  const handleClear = () => {
    const clearedFilters = {
      priceRange: [0, maxPrice] as [number, number],
      propertyType: "all",
      bedrooms: 0,
      bathrooms: 0,
    }
    setLocalFilters(clearedFilters)
    onClear()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-24">
      {/* Light backdrop - see through */}
      <div
        className="absolute inset-0 bg-black/30 backdrop-blur-[2px]"
        onClick={onClose}
      />

      {/* Floating Filter Card */}
      <div
        className={`relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl border ${
          theme === "dark"
            ? "bg-[#0A0A0A] border-white/10"
            : "bg-white border-slate-200"
        }`}
      >
        {/* Header with icon */}
        <div className={`flex items-center gap-3 p-6 border-b ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
          <div className="p-2 rounded-lg bg-orange-500/10">
            <Sliders className="h-5 w-5 text-orange-400" />
          </div>
          <h2
            className={`text-lg font-bold flex-1 ${
              theme === "dark" ? "text-white" : "text-slate-900"
            }`}
          >
            Advanced Filters
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-lg transition-colors ${
              theme === "dark"
                ? "hover:bg-white/10 text-white/70"
                : "hover:bg-slate-100 text-slate-500"
            }`}
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[60vh] overflow-y-auto">
          {/* Price Range with slider icon */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="h-4 w-4 text-orange-400" />
              <label
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Price Range
              </label>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
                    theme === "dark" ? "text-white/40" : "text-slate-400"
                  }`}
                >
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localFilters.priceRange[0] === 0 ? '' : localFilters.priceRange[0].toLocaleString()}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '')
                    const numValue = rawValue === '' ? 0 : parseInt(rawValue)
                    setLocalFilters({
                      ...localFilters,
                      priceRange: [numValue, localFilters.priceRange[1]],
                    })
                  }}
                  placeholder="Min price"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
              <span
                className={`text-sm ${
                  theme === "dark" ? "text-white/60" : "text-slate-400"
                }`}
              >
                to
              </span>
              <div className="flex-1 relative">
                <span
                  className={`absolute left-3 top-1/2 -translate-y-1/2 text-sm ${
                    theme === "dark" ? "text-white/40" : "text-slate-400"
                  }`}
                >
                  ₦
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={localFilters.priceRange[1] === maxPrice ? '' : localFilters.priceRange[1].toLocaleString()}
                  onChange={(e) => {
                    const rawValue = e.target.value.replace(/[^0-9]/g, '')
                    const numValue = rawValue === '' ? maxPrice : parseInt(rawValue)
                    setLocalFilters({
                      ...localFilters,
                      priceRange: [localFilters.priceRange[0], numValue],
                    })
                  }}
                  placeholder="Max price"
                  className={`w-full pl-8 pr-4 py-2.5 rounded-lg border text-sm transition-colors focus:border-orange-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                    theme === "dark"
                      ? "border-white/10 bg-white/5 text-white placeholder:text-white/30"
                      : "border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400"
                  }`}
                />
              </div>
            </div>
            {/* Helper text showing formatted range */}
            <p className={`text-xs mt-2 ${theme === "dark" ? "text-white/40" : "text-slate-400"}`}>
              {localFilters.priceRange[0] === 0 && localFilters.priceRange[1] === maxPrice
                ? "All prices"
                : `₦${localFilters.priceRange[0].toLocaleString()} - ₦${localFilters.priceRange[1].toLocaleString()}`}
            </p>
          </div>

          {/* Property Type with home icon */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Home className="h-4 w-4 text-orange-400" />
              <label
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Property Type
              </label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {PROPERTY_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() =>
                    setLocalFilters({
                      ...localFilters,
                      propertyType: type.value,
                    })
                  }
                  className={`px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    localFilters.propertyType === type.value
                      ? "bg-orange-500 text-white"
                      : theme === "dark"
                      ? "bg-white/5 text-white/70 hover:bg-white/10"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms with icon */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              <label
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Bedrooms
              </label>
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4, 5].map((num) => (
                <button
                  key={num}
                  onClick={() =>
                    setLocalFilters({ ...localFilters, bedrooms: num })
                  }
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    localFilters.bedrooms === num
                      ? "bg-orange-500 text-white"
                      : theme === "dark"
                      ? "bg-white/5 text-white/70 hover:bg-white/10"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {num === 0 ? "Any" : num}
                </button>
              ))}
            </div>
          </div>

          {/* Bathrooms with icon */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-4 w-4 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
              </svg>
              <label
                className={`text-sm font-semibold ${
                  theme === "dark" ? "text-white" : "text-slate-900"
                }`}
              >
                Bathrooms
              </label>
            </div>
            <div className="flex items-center gap-2">
              {[0, 1, 2, 3, 4].map((num) => (
                <button
                  key={num}
                  onClick={() =>
                    setLocalFilters({ ...localFilters, bathrooms: num })
                  }
                  className={`flex-1 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    localFilters.bathrooms === num
                      ? "bg-orange-500 text-white"
                      : theme === "dark"
                      ? "bg-white/5 text-white/70 hover:bg-white/10"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100"
                  }`}
                >
                  {num === 0 ? "Any" : num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className={`flex items-center gap-3 p-6 border-t ${theme === "dark" ? "border-white/10" : "border-slate-200"}`}>
          <Button
            onClick={handleClear}
            variant="outline"
            className={`flex-1 ${
              theme === "dark"
                ? "border-white/10 text-white hover:bg-white/5"
                : "border-slate-200 text-slate-700 hover:bg-slate-50"
            }`}
          >
            Clear All
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
          >
            Apply Filters
          </Button>
        </div>
      </div>
    </div>
  )
}
