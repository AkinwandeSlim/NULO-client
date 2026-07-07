/**
 * Banner Dismissals API Module
 * =============================================================
 * Server-side persistent tracking of which dashboard banners
 * a user has dismissed. Replaces the previous localStorage-based
 * approach that didn't survive across devices/sessions.
 *
 * Why server-side?
 *   - Follows the user across all devices and browsers
 *   - Persists even if the user clears their browser cache
 *   - Lets us invalidate dismissals when the underlying banner
 *     state changes (status_hash mismatch)
 *   - Works for users who sign in on multiple devices
 *
 * Banner types (banner_type column values):
 *   - tenancy_status         "Tenancy Status: ✨ Active"
 *   - agreement_signed       "💰 Agreement Signed! Time to Secure Your Rental"
 *   - viewing_confirmed      "🗓️ Viewing Confirmed! Get Ready"
 *   - upcoming_viewing       "🔜 Viewing Soon"
 *   - message                "💬 New Message"
 *   - payment_confirmed      "✅ Payment Confirmed"
 *
 * Status hash edge-case handling:
 *   If the data behind a banner changes (e.g. payment goes through),
 *   the frontend computes a new status_hash. The backend compares
 *   the new hash to the stored one and returns the banner as
 *   "visible" again if they differ.
 */

import apiClient from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type BannerType =
  | 'tenancy_status'
  | 'agreement_signed'
  | 'viewing_confirmed'
  | 'upcoming_viewing'
  | 'message'
  | 'payment_confirmed'

export interface BannerDismissalItem {
  banner_key: string
  banner_type: string
  status_hash: string
  dismissed_at: string
  expires_at: string | null
}

export interface BannerDismissalListResponse {
  dismissals: BannerDismissalItem[]
  count: number
}

export interface BannerCheckCandidate {
  banner_key: string
  banner_type: string
  status_hash: string
}

export interface BannerCheckRequest {
  candidates: BannerCheckCandidate[]
}

export interface BannerCheckResponse {
  visible: BannerCheckCandidate[]
  dismissed: BannerCheckCandidate[]
}

export interface BannerDismissResponse {
  success: boolean
  banner_key: string
  dismissed_at: string
}

export interface DismissBannerOptions {
  banner_key: string
  banner_type: BannerType
  /**
   * SHA-256 hash (or any deterministic string) representing the current
   * state of the underlying data. If the underlying state changes, the
   * frontend computes a new hash and the backend treats the banner as
   * visible again.
   */
  status_hash: string
  /**
   * Optional auto-expiry in seconds. Useful for banners that should
   * re-surface periodically (e.g. message banners auto-clear after 30
   * days). Pass undefined to persist indefinitely until status_hash changes.
   */
  expires_in_seconds?: number
}

// ─── API ─────────────────────────────────────────────────────────────────────

export const bannerDismissalsAPI = {
  /**
   * Fetch all current dismissals for the logged-in user. Used on dashboard
   * mount to filter out already-dismissed banners.
   */
  list: async (): Promise<BannerDismissalListResponse> => {
    console.log('🚫 [BANNER DISMISSALS API] Fetching all dismissals...')
    const response = await apiClient.get<BannerDismissalListResponse>(
      '/api/v1/banner-dismissals'
    )
    console.log('✅ [BANNER DISMISSALS API] Loaded dismissals:', response.data.count)
    return response.data
  },

  /**
   * Dismiss a banner. Idempotent — re-dismissing updates the row instead of
   * erroring. Returns the timestamp the dismissal was recorded.
   */
  dismiss: async (options: DismissBannerOptions): Promise<BannerDismissResponse> => {
    console.log('🚫 [BANNER DISMISSALS API] Dismissing banner:', options.banner_key)
    const response = await apiClient.post<BannerDismissResponse>(
      '/api/v1/banner-dismissals',
      options
    )
    console.log('✅ [BANNER DISMISSALS API] Banner dismissed:', response.data.banner_key)
    return response.data
  },

  /**
   * Bulk check: given a list of candidate banners with their current status
   * hashes, return which are visible vs. dismissed. This is the main
   * endpoint the dashboard hits on load.
   */
  check: async (candidates: BannerCheckCandidate[]): Promise<BannerCheckResponse> => {
    console.log('🚫 [BANNER DISMISSALS API] Checking', candidates.length, 'candidates...')
    const response = await apiClient.post<BannerCheckResponse>(
      '/api/v1/banner-dismissals/check',
      { candidates }
    )
    console.log('✅ [BANNER DISMISSALS API] Check result:', {
      visible: response.data.visible.length,
      dismissed: response.data.dismissed.length,
    })
    return response.data
  },

  /**
   * Remove a dismissal so the banner shows again. Used by:
   *   - Settings ("re-engage me with these" option)
   *   - QA / testing
   *   - Status-hash mismatch flows
   */
  undismiss: async (banner_key: string): Promise<void> => {
    console.log('🚫 [BANNER DISMISSALS API] Undismissing banner:', banner_key)
    await apiClient.delete(`/api/v1/banner-dismissals/${encodeURIComponent(banner_key)}`)
    console.log('✅ [BANNER DISMISSALS API] Banner undismissed')
  },
}