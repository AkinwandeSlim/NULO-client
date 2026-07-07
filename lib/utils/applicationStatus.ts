/**
 * Shared application status helpers.
 *
 * IMPORTANT: The server's `applications.status` column is constrained by
 * the `applications_status_check` Postgres check constraint which only
 * accepts these values (see DB schema):
 *   - "submitted"
 *   - "under_review"
 *   - "approved"
 *   - "rejected"
 *   - "withdrawn"
 *
 * Older parts of the UI (and the Application TS type) still use
 * "pending" for the same idea. To avoid touching the DB or every callsite,
 * we normalize here: treat both "submitted" and "under_review" as
 * "pending" for display + filtering purposes.
 *
 * Anything not in the table below falls back to "pending" so the row is
 * still rendered instead of being hidden behind an unknown status.
 */

export type AppUiStatus = 'pending' | 'approved' | 'rejected' | 'withdrawn'

/**
 * Map a raw DB status string to the UI-friendly status used by the
 * client-side Application type and filtering logic.
 */
export function normalizeAppStatus(raw: string | null | undefined): AppUiStatus {
  switch (raw) {
    case 'pending':
    case 'submitted':
    case 'under_review':
      return 'pending'
    case 'approved':
      return 'approved'
    case 'rejected':
      return 'rejected'
    case 'withdrawn':
      return 'withdrawn'
    default:
      // Unknown status — treat as pending so the row is still visible
      return 'pending'
  }
}