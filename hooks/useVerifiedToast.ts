"use client"

/**
 * useVerifiedToast
 * ─────────────────
 * Drop this hook into ANY page that a user lands on after email verification
 * OR after a Google OAuth sign-up. It reads the query params injected by
 * route.ts and shows the right toast for each flow:
 *
 *   ?verified=1  → email-signup user just clicked the confirmation link
 *   ?oauth=1     → Google OAuth user (email already verified by Google)
 *   ?correction=1 → admin sent the landlord back to fix their submission
 *
 * Usage (e.g. in /onboarding/landlord/step-1/page.tsx):
 *
 *   import { useVerifiedToast } from "@/hooks/useVerifiedToast"
 *
 *   export default function Step1Page() {
 *     useVerifiedToast("landlord")  // ← one line, done
 *     ...
 *   }
 */

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"
import { useNotifications } from "@/contexts/NotificationContext"

export function useVerifiedToast(userType: "landlord" | "tenant" = "landlord") {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { refreshNotifications } = useNotifications()

  useEffect(() => {
    const isVerified   = searchParams.get("verified") === "1"
    const isOAuth      = searchParams.get("oauth") === "1"
    const isCorrection = searchParams.get("correction") === "1"

    // Nothing to handle — bail early
    if (!isVerified && !isOAuth && !isCorrection) return

    // ── 1. Email-verified toast (email signup flow) ───────────────────────────
    if (isVerified) {
      toast.success("🎉 Email Verified!", {
        description:
          userType === "landlord"
            ? "Your email is confirmed. Complete your onboarding to start listing properties."
            : "Your email is confirmed. Complete your profile to start browsing properties.",
        duration: 6000,
      })
    }

    // ── 2. Google OAuth welcome toast (OAuth flow) ────────────────────────────
    // Google already verified the email — don't say "Email Verified", say "Welcome!"
    if (isOAuth) {
      toast.success("👋 Welcome to Nulo!", {
        description:
          userType === "landlord"
            ? "Your Google account is connected. Complete your onboarding to start listing properties."
            : "Your Google account is connected. Complete your profile to start browsing properties.",
        duration: 6000,
      })
    }

    // ── 3. Admin correction toast ─────────────────────────────────────────────
    if (isCorrection) {
      toast.warning("⚠️ Action Required", {
        description: "Please review the admin feedback and update your application.",
        duration: 6000,
      })
    }

    // ── 4. Refresh notification bell so it picks up the new welcome notif ─────
    refreshNotifications()

    // ── 5. Clean ALL handled params from the URL in one replace ──────────────
    const params = new URLSearchParams(searchParams.toString())
    params.delete("verified")
    params.delete("oauth")
    params.delete("correction")
    const cleanUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname
    router.replace(cleanUrl, { scroll: false })

  }, []) // run once on mount
}