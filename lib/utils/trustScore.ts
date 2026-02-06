import { supabase } from '@/lib/supabase/client'

/**
 * Trust Score Breakdown Interface
 */
export interface TrustScoreBreakdown {
  trust_score: number
  breakdown: {
    base_score: number
    verification_bonus: number
    rating_impact: number
    completion_bonus: number
    guarantee_bonus: number
  }
  ratings: {
    average: number
    count: number
  }
}

/**
 * Calculate trust score breakdown for a user
 * Trust Score Formula:
 * - Base Score: 50
 * - Verification Bonus: +20 (if approved)
 * - Rating Impact: (avg_rating - 3) * 10 (range: -20 to +20)
 * - Profile Completion: +15 (tenants only, if 100%)
 * - Guarantee Participation: +10 (landlords only, if joined)
 */
export async function calculateTrustScore(userId: string): Promise<TrustScoreBreakdown> {
  try {
    // Fetch user data
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('user_type, verification_status, trust_score')
      .eq('id', userId)
      .single()

    if (userError) throw userError

    // Fetch ratings
    const { data: ratings, error: ratingsError } = await supabase
      .from('ratings')
      .select('score')
      .eq('rated_id', userId)

    if (ratingsError) throw ratingsError

    // Calculate rating statistics
    const ratingCount = ratings?.length || 0
    const averageRating = ratingCount > 0
      ? ratings!.reduce((sum, r) => sum + r.score, 0) / ratingCount
      : 0

    // Base components
    const baseScore = 50
    const verificationBonus = user.verification_status === 'approved' ? 20 : 0
    const ratingImpact = ratingCount > 0 ? (averageRating - 3) * 10 : 0

    let completionBonus = 0
    let guaranteeBonus = 0

    // Type-specific bonuses
    if (user.user_type === 'tenant') {
      const { data: tenant } = await supabase
        .from('tenants')
        .select('profile_completion')
        .eq('id', userId)
        .single()

      completionBonus = tenant?.profile_completion === 100 ? 15 : 0
    } else if (user.user_type === 'landlord') {
      const { data: landlord } = await supabase
        .from('landlords')
        .select('guarantee_joined')
        .eq('id', userId)
        .single()

      guaranteeBonus = landlord?.guarantee_joined ? 10 : 0
    }

    // Calculate final score (0-100)
    const calculatedScore = Math.min(100, Math.max(0,
      baseScore + verificationBonus + ratingImpact + completionBonus + guaranteeBonus
    ))

    return {
      trust_score: Math.round(calculatedScore),
      breakdown: {
        base_score: baseScore,
        verification_bonus: verificationBonus,
        rating_impact: Math.round(ratingImpact),
        completion_bonus: completionBonus,
        guarantee_bonus: guaranteeBonus,
      },
      ratings: {
        average: ratingCount > 0 ? Math.round(averageRating * 10) / 10 : 0,
        count: ratingCount,
      },
    }
  } catch (error) {
    console.error('Error calculating trust score:', error)
    throw error
  }
}

/**
 * Update user's trust score in database
 */
export async function updateUserTrustScore(userId: string): Promise<number> {
  try {
    const breakdown = await calculateTrustScore(userId)

    const { error } = await supabase
      .from('users')
      .update({ trust_score: breakdown.trust_score })
      .eq('id', userId)

    if (error) throw error

    return breakdown.trust_score
  } catch (error) {
    console.error('Error updating trust score:', error)
    throw error
  }
}

/**
 * Calculate tenant profile completion percentage
 */
export function calculateProfileCompletion(tenant: {
  budget: number | null
  preferred_location: string | null
  documents: Record<string, any>
}): number {
  let completion = 0

  // Budget: 25%
  if (tenant.budget && tenant.budget > 0) {
    completion += 25
  }

  // Preferred location: 25%
  if (tenant.preferred_location) {
    completion += 25
  }

  // ID document: 30%
  if (tenant.documents?.id_url) {
    completion += 30
  }

  // Employment letter: 20%
  if (tenant.documents?.employment_letter) {
    completion += 20
  }

  return completion
}

/**
 * Get trust score color class for UI
 */
export function getTrustScoreColor(score: number): string {
  if (score >= 80) return 'text-green-600'
  if (score >= 60) return 'text-amber-600'
  if (score >= 40) return 'text-orange-600'
  return 'text-red-600'
}

/**
 * Get trust score badge variant
 */
export function getTrustScoreBadge(score: number): {
  label: string
  color: string
} {
  if (score >= 90) return { label: 'Excellent', color: 'bg-green-100 text-green-700' }
  if (score >= 80) return { label: 'Very Good', color: 'bg-green-100 text-green-600' }
  if (score >= 70) return { label: 'Good', color: 'bg-amber-100 text-amber-700' }
  if (score >= 60) return { label: 'Fair', color: 'bg-amber-100 text-amber-600' }
  if (score >= 50) return { label: 'Average', color: 'bg-orange-100 text-orange-600' }
  return { label: 'Low', color: 'bg-red-100 text-red-600' }
}

/**
 * Check if user meets minimum trust score requirement
 */
export function meetsMinimumTrustScore(score: number, requirement: number = 50): boolean {
  return score >= requirement
}
