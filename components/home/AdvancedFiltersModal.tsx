"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { X, Sliders, Bed, Bath, DollarSign, Home, Ruler } from 'lucide-react'
import { Button } from "@/components/ui/button"
import {
  FILTER_PRICE_MIN,
  FILTER_PRICE_MAX,
  FILTER_PRICE_STEP,
  FILTER_PRICE_PRESETS,
  PROPERTY_TYPES,
  BED_OPTIONS,
  BATH_OPTIONS,
  formatFilterPrice,
} from "@/lib/filters/constants"

interface AdvancedFiltersModalProps {
  isOpen: boolean
  onClose: () => void
  filters: {
    priceRange: [number, number]
    propertyType: string
    bedrooms: string
    bathrooms: string
    minSize: string
  }
  onFiltersChange: (filters: {
    priceRange: [number, number]
    propertyType: string
    bedrooms: string
    bathrooms: string
    minSize: string
  }) => void
  /**
   * Optional: where to navigate when the user clicks "Apply".
   * Defaults to /properties which builds a URL from the active filters.
   */
  applyHref?: string
}

export function AdvancedFiltersModal({
  isOpen,
  onClose,
  filters,
  onFiltersChange,
  applyHref,
}: AdvancedFiltersModalProps) {
  const router = useRouter()
  const [localFilters, setLocalFilters] = useState(filters)
  const dialogRef = useRef<HTMLDivElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)

  // Sync local state when the parent updates (e.g. external reset)
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  // Escape key to close + focus management (a11y)
  useEffect(() => {
    if (!isOpen) return

    lastFocusedRef.current = document.activeElement as HTMLElement | null

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
      // Tab focus trap
      if (e.key === 'Tab' && dialogRef.current) {
        const focusables = dialogRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    document.addEventListener('keydown', onKey)

    // Auto-focus the dialog when it opens
    requestAnimationFrame(() => {
      dialogRef.current?.querySelector<HTMLElement>('button, [href], input')?.focus()
    })

    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
      lastFocusedRef.current?.focus?.()
    }
  }, [isOpen, onClose])

  const handlePriceRange = (preset: typeof FILTER_PRICE_PRESETS[number]) => {
    setLocalFilters(prev => ({ ...prev, priceRange: [preset.min, preset.max] }))
  }

  const handleMinPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || FILTER_PRICE_MIN
    setLocalFilters(prev => ({
      ...prev,
      priceRange: [
        Math.min(value, prev.priceRange[1] - FILTER_PRICE_STEP),
        prev.priceRange[1],
      ] as [number, number],
    }))
  }

  const handleMaxPrice = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value, 10) || FILTER_PRICE_MAX
    setLocalFilters(prev => ({
      ...prev,
      priceRange: [
        prev.priceRange[0],
        Math.max(value, prev.priceRange[0] + FILTER_PRICE_STEP),
      ] as [number, number],
    }))
  }

  const handleApply = useCallback(() => {
    onFiltersChange(localFilters)
    // If applyHref is provided, build a URL and navigate.
    if (applyHref) {
      const params = new URLSearchParams()
      if (localFilters.propertyType && localFilters.propertyType !== 'all') {
        params.append('property_type', localFilters.propertyType)
      }
      if (localFilters.bedrooms && localFilters.bedrooms !== 'Any') {
        params.append('beds', localFilters.bedrooms.replace('+', ''))
      }
      if (localFilters.bathrooms && localFilters.bathrooms !== 'Any') {
        params.append('baths', localFilters.bathrooms.replace('+', ''))
      }
      if (localFilters.minSize && parseInt(localFilters.minSize, 10) > 0) {
        params.append('min_size', localFilters.minSize)
      }
      if (localFilters.priceRange[0] > FILTER_PRICE_MIN) {
        params.append('min_price', localFilters.priceRange[0].toString())
      }
      if (localFilters.priceRange[1] < FILTER_PRICE_MAX) {
        params.append('max_price', localFilters.priceRange[1].toString())
      }
      const qs = params.toString()
      router.push(`${applyHref}${qs ? `?${qs}` : ''}`)
    }
    onClose()
  }, [localFilters, onFiltersChange, onClose, applyHref, router])

  const handleReset = () => {
    const resetFilters = {
      priceRange: [FILTER_PRICE_MIN, FILTER_PRICE_MAX] as [number, number],
      propertyType: 'all',
      bedrooms: 'Any',
      bathrooms: 'Any',
      minSize: '',
    }
    setLocalFilters(resetFilters)
    onFiltersChange(resetFilters)
  }

  const activeFiltersCount = [
    localFilters.priceRange[0] > FILTER_PRICE_MIN || localFilters.priceRange[1] < FILTER_PRICE_MAX ? 1 : 0,
    localFilters.propertyType !== 'all' ? 1 : 0,
    localFilters.bedrooms !== 'Any' ? 1 : 0,
    localFilters.bathrooms !== 'Any' ? 1 : 0,
    localFilters.minSize ? 1 : 0,
  ].reduce((a, b) => a + b, 0)

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - z-[100] sits above the search suggestions (z-50)
              and any sticky headers, but below sonner toasts (z-9999). */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
            aria-hidden="true"
          />

          {/* Dialog wrapper */}
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.96 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 pointer-events-none"
            role="dialog"
            aria-modal="true"
            aria-label="Advanced property filters"
          >
            <div
              ref={dialogRef}
              className="w-full sm:max-w-2xl max-h-[92vh] sm:max-h-[88vh] bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col pointer-events-auto overflow-hidden"
            >
              {/* Header - drag handle on mobile */}
              <div className="sticky top-0 z-10 bg-white border-b border-slate-200 flex-shrink-0">
                <div className="flex justify-center pt-2 pb-1 sm:hidden">
                  <span className="block w-12 h-1.5 rounded-full bg-slate-300" />
                </div>
                <div className="px-5 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-orange-100 rounded-full p-2 flex-shrink-0">
                      <Sliders className="h-5 w-5 text-orange-600" />
                    </div>
                    <div className="min-w-0">
                      <h2 className="text-lg sm:text-xl font-bold text-slate-900 leading-tight">
                        Advanced Filters
                      </h2>
                      <p className="text-xs text-slate-500 leading-tight">
                        {activeFiltersCount > 0
                          ? `${activeFiltersCount} filter${activeFiltersCount === 1 ? '' : 's'} active`
                          : 'Refine your search'}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-slate-100 rounded-full transition-colors flex-shrink-0"
                    aria-label="Close filters"
                  >
                    <X className="h-5 w-5 text-slate-500" />
                  </button>
                </div>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 sm:px-6 py-5 space-y-6 overscroll-contain">
                {/* Price Range */}
                <section>
                  <div className="flex items-center gap-2 mb-4">
                    <DollarSign className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Price Range</h3>
                    <span className="ml-auto text-xs font-semibold text-slate-500">
                      {formatFilterPrice(localFilters.priceRange[0])} &ndash;{' '}
                      {formatFilterPrice(localFilters.priceRange[1])}
                    </span>
                  </div>

                  {/* Quick Presets */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
                    {FILTER_PRICE_PRESETS.map((preset) => {
                      const active =
                        localFilters.priceRange[0] === preset.min &&
                        localFilters.priceRange[1] === preset.max
                      return (
                        <button
                          key={preset.label}
                          onClick={() => handlePriceRange(preset)}
                          className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                            active
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {preset.label}
                        </button>
                      )
                    })}
                  </div>

                  {/* Custom Range Sliders */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-slate-600 font-semibold block mb-2">
                        Min: {formatFilterPrice(localFilters.priceRange[0])}
                      </label>
                      <input
                        type="range"
                        min={FILTER_PRICE_MIN}
                        max={FILTER_PRICE_MAX}
                        step={FILTER_PRICE_STEP}
                        value={localFilters.priceRange[0]}
                        onChange={handleMinPrice}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        aria-label="Minimum price"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-600 font-semibold block mb-2">
                        Max: {formatFilterPrice(localFilters.priceRange[1])}
                      </label>
                      <input
                        type="range"
                        min={FILTER_PRICE_MIN}
                        max={FILTER_PRICE_MAX}
                        step={FILTER_PRICE_STEP}
                        value={localFilters.priceRange[1]}
                        onChange={handleMaxPrice}
                        className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
                        aria-label="Maximum price"
                      />
                    </div>
                  </div>
                </section>

                {/* Property Type */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Home className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Property Type</h3>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {PROPERTY_TYPES.map((type) => (
                      <button
                        key={type.value}
                        onClick={() => setLocalFilters(prev => ({ ...prev, propertyType: type.value }))}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                          localFilters.propertyType === type.value
                            ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {type.label}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Bedrooms & Bathrooms */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Bed className="h-5 w-5 text-orange-600" />
                      <h3 className="text-sm font-bold text-slate-900">Bedrooms</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {BED_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() =>
                            setLocalFilters(prev => ({ ...prev, bedrooms: n === 0 ? 'Any' : `${n}+` }))
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            localFilters.bedrooms === (n === 0 ? 'Any' : `${n}+`)
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {n === 0 ? 'Any' : `${n}+`}
                        </button>
                      ))}
                    </div>
                  </section>

                  <section>
                    <div className="flex items-center gap-2 mb-3">
                      <Bath className="h-5 w-5 text-orange-600" />
                      <h3 className="text-sm font-bold text-slate-900">Bathrooms</h3>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {BATH_OPTIONS.map((n) => (
                        <button
                          key={n}
                          onClick={() =>
                            setLocalFilters(prev => ({ ...prev, bathrooms: n === 0 ? 'Any' : `${n}+` }))
                          }
                          className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all ${
                            localFilters.bathrooms === (n === 0 ? 'Any' : `${n}+`)
                              ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                              : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                          }`}
                        >
                          {n === 0 ? 'Any' : `${n}+`}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>

                {/* Min Size */}
                <section>
                  <div className="flex items-center gap-2 mb-3">
                    <Ruler className="h-5 w-5 text-orange-600" />
                    <h3 className="text-sm font-bold text-slate-900">Minimum Size (sqft)</h3>
                  </div>
                  <input
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={localFilters.minSize}
                    onChange={(e) => {
                      // Only allow digits
                      const cleaned = e.target.value.replace(/[^0-9]/g, '')
                      setLocalFilters(prev => ({ ...prev, minSize: cleaned }))
                    }}
                    placeholder="e.g., 500"
                    className="w-full px-4 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-orange-500 text-slate-900 placeholder:text-slate-400"
                  />
                </section>
              </div>

              {/* Footer - sticky */}
              <div className="sticky bottom-0 bg-white border-t border-slate-200 px-5 sm:px-6 py-3 sm:py-4 flex gap-3 flex-shrink-0 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
