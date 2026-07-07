/**
 * Banner Storage — Simple localStorage-only banner dismissal tracker
 * =============================================================
 * Replaces the async backend approach with a synchronous localStorage
 * solution. This eliminates the "flash of banner" problem that happens
 * when the backend hook is still loading.
 *
 * Trade-off: doesn't sync across devices. But for informational banners,
 * this is acceptable — banners are not critical notifications.
 *
 * Design:
 *   - Single localStorage key: 'dismissed_banners'
 *   - Stores a JSON object: { [banner_key]: timestamp_ms }
 *   - Synchronous read/write — no async, no flash
 *   - SSR-safe (returns empty set on server)
 *   - Auto-expires entries (default 90 days) to prevent stale data
 *
 * Usage:
 *   import { isBannerDismissed, dismissBanner, buildBannerKey } from '@/lib/bannerStorage'
 *
 *   // Render check (synchronous, no flash):
 *   if (isBannerDismissed(buildBannerKey('tenancy_status', agreementId))) return null
 *
 *   // On dismiss click:
 *   dismissBanner(buildBannerKey('tenancy_status', agreementId))
 */

// ─── Constants ────────────────────────────────────────────────────────────────

const STORAGE_KEY = 'dismissed_banners_v1'
/** Default expiry: 90 days. Banners older than this can re-surface. */
const DEFAULT_EXPIRY_DAYS = 90
const DEFAULT_EXPIRY_MS = DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Read all current dismissals from localStorage.
 * Returns an empty object on SSR, quota errors, or parse failures.
 */
function readAll(): Record<string, number> {
  if (typeof window === 'undefined') return {}
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    const parsed = JSON.parse(raw)
    if (typeof parsed !== 'object' || parsed === null) return {}

    // Filter out expired entries opportunistically
    const now = Date.now()
    const valid: Record<string, number> = {}
    for (const [key, ts] of Object.entries(parsed)) {
      if (typeof ts === 'number' && now - ts < DEFAULT_EXPIRY_MS) {
        valid[key] = ts
      }
    }
    return valid
  } catch {
    // localStorage unavailable (private mode, quota, SSR)
    return {}
  }
}

/**
 * Persist the full dismissals map. Keeps storage compact by writing only
 * valid entries.
 */
function writeAll(dismissals: Record<string, number>): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(dismissals))
  } catch (err) {
    // Quota exceeded or storage disabled — fail silently.
    // The in-memory state still works for this session.
    console.warn('bannerStorage: localStorage write failed:', err)
  }
}

// ─── Public API ──────────────────────────────────────────────────────────────

/**
 * Synchronous check: is this banner currently dismissed?
 * Use this in render code — no flash, no async.
 */
export function isBannerDismissed(banner_key: string): boolean {
  const all = readAll()
  return banner_key in all
}

/**
 * Mark a banner as dismissed. Synchronous write + return the new state.
 * Fires a 'banner-dismissed' CustomEvent so other components can react.
 */
export function dismissBanner(banner_key: string): void {
  if (typeof window === 'undefined') return
  const all = readAll()
  all[banner_key] = Date.now()
  writeAll(all)

  // Notify any listeners (e.g. settings pages, debug tools)
  window.dispatchEvent(
    new CustomEvent('banner-dismissed', { detail: { banner_key } })
  )
  console.log('✅ [bannerStorage] Dismissed:', banner_key)
}

/**
 * Remove a dismissal so the banner shows again. Useful for QA / settings.
 */
export function undismissBanner(banner_key: string): void {
  if (typeof window === 'undefined') return
  const all = readAll()
  delete all[banner_key]
  writeAll(all)
  console.log('🔄 [bannerStorage] Undismissed:', banner_key)
}

/**
 * Clear all dismissals. Used on logout so the next user doesn't see
 * stale state from a previous session on the same machine.
 */
export function clearAllDismissals(): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    console.log('🧹 [bannerStorage] Cleared all dismissals')
  } catch {
    // ignore
  }
}

/**
 * Build a stable banner_key from a type + entity id.
 * Use a consistent format across the codebase so the same banner
 * always gets the same key.
 *
 *   buildBannerKey('tenancy_status', 'agreement-123')
 *   // → "tenancy_status:agreement-123"
 */
export function buildBannerKey(
  type:
    | 'tenancy_status'
    | 'agreement_signed'
    | 'landlord_signature'
    | 'viewing_confirmed'
    | 'viewing_request'      // Landlord "you have N pending viewing requests"
    | 'upcoming_viewing'
    | 'message'
    | 'payment_confirmed'
    | 'new_application'
    | 'pending_release'
    | 'expiring_lease',
  entityId: string
): string {
  return `${type}:${entityId}`
}

/**
 * Build a deterministic status hash from a payload. If the underlying
 * state changes (e.g. payment goes through for an "Agreement Signed"
 * banner), pass a different hash — the banner will re-surface.
 *
 * Example:
 *   buildStatusHash({ agreement_id: 'abc', status: 'SIGNED' })
 *   // → "agreement_id:abc|status:SIGNED"
 */
export function buildStatusHash(payload: Record<string, unknown>): string {
  return Object.entries(payload)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}:${String(v ?? '')}`)
    .join('|')
}

/**
 * Subscribe to dismissal events. Returns an unsubscribe function.
 *
 *   const unsub = onBannerDismissed(({ banner_key }) => {
 *     console.log('Dismissed:', banner_key)
 *   })
 *   // Later:
 *   unsub()
 */
export function onBannerDismissed(
  handler: (detail: { banner_key: string }) => void
): () => void {
  if (typeof window === 'undefined') return () => {}
  const listener = (e: Event) => handler((e as CustomEvent).detail)
  window.addEventListener('banner-dismissed', listener)
  return () => window.removeEventListener('banner-dismissed', listener)
}