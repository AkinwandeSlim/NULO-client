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
   * 
   * Timeout strategy:
   *   - 30s timeout (increased from 10s) to accommodate slow backend queries
   *   - If timeout occurs, hook falls back to localStorage dismissals
   *   - This prevents dashboard from being blocked by slow API
   */
  list: async (): Promise<BannerDismissalListResponse> => {
    console.log('🚫 [BANNER DISMISSALS API] Fetching all dismissals...')
    try {
      const response = await apiClient.get<BannerDismissalListResponse>(
        '/api/v1/banner-dismissals',
        { timeout: 30000 } // 30 second timeout to accommodate backend performance
      )
      console.log('✅ [BANNER DISMISSALS API] Loaded dismissals:', response.data.count)
      return response.data
    } catch (err: any) {
      // Log timeout specifically for backend team to optimize query
      if (err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')) {
        console.warn('⏱️ [BANNER DISMISSALS API] Request timeout (>30s) — falling back to localStorage')
      }
      // Re-throw to let hook handle fallback
      throw err
    }
  },

  /**
   * Dismiss a banner. Idempotent — re-dismissing updates the row instead of
   * erroring. Returns the timestamp the dismissal was recorded.
   * 
   * Non-blocking: errors are logged but don't prevent dismissal optimistically
   * applied in the hook. Dismissal is persisted to localStorage as fallback.
   */
  dismiss: async (options: DismissBannerOptions): Promise<BannerDismissResponse> => {
    console.log('🚫 [BANNER DISMISSALS API] Dismissing banner:', options.banner_key)
    try {
      const response = await apiClient.post<BannerDismissResponse>(
        '/api/v1/banner-dismissals',
        options,
        { timeout: 15000 } // 15s timeout for POST (typically faster than GET)
      )
      console.log('✅ [BANNER DISMISSALS API] Banner dismissed:', response.data.banner_key)
      return response.data
    } catch (err: any) {
      // Log error but don't fail — optimistic update already happened in hook
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
      if (isTimeout) {
        console.warn('⏱️ [BANNER DISMISSALS API] Dismiss request timeout — using localStorage')
      } else {
        console.error('⚠️ [BANNER DISMISSALS API] Dismiss failed, will retry on next session:', err?.message)
      }
      // Return a synthetic response since dismissal is already optimistically applied
      return {
        success: true,
        banner_key: options.banner_key,
        dismissed_at: new Date().toISOString()
      }
    }
  },

  /**
   * Bulk check: given a list of candidate banners with their current status
   * hashes, return which are visible vs. dismissed. This is the main
   * endpoint the dashboard hits on load.
   */
  check: async (candidates: BannerCheckCandidate[]): Promise<BannerCheckResponse> => {
    console.log('🚫 [BANNER DISMISSALS API] Checking', candidates.length, 'candidates...')
    try {
      const response = await apiClient.post<BannerCheckResponse>(
        '/api/v1/banner-dismissals/check',
        { candidates },
        { timeout: 20000 } // 20s timeout for check endpoint
      )
      console.log('✅ [BANNER DISMISSALS API] Check result:', {
        visible: response.data.visible.length,
        dismissed: response.data.dismissed.length,
      })
      return response.data
    } catch (err: any) {
      // On timeout/error, assume all candidates are visible (fail-safe)
      const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
      if (isTimeout) {
        console.warn('⏱️ [BANNER DISMISSALS API] Check timeout — showing all candidates as visible')
      } else {
        console.error('⚠️ [BANNER DISMISSALS API] Check failed — showing all candidates as visible:', err?.message)
      }
      return {
        visible: candidates,
        dismissed: []
      }
    }
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