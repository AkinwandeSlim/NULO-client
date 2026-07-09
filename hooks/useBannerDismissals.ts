/**
 * useBannerDismissals Hook
 * =============================================================
 * Server-backed banner dismissal management for dashboard banners.
 * Replaces the previous localStorage-based approach so dismissals
 * persist across devices, browsers, and sessions.
 *
 * Usage:
 *
 *   const { isDismissed, dismiss, checkVisibility, refresh } =
 *     useBannerDismissals()
 *
 *   // On dashboard load:
 *   const visibleKeys = await checkVisibility([
 *     { banner_key: 'tenancy:abc', banner_type: 'tenancy_status', status_hash: hash1 },
 *     { banner_key: 'payment:xyz', banner_type: 'agreement_signed', status_hash: hash2 },
 *   ])
 *
 *   // When user clicks dismiss:
 *   await dismiss({
 *     banner_key: 'tenancy:abc',
 *     banner_type: 'tenancy_status',
 *     status_hash: hash1,
 *   })
 *
 * Edge case: if the banner's underlying state changes (e.g. payment
 * goes through for an "Agreement Signed" banner), the frontend should
 * compute a NEW status_hash. The hook's checkVisibility() returns
 * banners whose stored hash differs from the current hash as VISIBLE
 * again — so the user sees the updated information.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import {
  bannerDismissalsAPI,
  type BannerCheckCandidate,
  type BannerCheckResponse,
  type DismissBannerOptions,
  type BannerType,
} from '@/lib/api/bannerDismissals'
import {
  dismissBanner as persistLocalDismissal,
  undismissBanner as removeLocalDismissal,
  clearAllDismissals,
} from '@/lib/bannerStorage'

interface UseBannerDismissalsReturn {
  /** True if the hook is loading initial state from the backend */
  isLoading: boolean
  /** True if the user is authenticated and we can talk to the backend */
  isReady: boolean
  /**
   * Quick O(1) lookup by banner_key. Use this to decide whether to render
   * a banner. `isDismissed('payment:abc')` returns true if the user has
   * dismissed this banner with a matching current status_hash.
   */
  isDismissed: (banner_key: string) => boolean
  /**
   * Dismiss a banner. Persists server-side. Optimistically removes it
   * from the local set so the UI updates instantly.
   */
  dismiss: (options: DismissBannerOptions) => Promise<void>
  /**
   * Bulk-check visibility against current state hashes. Returns the keys
   * that should be displayed. The hook also updates its internal dismissed
   * set based on this response, so you don't need to call isDismissed()
   * immediately after.
   */
  checkVisibility: (candidates: BannerCheckCandidate[]) => Promise<string[]>
  /** Reload the dismissed set from the server (rarely needed) */
  refresh: () => Promise<void>
  /** Clear all locally-cached dismissals (logout helper) */
  reset: () => void
}

export function useBannerDismissals(): UseBannerDismissalsReturn {
  const { user } = useAuth()
  const isAuthenticated = !!user?.id

  const [dismissedKeys, setDismissedKeys] = useState<Set<string>>(new Set())
  const [isLoading, setIsLoading] = useState(false)

  // Guard against double-fetching in React strict mode
  const fetchedRef = useRef(false)
  const lastUserIdRef = useRef<string | null>(null)

  // ─── Initial load: fetch all dismissals on mount ─────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !user?.id) {
      setDismissedKeys(new Set())
      fetchedRef.current = false
      lastUserIdRef.current = null
      return
    }

    // Skip if we already fetched for this user
    if (fetchedRef.current && lastUserIdRef.current === user.id) {
      return
    }

    let cancelled = false
    setIsLoading(true)

    ;(async () => {
      try {
        const response = await bannerDismissalsAPI.list()
        if (cancelled) return
        const next = new Set<string>()
        for (const d of response.dismissals) {
          next.add(d.banner_key)
        }
        setDismissedKeys(next)
        for (const key of next) {
          persistLocalDismissal(key)
        }
        fetchedRef.current = true
        lastUserIdRef.current = user.id
        console.log('✅ [useBannerDismissals] Loaded', next.size, 'dismissals')
      } catch (err: any) {
        if (!cancelled) {
          const isTimeout = err?.code === 'ECONNABORTED' || err?.message?.includes('timeout')
          if (isTimeout) {
            console.warn('⏱️ [useBannerDismissals] API timeout — using localStorage fallback')
            // Fall back to localStorage dismissals on timeout
            // This prevents dashboard from being completely blocked
            const storedKeys = new Set<string>()
            for (let i = 0; i < localStorage.length; i++) {
              const key = localStorage.key(i)
              if (key?.startsWith('banner_dismissed_')) {
                storedKeys.add(key.replace('banner_dismissed_', ''))
              }
            }
            setDismissedKeys(storedKeys)
          } else {
            console.error('❌ [useBannerDismissals] Failed to load dismissals:', err)
            // Fail open: if the backend is unreachable, no banners are
            // dismissed, so all candidates show. This is the safe default.
            setDismissedKeys(new Set())
          }
        }
      } finally {
        if (!cancelled) setIsLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user?.id])

  // ─── Public API ──────────────────────────────────────────────────────────

  const isDismissed = useCallback(
    (banner_key: string): boolean => {
      return dismissedKeys.has(banner_key)
    },
    [dismissedKeys]
  )

  const dismiss = useCallback(
    async (options: DismissBannerOptions): Promise<void> => {
      // Optimistic update — remove from set immediately so the UI
      // re-renders without waiting for the server round-trip.
      setDismissedKeys((prev) => {
        const next = new Set(prev)
        next.add(options.banner_key)
        return next
      })

      try {
        await bannerDismissalsAPI.dismiss(options)
        persistLocalDismissal(options.banner_key)
        console.log('✅ [useBannerDismissals] Dismissed:', options.banner_key)
      } catch (err) {
        console.error(
          '❌ [useBannerDismissals] Failed to dismiss banner:',
          options.banner_key,
          err
        )
        // Roll back the optimistic update so the user can try again.
        setDismissedKeys((prev) => {
          const next = new Set(prev)
          next.delete(options.banner_key)
          return next
        })
        throw err
      }
    },
    []
  )

  const checkVisibility = useCallback(
    async (candidates: BannerCheckCandidate[]): Promise<string[]> => {
      if (!isAuthenticated || candidates.length === 0) {
        // No backend call needed — every candidate is visible
        return candidates.map((c) => c.banner_key)
      }

      try {
        const response: BannerCheckResponse =
          await bannerDismissalsAPI.check(candidates)

        // Sync the local dismissed set with the server's truth so that
        // isDismissed() works correctly immediately after this call.
        setDismissedKeys((prev) => {
          const next = new Set(prev)
          for (const d of response.dismissed) {
            next.add(d.banner_key)
            persistLocalDismissal(d.banner_key)
          }
          // Banners that the server reports as visible might be in our
          // local set (e.g. status_hash changed) — remove them so we
          // re-render correctly next time.
          for (const v of response.visible) {
            next.delete(v.banner_key)
            removeLocalDismissal(v.banner_key)
          }
          return next
        })

        return response.visible.map((v) => v.banner_key)
      } catch (err) {
        console.error('❌ [useBannerDismissals] checkVisibility failed:', err)
        // Fail open: show everything if the backend is broken.
        return candidates.map((c) => c.banner_key)
      }
    },
    [isAuthenticated]
  )

  const refresh = useCallback(async (): Promise<void> => {
    if (!isAuthenticated) return
    try {
      const response = await bannerDismissalsAPI.list()
      const next = new Set<string>()
      for (const d of response.dismissals) {
        next.add(d.banner_key)
      }
      setDismissedKeys(next)
      for (const key of next) {
        persistLocalDismissal(key)
      }
    } catch (err) {
      console.error('❌ [useBannerDismissals] refresh failed:', err)
    }
  }, [isAuthenticated])

  const reset = useCallback(() => {
    setDismissedKeys(new Set())
    clearAllDismissals()
    fetchedRef.current = false
    lastUserIdRef.current = null
  }, [])

  return {
    isLoading,
    isReady: isAuthenticated && !isLoading,
    isDismissed,
    dismiss,
    checkVisibility,
    refresh,
    reset,
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Build a stable status hash from a payload object. The exact format doesn't
 * matter (any deterministic string works), but it MUST change when the
 * underlying banner state changes — that's how the backend decides whether
 * to re-surface a dismissed banner.
 *
 * Example:
 *   buildStatusHash({ agreement_id: 'abc', status: 'SIGNED' })
 *   // → "SIGNED:abc"
 */
export function buildStatusHash(payload: Record<string, unknown>): string {
  const entries = Object.entries(payload)
    // Sort keys for stability across runs
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v ?? '')}`)
    .join('|')
  return entries
}

/**
 * Compose a banner_key from a type + entity id. Use a consistent format
 * across the codebase so the same banner always gets the same key.
 *
 * Example:
 *   makeBannerKey('tenancy_status', 'agreement-123')
 *   // → "tenancy_status:agreement-123"
 */
export function makeBannerKey(type: BannerType, entityId: string): string {
  return `${type}:${entityId}`
}