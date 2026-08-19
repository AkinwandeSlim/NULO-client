/**
 * Utility functions for formatting data
 */

/**
 * Format price in Nigerian Naira
 */
export function formatPrice(price: number | undefined): string {
  if (!price || price === 0) return 'Price not available'
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(price)
}

/**
 * Format compact price for cards (e.g., ₦1.2M, ₦850K)
 */
export function formatPriceCompact(price: number | undefined): string {
  if (!price || price === 0) return 'Price not available'
  if (price >= 1000000) {
    return `₦${(price / 1000000).toFixed(1)}M`
  } else if (price >= 1000) {
    return `₦${(price / 1000).toFixed(0)}K`
  }
  return `₦${price.toLocaleString()}`
}

/**
 * Format price range
 */
export function formatPriceRange(min: number, max: number): string {
  if (min === 0 && max >= 10000000) {
    return 'Any Price'
  }
  if (min === 0) {
    return `Under ${formatPrice(max)}`
  }
  if (max >= 10000000) {
    return `${formatPrice(min)}+`
  }
  return `${formatPrice(min)} - ${formatPrice(max)}`
}

/**
 * Format property specs
 */
export function formatPropertySpecs(property: {
  beds: number
  baths: number
  sqft?: number
  property_type: string
}): string {
  const specs = []
  
  if (property.beds > 0) {
    specs.push(`${property.beds} bed${property.beds > 1 ? 's' : ''}`)
  }
  
  if (property.baths > 0) {
    specs.push(`${property.baths} bath${property.baths > 1 ? 's' : ''}`)
  }
  
  if (property.sqft && property.sqft > 0) {
    specs.push(`${property.sqft.toLocaleString()} sqft`)
  }
  
  if (property.property_type) {
    specs.push(property.property_type)
  }
  
  return specs.join(' • ')
}

/**
 * Format location for display
 */
export function formatLocation(property: {
  location?: string
  city: string
  state: string
}): string {
  if (property.location && property.location !== property.city) {
    return `${property.location}, ${property.city}`
  }
  return `${property.city}, ${property.state}`
}

/**
 * Format date relative to now
 */
export function formatDateRelative(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return 'Today'
  } else if (diffDays === 1) {
    return 'Yesterday'
  } else if (diffDays < 7) {
    return `${diffDays} days ago`
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `${weeks} week${weeks > 1 ? 's' : ''} ago`
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30)
    return `${months} month${months > 1 ? 's' : ''} ago`
  } else {
    const years = Math.floor(diffDays / 365)
    return `${years} year${years > 1 ? 's' : ''} ago`
  }
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength).trim() + '...'
}

/**
 * Generate property URL slug
 */
export function generatePropertySlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
  
  return `${slug}-${id}`
}

/**
 * Calculate distance between two coordinates (in km)
 */
export function calculateDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  const R = 6371 // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
  return R * c
}

/**
 * Format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Validate Nigerian phone number
 */
export function validateNigerianPhone(phone: string): boolean {
  // Nigerian phone numbers: +234XXXXXXXXXX or 0XXXXXXXXXX
  const nigerianPhoneRegex = /^(\+234|0)[789][01]\d{8}$/
  return nigerianPhoneRegex.test(phone.replace(/\s/g, ''))
}

/**
 * Format Nigerian phone number for display
 */
export function formatNigerianPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.startsWith('234') && cleaned.length === 13) {
    return `+234 ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)} ${cleaned.slice(10)}`
  } else if (cleaned.startsWith('0') && cleaned.length === 11) {
    return `0${cleaned.slice(1, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  
  return phone
}

/**
 * Get property status color
 */
export function getPropertyStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'vacant':
      return 'text-green-600 bg-green-50'
    case 'occupied':
      return 'text-blue-600 bg-blue-50'
    case 'maintenance':
      return 'text-yellow-600 bg-yellow-50'
    case 'inactive':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Get verification status color
 */
export function getVerificationStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'approved':
      return 'text-green-600 bg-green-50'
    case 'pending':
      return 'text-yellow-600 bg-yellow-50'
    case 'rejected':
      return 'text-red-600 bg-red-50'
    default:
      return 'text-gray-600 bg-gray-50'
  }
}

/**
 * Normalize a PropFlow landlord briefing into clean Markdown so the
 * <Markdown> component renders it as: header paragraph → "What we know:"
 * label → real bullet list → closing "Not provided" line.
 *
 * Why this exists: briefings stored in the DB before the server-side fix
 * were joined with single newlines, and Markdown collapses those into
 * spaces — the header merged into the label and the bullets became one big
 * paragraph. This inserts blank lines between blocks so BOTH old and new
 * briefings render in the intended structure. Idempotent: already
 * blank-line-separated text passes through unchanged.
 */
export function formatBriefingMarkdown(briefing: string): string {
  if (!briefing) return ''

  const lines = briefing.split(/\r?\n/).map((l) => l.trim())

  const blocks: string[] = []
  let bullets: string[] = []

  const flushBullets = () => {
    if (bullets.length) {
      blocks.push(bullets.join('\n'))
      bullets = []
    }
  }

  for (const line of lines) {
    if (!line) continue // blank line = block separator
    if (line.startsWith('- ') || line.startsWith('* ')) {
      bullets.push(`- ${line.slice(2).trim()}`)
    } else {
      flushBullets()
      blocks.push(line)
    }
  }
  flushBullets()

  return blocks.join('\n\n')
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    
    timeout = setTimeout(() => {
      func(...args)
    }, wait)
  }
}

/**
 * Generate cache key for API requests
 */
export function generateCacheKey(params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|')
  
  return btoa(sortedParams)
}

/**
 * Check if device is mobile
 */
export function isMobile(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < 768
}

/**
 * Check if device is tablet
 */
export function isTablet(): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= 768 && window.innerWidth < 1024
}

/**
 * Get responsive grid columns based on view mode
 */
export function getResponsiveGridColumns(viewMode: string): string {
  switch (viewMode) {
    case 'split':
      return 'grid-cols-1'
    case 'list':
      return 'grid-cols-1'
    case 'grid':
    default:
      return 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }
}
