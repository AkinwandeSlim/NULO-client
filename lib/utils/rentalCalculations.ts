/**
 * Rental Calculation Utilities
 * 
 * Provides consistent calculations for rent, security deposits, and fees
 * across all pages following Nigerian rental market standards.
 */

export interface RentalBreakdown {
  monthlyRent: number
  annualRent: number
  securityDeposit: number
  cautionFee: number
  platformFee: number
  serviceCharge: number
  totalDue: number
}

export interface PropertyData {
  price?: number | null
  security_deposit?: number | null
  caution_fee?: number | null
  platform_fee?: number | null
  service_charge?: number | null
}

export interface AgreementData {
  rent_amount?: number | null
  deposit_amount?: number | null
  platform_fee?: number | null
  service_charge?: number | null
}

export interface PaymentBreakdownData {
  monthly_rent?: number
  annual_rent?: number
  security_deposit?: number
  platform_fee?: number
  service_charge?: number
}

export interface TransactionData {
  notes?: string | null
}

/**
 * Calculate rental breakdown from property data
 * Uses Nigerian rental market standards: Security deposit = 2 months rent
 */
export function calculateRentalBreakdown(property: PropertyData): RentalBreakdown {
  const monthlyRent = property.price || 0
  const annualRent = monthlyRent * 12
  
  // Always use 2 months rent for security deposit to ensure consistency
  // This overrides any old values stored in the database
  const securityDeposit = monthlyRent * 2
  
  // For display consistency, always show caution fee as security deposit
  const cautionFee = securityDeposit
  
  const platformFee = property.platform_fee ?? 0
  const serviceCharge = property.service_charge ?? 0
  const totalDue = annualRent + cautionFee + platformFee + serviceCharge

  return {
    monthlyRent,
    annualRent,
    securityDeposit,
    cautionFee,
    platformFee,
    serviceCharge,
    totalDue
  }
}

/**
 * Calculate rental breakdown from agreement data
 */
export function calculateAgreementBreakdown(agreement: AgreementData): RentalBreakdown {
  const monthlyRent = agreement.rent_amount || 0
  const annualRent = monthlyRent * 12
  
  // Always use 2 months rent for security deposit to ensure consistency
  // This overrides any old values stored in the database
  const securityDeposit = monthlyRent * 2
  const cautionFee = securityDeposit
  
  const platformFee = agreement.platform_fee ?? 0
  const serviceCharge = agreement.service_charge ?? 0
  const totalDue = annualRent + cautionFee + platformFee + serviceCharge

  return {
    monthlyRent,
    annualRent,
    securityDeposit,
    cautionFee,
    platformFee,
    serviceCharge,
    totalDue
  }
}

/**
 * Parse payment breakdown from transaction notes
 * Safely extracts payment breakdown data from JSON string in transaction.notes
 */
export function parsePaymentBreakdown(transaction: TransactionData): PaymentBreakdownData | null {
  try {
    if (transaction.notes) {
      console.log('🔍 [PAYMENTS] Raw notes:', transaction.notes)
      
      // Check if it's JSON first
      if (transaction.notes.startsWith('{') || transaction.notes.startsWith('[')) {
        const notes = JSON.parse(transaction.notes)
        console.log('🔍 [PAYMENTS] Parsed JSON notes:', notes)
        if (notes.payment_breakdown) {
          return notes.payment_breakdown
        }
      }
    }
  } catch (error) {
    console.warn('⚠️ [PAYMENTS] Failed to parse payment breakdown:', error)
    console.log('🔍 [PAYMENTS] Notes content:', transaction.notes)
  }
  return null
}

/**
 * Get security deposit amount with consistent fallback
 */
export function getSecurityDeposit(property?: PropertyData, agreement?: AgreementData): number {
  if (agreement?.deposit_amount) {
    return agreement.deposit_amount
  }
  
  if (property?.security_deposit) {
    return property.security_deposit
  }
  
  // Default to 2 months rent
  const monthlyRent = property?.price || agreement?.rent_amount || 0
  return monthlyRent * 2
}

/**
 * Format currency for display
 */
export function formatNGN(amount: number): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Get rent period description
 */
export function getRentPeriodDescription(months: number): string {
  if (months === 12) return "Annual rent (12 months)"
  if (months === 6) return "Semi-annual rent (6 months)"
  if (months === 3) return "Quarterly rent (3 months)"
  return `${months} months of rent`
}
