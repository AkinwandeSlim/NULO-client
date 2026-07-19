"use client"

/**
 * WelcomeModal
 * ------------
 * Greeting-card style modal that appears once for non-logged-in visitors
 * on the NuloAfrica landing page.
 *
 * Flow:
 *   Step 1 — Intent selection  (Renting / Landlord / Investing)
 *   Step 2 — Email capture      (pre-labelled by their intent)
 *   Step 3 — Success / thank-you
 *
 * Show logic:
 *   - Hidden if the visitor is already authenticated (useAuth)
 *   - Shown once per browser via localStorage key "nulo_modal_dismissed"
 *   - Auto-opens after SHOW_DELAY_MS on first visit
 *   - Always closeable via ✕ button OR "Back to Site" button
 */

import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Home, Building2, TrendingUp, Mail, ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"

/* ── Constants ─────────────────────────────────────────────────────────────── */

const SHOW_DELAY_MS = 2500
const LS_KEY = "nulo_modal_dismissed"
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

/* ── Types ─────────────────────────────────────────────────────────────────── */

type Intent = "renting" | "landlord" | "investing"
type Step = "intent" | "email" | "success"

interface IntentOption {
  key: Intent
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  topic: string          // used in the email-step label
  colour: string         // tailwind ring / border accent
}

/* ── Intent options ────────────────────────────────────────────────────────── */

const INTENT_OPTIONS: IntentOption[] = [
  {
    key: "renting",
    icon: Home,
    title: "I want to Rent",
    description: "Find verified homes across Lagos, Abuja & Port Harcourt",
    topic: "Rental listings & tips",
    colour: "orange",
  },
  {
    key: "landlord",
    icon: Building2,
    title: "I manage Properties",
    description: "List properties, screen tenants & collect rent — all in one place",
    topic: "Property management insights",
    colour: "orange",
  },
  {
    key: "investing",
    icon: TrendingUp,
    title: "I want to Invest",
    description: "Co-own high-yield rentals through NEST and earn monthly",
    topic: "NEST investment updates",
    colour: "orange",
  },
]

/* ── Props ─────────────────────────────────────────────────────────────────── */

interface WelcomeModalProps {
  theme: "dark" | "light"
}

/* ── Component ─────────────────────────────────────────────────────────────── */

export function WelcomeModal({ theme }: WelcomeModalProps) {
  const { user } = useAuth()
  const isAuthenticated = !!user

  const [open, setOpen] = useState(false)
  const [step, setStep] = useState<Step>("intent")
  const [selectedIntent, setSelectedIntent] = useState<Intent | null>(null)
  const [email, setEmail] = useState("")
  const [emailError, setEmailError] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [apiMessage, setApiMessage] = useState("")

  /* Show once for anonymous visitors ─────────────────────────────────────── */
  useEffect(() => {
    if (isAuthenticated) return
    if (typeof window === "undefined") return
    if (localStorage.getItem(LS_KEY)) return

    const timer = setTimeout(() => setOpen(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isAuthenticated])

  /* Close helpers ─────────────────────────────────────────────────────────── */
  const dismiss = useCallback(() => {
    setOpen(false)
    localStorage.setItem(LS_KEY, "1")
  }, [])

  /* Step 1 → 2: intent chosen ─────────────────────────────────────────────── */
  const handleIntentSelect = (intent: Intent) => {
    setSelectedIntent(intent)
    setStep("email")
  }

  /* Step 2 → back: change intent ──────────────────────────────────────────── */
  const handleBack = () => {
    setStep("intent")
    setEmailError("")
  }

  /* Email validation ───────────────────────────────────────────────────────── */
  const validateEmail = (value: string) => {
    if (!value.trim()) return "Please enter your email address."
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim()))
      return "Please enter a valid email address."
    return ""
  }

  /* Step 2 → 3: submit ────────────────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const err = validateEmail(email)
    if (err) { setEmailError(err); return }
    setEmailError("")
    setSubmitting(true)

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/subscribers/landing`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), intent: selectedIntent }),
      })

      const data = await res.json()

      if (!res.ok) {
        // Non-fatal: show server message but stay on step 2
        setEmailError(data.detail || "Something went wrong. Please try again.")
        return
      }

      setApiMessage(data.message || "You're on the list!")
      setStep("success")
      localStorage.setItem(LS_KEY, "1")
    } catch {
      setEmailError("Network error — please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  /* ── Derived ───────────────────────────────────────────────────────────────*/
  const chosenOption = INTENT_OPTIONS.find((o) => o.key === selectedIntent)

  const isDark = theme === "dark"
  const bg = isDark ? "bg-[#0d0d0d]" : "bg-white"
  const border = isDark ? "border-white/10" : "border-slate-200"
  const textPrimary = isDark ? "text-white" : "text-slate-900"
  const textMuted = isDark ? "text-white/60" : "text-slate-500"
  const inputBg = isDark
    ? "bg-black border-white/10 text-white placeholder:text-white/30 focus:border-orange-500"
    : "bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 focus:border-orange-500"
  const cardHover = isDark
    ? "border-white/10 hover:border-orange-500/60 hover:bg-white/5"
    : "border-slate-200 hover:border-orange-400 hover:bg-orange-50/60"
  const cardSelected = isDark
    ? "border-orange-500 bg-orange-500/10 ring-1 ring-orange-500/40"
    : "border-orange-500 bg-orange-50 ring-1 ring-orange-400"

  /* ── Render ────────────────────────────────────────────────────────────────*/
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[200] bg-black/70 backdrop-blur-sm"
            onClick={dismiss}
            aria-hidden="true"
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            role="dialog"
            aria-modal="true"
            aria-label="Welcome to NuloAfrica"
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 16 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`fixed inset-0 z-[201] flex items-center justify-center p-4 sm:p-6 pointer-events-none`}
          >
            <div
              className={`
                pointer-events-auto relative w-full max-w-lg rounded-2xl border
                ${bg} ${border} shadow-2xl shadow-black/50 overflow-hidden
              `}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Orange top accent line */}
              <div className="h-[3px] w-full bg-gradient-to-r from-orange-600 via-orange-400 to-orange-600" />

              {/* ✕ close */}
              <button
                type="button"
                onClick={dismiss}
                aria-label="Close"
                className={`
                  absolute right-4 top-4 flex h-8 w-8 items-center justify-center
                  rounded-full transition-colors
                  ${isDark ? "text-white/40 hover:bg-white/10 hover:text-white" : "text-slate-400 hover:bg-slate-100 hover:text-slate-700"}
                `}
              >
                <X className="h-4 w-4" />
              </button>

              {/* ── STEP 1: Intent selection ──────────────────────────────── */}
              <AnimatePresence mode="wait">
                {step === "intent" && (
                  <motion.div
                    key="step-intent"
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 12 }}
                    transition={{ duration: 0.22 }}
                    className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8"
                  >
                    {/* Logo mark */}
                    <div className="mb-5 flex justify-center">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/15 ring-2 ring-orange-500/30">
                        <span className="text-lg font-black text-orange-500">N</span>
                      </div>
                    </div>

                    <h2 className={`mb-2 text-center text-[22px] font-bold leading-tight ${textPrimary}`}>
                      Welcome to NuloAfrica
                    </h2>
                    <p className={`mb-7 text-center text-sm leading-relaxed ${textMuted}`}>
                      Tell us what brings you here so we can send you the most
                      relevant news, listings, and updates.
                    </p>

                    <p className={`mb-3 text-center text-[11px] font-semibold uppercase tracking-[0.14em] text-orange-400`}>
                      What are you interested in?
                    </p>

                    <div className="flex flex-col gap-3">
                      {INTENT_OPTIONS.map((opt) => (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => handleIntentSelect(opt.key)}
                          className={`
                            flex w-full items-center gap-4 rounded-xl border p-4
                            text-left transition-all duration-200
                            ${cardHover}
                            focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500
                          `}
                        >
                          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/10">
                            <opt.icon className="h-5 w-5 text-orange-400" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-sm font-semibold ${textPrimary}`}>{opt.title}</div>
                            <div className={`mt-0.5 text-xs leading-relaxed ${textMuted}`}>{opt.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>

                    {/* Back to site */}
                    <button
                      type="button"
                      onClick={dismiss}
                      className={`mt-6 w-full rounded-xl border py-3 text-sm font-medium transition-colors
                        ${isDark
                          ? "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                          : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                        }`}
                    >
                      Back to Site
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 2: Email capture ─────────────────────────────── */}
                {step === "email" && chosenOption && (
                  <motion.div
                    key="step-email"
                    initial={{ opacity: 0, x: 12 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -12 }}
                    transition={{ duration: 0.22 }}
                    className="px-6 pb-6 pt-8 sm:px-8 sm:pb-8"
                  >
                    {/* Back arrow */}
                    <button
                      type="button"
                      onClick={handleBack}
                      aria-label="Go back"
                      className={`mb-5 flex items-center gap-1.5 text-xs font-medium transition-colors
                        ${isDark ? "text-white/40 hover:text-white/70" : "text-slate-400 hover:text-slate-600"}`}
                    >
                      <ArrowLeft className="h-3.5 w-3.5" />
                      Change selection
                    </button>

                    {/* Selected intent badge */}
                    <div className="mb-5 flex items-center justify-center">
                      <div className={`
                        flex items-center gap-2.5 rounded-full border px-4 py-2
                        ${cardSelected}
                      `}>
                        <chosenOption.icon className="h-4 w-4 text-orange-500" />
                        <span className={`text-sm font-semibold ${textPrimary}`}>{chosenOption.title}</span>
                      </div>
                    </div>

                    <h2 className={`mb-2 text-center text-[20px] font-bold leading-tight ${textPrimary}`}>
                      Stay in the Loop
                    </h2>
                    <p className={`mb-7 text-center text-sm leading-relaxed ${textMuted}`}>
                      Get <span className="font-medium text-orange-400">{chosenOption.topic}</span> delivered
                      straight to your inbox. No spam, unsubscribe anytime.
                    </p>

                    <form onSubmit={handleSubmit} noValidate>
                      <label
                        htmlFor="subscriber-email"
                        className={`mb-1.5 block text-[12px] font-medium ${textMuted}`}
                      >
                        Email address
                      </label>
                      <div className="relative mb-1.5">
                        <Mail className={`absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 ${isDark ? "text-white/30" : "text-slate-400"}`} />
                        <input
                          id="subscriber-email"
                          type="email"
                          autoComplete="email"
                          placeholder="you@email.com"
                          value={email}
                          onChange={(e) => {
                            setEmail(e.target.value)
                            if (emailError) setEmailError("")
                          }}
                          className={`
                            w-full rounded-xl border pl-10 pr-4 py-3 text-sm
                            transition-colors duration-200 focus:outline-none
                            ${inputBg}
                            ${emailError ? "border-red-500 focus:border-red-500" : ""}
                          `}
                        />
                      </div>
                      {emailError && (
                        <p className="mb-3 text-xs text-red-400">{emailError}</p>
                      )}

                      <button
                        type="submit"
                        disabled={submitting}
                        className={`
                          mt-4 flex w-full items-center justify-center gap-2
                          rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-black
                          transition-all duration-200
                          hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/20
                          disabled:cursor-not-allowed disabled:opacity-60
                        `}
                      >
                        {submitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Subscribing…
                          </>
                        ) : (
                          "Subscribe — it's free"
                        )}
                      </button>
                    </form>

                    {/* Back to site */}
                    <button
                      type="button"
                      onClick={dismiss}
                      className={`mt-4 w-full rounded-xl border py-3 text-sm font-medium transition-colors
                        ${isDark
                          ? "border-white/10 text-white/50 hover:border-white/20 hover:text-white/80"
                          : "border-slate-200 text-slate-400 hover:border-slate-300 hover:text-slate-600"
                        }`}
                    >
                      Back to Site
                    </button>
                  </motion.div>
                )}

                {/* ── STEP 3: Success ───────────────────────────────────── */}
                {step === "success" && (
                  <motion.div
                    key="step-success"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center px-6 pb-8 pt-10 text-center sm:px-8"
                  >
                    {/* Animated check */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
                      className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-orange-500/15 ring-4 ring-orange-500/20"
                    >
                      <CheckCircle className="h-8 w-8 text-orange-500" />
                    </motion.div>

                    <h2 className={`mb-2 text-[22px] font-bold ${textPrimary}`}>You&apos;re on the list!</h2>
                    <p className={`mb-2 text-sm leading-relaxed ${textMuted}`}>
                      {apiMessage || "We'll send you relevant updates straight to your inbox."}
                    </p>
                    {chosenOption && (
                      <p className={`mb-8 text-xs ${textMuted}`}>
                        Subscribed for:{" "}
                        <span className="font-medium text-orange-400">{chosenOption.topic}</span>
                      </p>
                    )}

                    <button
                      type="button"
                      onClick={dismiss}
                      className={`
                        w-full rounded-xl bg-orange-500 py-3.5 text-sm font-semibold text-black
                        transition-all duration-200
                        hover:bg-orange-400 hover:shadow-lg hover:shadow-orange-500/20
                      `}
                    >
                      Back to Site
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
