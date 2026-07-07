/**
 * Shared filter constants
 * -----------------------
 * Used by:
 *  - client/components/properties/PropertyFiltersSidebar.tsx (marketplace sidebar)
 *  - client/components/home/SearchBarCompact.tsx           (homepage search bar)
 *  - client/components/home/AdvancedFiltersModal.tsx      (homepage advanced modal)
 *
 * Centralising these guarantees the three filter UIs agree on the same:
 *  - price bounds
 *  - property-type vocabulary (TitleCase, matching the DB)
 *  - bedroom / bathroom option lists
 *
 * NB: PROPERTY_TYPES are TitleCase on purpose — the DB stores them as TitleCase
 * and the backend filter is case-insensitive (`.ilike()`), but we keep the
 * canonical form consistent so the URLs and the DB always match exactly.
 */

export const FILTER_PRICE_MIN = 0
export const FILTER_PRICE_MAX = 5_000_000
export const FILTER_PRICE_STEP = 10_000
export const FILTER_PRICE_PRESETS = [
  { label: 'Budget',   min: 0,          max: 1_000_000 },
  { label: 'Standard', min: 1_000_000,  max: 3_000_000 },
  { label: 'Premium',  min: 3_000_000,  max: 5_000_000 },
] as const

export const PROPERTY_TYPES = [
  { value: 'all',       label: 'All Properties' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'Villa',     label: 'Villa' },
  { value: 'House',     label: 'House' },
  { value: 'Penthouse', label: 'Penthouse' },
  { value: 'Bungalow',  label: 'Bungalow' },
  { value: 'Duplex',    label: 'Duplex' },
  { value: 'Mansion',   label: 'Mansion' },
  { value: 'Terrace',   label: 'Terrace' },
] as const

// 0 = Any, otherwise "N+"
export const BED_OPTIONS = [0, 1, 2, 3, 4, 5] as const
export const BATH_OPTIONS = [0, 1, 2, 3, 4] as const

export const formatFilterPrice = (value: number): string => {
  if (value >= 1_000_000) return `\u20A6${(value / 1_000_000).toFixed(1)}M`
  if (value >= 1_000)     return `\u20A6${(value / 1_000).toFixed(0)}K`
  return `\u20A6${value.toLocaleString('en-NG')}`
}
