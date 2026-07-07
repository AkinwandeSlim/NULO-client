"use client"

/**
 * PropertyFiltersSidebar
 * ----------------------
 * A persistent side-panel filter for the marketplace that lets users
 * refine results while still seeing the property list behind it.
 *
 * Key UX properties (this whole component exists to fix those):
 *   1. ALWAYS VISIBLE  - desktop: sticky left column. Mobile: slide-up
 *                        sheet that does NOT cover the whole screen.
 *   2. LIVE            - no "Apply" / "Cancel" buttons. Every change
 *                        bubbles up immediately so the property list
 *                        updates in real time.
 *   3. STABLE LAYOUT   - the component never unmounts while filters
 *                        are being adjusted, so there is no flicker.
 *   4. DEBOUNCED       - the price-range slider fires onChange many
 *                        times per drag. We only push the value up
 *                        to the parent after the user pauses
 *                        (PRICE_DEBOUNCE_MS) to avoid spamming the
 *                        /properties/search endpoint.
 *
 * Pill-style selectors (property type, beds, baths) are atomic - one
 * click = one event = one network call. No debounce needed there.
 */

import * as React from "react"
import {
  X,
  Bed,
  Bath,
  Home,
  DollarSign,
  Sparkles,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  GripHorizontal,
} from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Button } from "@/components/ui/button"
import {
  FILTER_PRICE_MIN,
  FILTER_PRICE_MAX,
  FILTER_PRICE_STEP,
  PROPERTY_TYPES,
  BED_OPTIONS,
  BATH_OPTIONS,
  formatFilterPrice,
} from "@/lib/filters/constants"

export { FILTER_PRICE_MIN, FILTER_PRICE_MAX } from "@/lib/filters/constants"

export interface PropertyFilters {
  priceRange: [number, number]
  propertyType: string
  bedrooms: number
  bathrooms: number
}

interface PropertyFiltersSidebarProps {
  filters: PropertyFilters
  onFiltersChange: (next: Partial<PropertyFilters>) => void
  onClearAll: () => void
  /** Mobile-only: is the slide-up sheet open? */
  mobileOpen?: boolean
  onMobileClose?: () => void
  /** Desktop-only: is the sidebar collapsed to a slim rail? */
  collapsed?: boolean
  onToggleCollapse?: () => void
}

// FILTER_PRICE_MIN / FILTER_PRICE_MAX are imported from @/lib/filters/constants
// and re-exported above for any existing import sites.
const PRICE_DEBOUNCE_MS = 250

// Re-export the property-type / bed / bath lists locally for the JSX below.
const PROPERTY_TYPES_LIST = PROPERTY_TYPES
const BED_OPTIONS_LIST = BED_OPTIONS
const BATH_OPTIONS_LIST = BATH_OPTIONS

export function PropertyFiltersSidebar({
  filters,
  onFiltersChange,
  onClearAll,
  mobileOpen = false,
  onMobileClose,
  collapsed = false,
  onToggleCollapse,
}: PropertyFiltersSidebarProps) {
  // Local state for the slider so the UI feels instant while dragging.
  // We only commit the value to the parent (which triggers /search) after
  // the user stops moving the handle for PRICE_DEBOUNCE_MS.
  const [pendingPrice, setPendingPrice] =
    React.useState<[number, number]>(filters.priceRange)

  // Keep local state in sync if parent resets filters externally.
  React.useEffect(() => {
    setPendingPrice(filters.priceRange)
  }, [filters.priceRange])

  // Commit debounced price updates.
  React.useEffect(() => {
    const [lo, hi] = pendingPrice
    const [curLo, curHi] = filters.priceRange
    if (lo === curLo && hi === curHi) return
    const t = setTimeout(() => {
      onFiltersChange({ priceRange: [lo, hi] })
    }, PRICE_DEBOUNCE_MS)
    return () => clearTimeout(t)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingPrice])

  const hasActiveFilters =
    filters.priceRange[0] > FILTER_PRICE_MIN ||
    filters.priceRange[1] < FILTER_PRICE_MAX ||
    filters.propertyType !== "all" ||
    filters.bedrooms > 0 ||
    filters.bathrooms > 0

  // The actual filter UI, shared by both layouts.
  const filterBody = (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 flex-shrink-0">
            <SlidersHorizontal className="h-4 w-4 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-900 leading-tight">Filters</h2>
            <p className="text-xs text-slate-500 leading-tight truncate">Refine your results</p>
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {onToggleCollapse && (
            <button
              onClick={onToggleCollapse}
              className="hidden md:flex w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 items-center justify-center transition-colors"
              aria-label="Collapse filters"
              title="Collapse filters"
            >
              <ChevronLeft className="h-4 w-4 text-slate-600" />
            </button>
          )}
          {onMobileClose && (
            <button
              onClick={onMobileClose}
              className="md:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="Close filters"
            >
              <X className="h-4 w-4 text-slate-600" />
            </button>
          )}
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
        {/* Price Range */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <DollarSign className="h-4 w-4 text-orange-500" />
            <label className="text-sm font-bold text-slate-900">Price Range</label>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div className="px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <span className="text-xs font-bold text-orange-700">
                {formatFilterPrice(pendingPrice[0])}
              </span>
            </div>
            <div className="text-slate-300 text-xs">to</div>
            <div className="px-3 py-1.5 bg-orange-50 rounded-lg border border-orange-200">
              <span className="text-xs font-bold text-orange-700">
                {formatFilterPrice(pendingPrice[1])}
              </span>
            </div>
          </div>
          <div className="relative pt-2">
            <div className="relative h-2 bg-slate-100 rounded-full">
              <div
                className="absolute h-2 bg-gradient-to-r from-orange-500 to-orange-600 rounded-full"
                style={{
                  left: `${(pendingPrice[0] / FILTER_PRICE_MAX) * 100}%`,
                  right: `${100 - (pendingPrice[1] / FILTER_PRICE_MAX) * 100}%`,
                }}
              />
            </div>
            <input
              type="range"
              min={FILTER_PRICE_MIN}
              max={FILTER_PRICE_MAX}
              step={FILTER_PRICE_STEP}
              value={pendingPrice[0]}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (v < pendingPrice[1]) {
                  setPendingPrice([v, pendingPrice[1]])
                }
              }}
              className="absolute w-full h-2 top-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
              aria-label="Minimum price"
            />
            <input
              type="range"
              min={FILTER_PRICE_MIN}
              max={FILTER_PRICE_MAX}
              step={FILTER_PRICE_STEP}
              value={pendingPrice[1]}
              onChange={(e) => {
                const v = parseInt(e.target.value, 10)
                if (v > pendingPrice[0]) {
                  setPendingPrice([pendingPrice[0], v])
                }
              }}
              className="absolute w-full h-2 top-2 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-[3px] [&::-webkit-slider-thumb]:border-orange-500 [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:hover:scale-110 [&::-webkit-slider-thumb]:transition-transform"
              aria-label="Maximum price"
            />
          </div>
        </section>

        {/* Property Type */}
        <section>
          <div className="flex items-center gap-2 mb-3">
            <Home className="h-4 w-4 text-orange-500" />
            <label className="text-sm font-bold text-slate-900">Property Type</label>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {PROPERTY_TYPES_LIST.map((type) => (
              <button
                key={type.value}
                onClick={() => onFiltersChange({ propertyType: type.value })}
                className={`px-2 py-2 rounded-lg text-xs font-semibold transition-all ${
                  filters.propertyType === type.value
                    ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                    : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 hover:border-slate-300"
                }`}
              >
                {type.value === "all" ? "All" : type.label}
              </button>
            ))}
          </div>
        </section>

        {/* Bedrooms & Bathrooms */}
        <div className="grid grid-cols-2 gap-4">
          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bed className="h-4 w-4 text-orange-500" />
              <label className="text-sm font-bold text-slate-900">Beds</label>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {BED_OPTIONS_LIST.map((n) => (
                <button
                  key={n}
                  onClick={() => onFiltersChange({ bedrooms: n })}
                  className={`px-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    filters.bedrooms === n
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {n === 0 ? "Any" : `${n}+`}
                </button>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center gap-2 mb-3">
              <Bath className="h-4 w-4 text-orange-500" />
              <label className="text-sm font-bold text-slate-900">Baths</label>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {BATH_OPTIONS_LIST.map((n) => (
                <button
                  key={n}
                  onClick={() => onFiltersChange({ bathrooms: n })}
                  className={`px-1 py-2 rounded-lg text-xs font-semibold transition-all ${
                    filters.bathrooms === n
                      ? "bg-orange-500 text-white shadow-md shadow-orange-500/30"
                      : "bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200"
                  }`}
                >
                  {n === 0 ? "Any" : `${n}+`}
                </button>
              ))}
            </div>
          </section>
        </div>

        {/* Live-indicator hint */}
        <div className="flex items-center gap-2 text-[11px] text-slate-400 px-1">
          <Sparkles className="h-3 w-3" />
          <span>Filters apply live as you adjust them</span>
        </div>
      </div>

      {/* Footer with Clear All */}
      <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex-shrink-0">
        <Button
          variant="outline"
          onClick={onClearAll}
          disabled={!hasActiveFilters}
          className="w-full h-10 text-sm font-semibold border-slate-300 text-slate-700 hover:bg-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Clear All Filters
        </Button>
      </div>
    </div>
  )

  return (
    <>
      {/* ── DESKTOP: persistent sticky sidebar (expanded OR collapsed) ── */}
      {collapsed ? (
        // Slim rail: just an icon, the title, an active-filter count badge
        // and a chevron to re-expand. Saves horizontal space when the user
        // wants more room for the property list / map.
        <aside
          className="hidden md:flex md:flex-col md:w-14 md:flex-shrink-0 md:bg-white md:border-r md:border-slate-200 md:sticky md:top-[136px] md:self-start md:h-[calc(100vh-136px)] md:overflow-hidden"
          aria-label="Property filters (collapsed)"
        >
          <div className="flex flex-col items-center h-full">
            <button
              onClick={onToggleCollapse}
              className="w-10 h-10 mt-3 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-md shadow-orange-500/20 hover:scale-105 transition-transform relative"
              aria-label="Expand filters"
              title="Expand filters"
            >
              <SlidersHorizontal className="h-4 w-4 text-white" />
              {hasActiveFilters && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-white text-orange-600 text-[10px] font-bold flex items-center justify-center border-2 border-orange-500">
                  {[
                    filters.priceRange[0] > FILTER_PRICE_MIN,
                    filters.priceRange[1] < FILTER_PRICE_MAX,
                    filters.propertyType !== "all",
                    filters.bedrooms > 0,
                    filters.bathrooms > 0,
                  ].filter(Boolean).length}
                </span>
              )}
            </button>
            <div className="flex-1 flex flex-col items-center justify-center gap-1 -mt-2">
              <span
                className="text-[10px] font-bold text-slate-500 tracking-wider"
                style={{ writingMode: "vertical-rl", transform: "rotate(180deg)" }}
              >
                FILTERS
              </span>
            </div>
            <button
              onClick={onToggleCollapse}
              className="w-9 h-9 mb-3 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              aria-label="Expand filters"
              title="Expand filters"
            >
              <ChevronRight className="h-4 w-4 text-slate-600" />
            </button>
          </div>
        </aside>
      ) : (
        <aside
          className="hidden md:flex md:flex-col md:w-72 md:flex-shrink-0 md:bg-white md:border-r md:border-slate-200 md:sticky md:top-[136px] md:self-start md:h-[calc(100vh-136px)] md:overflow-hidden"
          aria-label="Property filters"
        >
          {filterBody}
        </aside>
      )}

      {/* ── MOBILE: bottom-sheet with drag handle & safe-area padding ── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop - only covers the area outside the sheet so users
                can still see the result count behind the dim layer. */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden fixed inset-0 bg-black/40 z-[60]"
              onClick={onMobileClose}
              aria-hidden="true"
            />

            {/* Sheet - proper bottom sheet (max 85vh, drag handle, safe-area).
                Pulls up from the bottom, auto-sizes to content, and leaves
                the top of the screen visible so the user always knows which
                page they're on. */}
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="md:hidden fixed inset-x-0 bottom-0 z-[70] bg-white rounded-t-2xl shadow-2xl flex flex-col max-h-[88vh] pb-[env(safe-area-inset-bottom,0px)]"
              role="dialog"
              aria-label="Filter properties"
              aria-modal="true"
            >
              {/* Drag handle - visual affordance + tap target to close */}
              <button
                onClick={onMobileClose}
                className="w-full pt-2 pb-3 flex justify-center flex-shrink-0"
                aria-label="Close filters"
              >
                <span className="block w-12 h-1.5 rounded-full bg-slate-300" />
              </button>

              <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
                {filterBody}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default PropertyFiltersSidebar
