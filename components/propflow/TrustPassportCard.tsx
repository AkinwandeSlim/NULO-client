"use client"

/**
 * TrustPassportCard
 * Guided "Complete your application" checklist shown after a tenant picks a
 * property (rendered inside the Trust Passport modal).
 *
 * UX v2.0 — "Conversation can float. Commitment should take focus":
 *  - Three top-level trust checks (Identity, Income evidence, Reference) as
 *    accordion cards with clear states (Not started / Complete / Needs
 *    attention / Reused from your profile).
 *  - Employment, income, tenancy and optional extras live in one expandable
 *    "Application details" section (kept because the existing backend
 *    validators require them) — they are no longer treated as separate
 *    intimidating steps.
 *  - Consent is a single, non-preselected checkbox directly above the submit
 *    button, with a privacy reassurance.
 *  - Sticky footer: "Save and finish later" (secondary) + "Submit application"
 *    (primary), disabled until the real validation passes, with a plain-English
 *    "what's left" message.
 *
 * Backend/validation contract is UNCHANGED: every field the v1.1 card collected
 * (phone, employment, income, tenancy, optional extras, consent) is collected
 * here and submitted through the same CompleteApplicationPayload. Nothing is
 * ever invented — missing details are simply omitted, not guessed.
 */

import { useEffect, useMemo, useRef, useState } from "react"
import {
  AlertCircle, Briefcase, Building2, CalendarDays, Camera, CheckCircle2,
  ChevronDown, Eye, FileText, IdCard, ImagePlus, Loader2, MapPin,
  Pencil, Phone, ShieldCheck, UserCheck, Wallet, X,
} from "lucide-react"
import { useAuth } from "@/contexts/AuthContext"
import { applicationsAPI } from "@/lib/api/applications"
import type { CompleteApplicationPayload } from "@/lib/api/propflow"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

type SavedDoc = { path: string; filename: string; sourceAppId?: string }
type DocValue = File | SavedDoc | null

interface TrustPassportCardProps {
  property: {
    id: string
    title: string
    location?: string
    price?: number
    beds?: number
    property_type?: string
    images?: string[]
  }
  onSubmit: (payload: CompleteApplicationPayload) => Promise<void>
  isLoading?: boolean
  /** Secondary footer action — closes the modal, keeps the draft mounted. */
  onSaveLater?: () => void
}

const REFERENCE_RELATIONSHIPS = [
  "Previous landlord",
  "Employer",
  "Guarantor",
  "Community or professional reference",
]

const EMPLOYMENT_STATUSES = [
  { value: "employed", label: "Employed" },
  { value: "self-employed", label: "Self-employed" },
  { value: "student", label: "Student" },
  { value: "retired", label: "Retired" },
  { value: "unemployed", label: "Unemployed" },
]

const inputCls =
  "w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-orange-400 focus:ring-2 focus:ring-orange-100"

function isSavedDoc(v: DocValue): v is SavedDoc {
  return !!v && typeof v === "object" && "path" in v
}

/** Display name for either a newly-picked File or a reused SavedDoc. */
function fileName(v: DocValue): string {
  return isSavedDoc(v) ? v.filename : v ? (v as File).name : ""
}

// ── Accordion check row ─────────────────────────────────────────────────────

type CheckState = "not_started" | "complete" | "attention" | "reused"

const STATE_META: Record<CheckState, { label: string; cls: string }> = {
  not_started: { label: "Not started", cls: "bg-slate-100 text-slate-500" },
  complete: { label: "Complete", cls: "bg-emerald-50 text-emerald-700" },
  attention: { label: "Needs attention", cls: "bg-amber-50 text-amber-700" },
  reused: { label: "Reused from your profile", cls: "bg-blue-50 text-blue-700" },
}

function CheckAccordion({ id, label, hint, icon: Icon, state, open, onToggle, children }: {
  id: string
  label: string
  hint?: string
  icon: typeof ShieldCheck
  state: CheckState
  open: boolean
  onToggle: (id: string) => void
  children: React.ReactNode
}) {
  const meta = STATE_META[state]
  const ready = state === "complete" || state === "reused"
  return (
    <div className={cn(
      "rounded-2xl border bg-white transition-shadow",
      open ? "border-slate-200 shadow-sm ring-1 ring-slate-100" : "border-slate-200",
    )}>
      <button
        type="button"
        onClick={() => onToggle(id)}
        aria-expanded={open}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left rounded-2xl hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
      >
        <span className={cn(
          "flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center",
          ready ? "bg-emerald-100 text-emerald-600" : "bg-slate-100 text-slate-500",
        )}>
          {ready
            ? <CheckCircle2 className="h-5 w-5" />
            : <Icon className="h-5 w-5" />}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-semibold text-slate-800">{label}</span>
          {hint && <span className="block text-[11px] text-slate-400 mt-0.5">{hint}</span>}
        </span>
        <span className={cn(
          "flex-shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
          meta.cls,
        )}>
          {state === "attention" && <AlertCircle className="h-3 w-3 mr-1" />}
          {meta.label}
        </span>
        <ChevronDown className={cn("h-4 w-4 text-slate-400 transition-transform flex-shrink-0", open && "rotate-180")} />
      </button>
      {open && <div className="px-4 pb-4 pt-0.5">{children}</div>}
    </div>
  )
}

// ── Document slot ───────────────────────────────────────────────────────────

function DocSlot({ label, value, error, hint, viewing, onFile, onView, onReplace }: {
  label: string
  value: DocValue
  error?: string
  hint: string
  viewing?: boolean
  onFile: (e: React.ChangeEvent<HTMLInputElement>) => void
  onView: (v: DocValue) => void
  onReplace: () => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const isSaved = isSavedDoc(value)

  return (
    <div className="space-y-1.5">
      <p className="text-[11px] text-slate-500 leading-relaxed">{hint}</p>

      {value ? (
        <div className={cn(
          "flex items-center gap-2.5 rounded-xl border px-3 py-2",
          isSaved ? "border-blue-100 bg-blue-50/60" : "border-slate-200 bg-slate-50/60",
        )}>
          <FileText className={cn("h-4 w-4 flex-shrink-0", isSaved ? "text-blue-600" : "text-slate-500")} />
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium text-slate-700 truncate">{fileName(value)}</p>
            <p className="text-[10px] truncate">
              {isSaved
                ? <span className="text-blue-600">Saved to your profile</span>
                : <span className="text-slate-400">{(value as File).size / 1024 < 1
                    ? Math.max(1, Math.round((value as File).size / 1024)) + " KB"
                    : ((value as File).size / 1024).toFixed(1) + " KB"} · ready to upload</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={onReplace}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors"
            aria-label={`Replace ${label}`}
            title="Replace"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => onView(value)}
            disabled={viewing}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-white dark:hover:text-slate-200 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            aria-label={`View ${label}`}
            title="View"
          >
            {viewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          </button>
        </div>
      ) : (
        <label className="group flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-300 bg-slate-50/70 dark:border-slate-600 dark:bg-slate-800/50 px-3 py-6 text-center cursor-pointer transition-colors hover:border-orange-400 hover:bg-orange-50/40 dark:hover:border-orange-500 dark:hover:bg-orange-950/30">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-orange-100 text-orange-600 transition-transform group-hover:scale-105">
            <ImagePlus className="h-5 w-5" />
          </span>
          <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 dark:text-slate-300 dark:group-hover:text-slate-100">Take photo or choose file</span>
          <span className="text-[11px] text-slate-400 inline-flex items-center gap-1">
            <Camera className="h-3 w-3" /> PNG, JPG or PDF
          </span>
          <input
            type="file"
            accept="image/*,.pdf"
            className="sr-only"
            onChange={(e) => { onFile(e); e.target.value = "" }}
          />
        </label>
      )}

      {/* Hidden input so "Replace" can open the picker for existing files */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf"
        className="hidden"
        onChange={(e) => { onFile(e); e.target.value = "" }}
      />
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  )
}

// ── Main component ─────────────────────────────────────────────────────────

export default function TrustPassportCard({ property, onSubmit, isLoading, onSaveLater }: TrustPassportCardProps) {
  const { user } = useAuth()

  const [identity, setIdentity] = useState<DocValue>(null)
  const [income, setIncome] = useState<DocValue>(null)
  const [refName, setRefName] = useState("")
  const [refPhone, setRefPhone] = useState("")
  const [refRelationship, setRefRelationship] = useState(REFERENCE_RELATIONSHIPS[0])
  const [consent, setConsent] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isPrefilling, setIsPrefilling] = useState(true)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [viewingDoc, setViewingDoc] = useState<string | null>(null)
  const [openSection, setOpenSection] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)  // Local submitting state for immediate feedback
  const autoOpened = useRef(false)

  // ── Contact (phone) ────────────────────────────────────────────────────────
  // Google OAuth tenants sign up with name + email only, so the card collects a
  // phone number. Pre-filled from the profile when one already exists.
  const [phoneNumber, setPhoneNumber] = useState(
    ((user as any)?.phone_number as string) || "",
  )
  const phoneValid = phoneNumber.trim().replace(/\D/g, "").length >= 7

  // ── Employment & Income (chosen, never guessed) ───────────────────────────
  const [employmentStatus, setEmploymentStatus] = useState("")
  const [employerName, setEmployerName] = useState("")
  const [jobTitle, setJobTitle] = useState("")
  const [monthlyIncome, setMonthlyIncome] = useState("")

  // ── Tenancy details ────────────────────────────────────────────────────────
  const [moveInDate, setMoveInDate] = useState("")
  const [leaseDuration, setLeaseDuration] = useState("12")
  const [numberOfOccupants, setNumberOfOccupants] = useState("1")
  const [hasPets, setHasPets] = useState(false)
  const [petDetails, setPetDetails] = useState("")

  // ── Optional extras ────────────────────────────────────────────────────────
  const [emergencyContactName, setEmergencyContactName] = useState("")
  const [emergencyContactPhone, setEmergencyContactPhone] = useState("")
  const [message, setMessage] = useState("")

  const incomeRequired = employmentStatus === "employed" || employmentStatus === "self-employed"

  // ── Reuse pre-fill: newest application for a different property ────────────
  useEffect(() => {
    let cancelled = false
    const prefill = async () => {
      if (!user) { setIsPrefilling(false); return }
      if ((user as any)?.phone_number) setPhoneNumber((user as any).phone_number)
      try {
        const res = await applicationsAPI.getMyApplications()
        if (cancelled) return
        if (!res.success || !res.applications?.length) return

        const prev = res.applications.find(a => a.property_id !== property.id)
        if (!prev) return

        const docs = (prev.documents || []) as Array<string | { path?: string }>
        const docPath = (i: number) => {
          const d = docs[i]
          if (!d) return null
          const p = typeof d === "string" ? d : d?.path
          return p ? { path: p, filename: p.split("/").pop() || "document", sourceAppId: prev.id } as SavedDoc : null
        }

        const next: Record<string, DocValue> = {}
        if (docPath(0)) next.identity = docPath(0)
        if (docPath(1)) next.income = docPath(1)

        if (next.identity) setIdentity(next.identity)
        if (next.income) setIncome(next.income)

        const r1 = (prev.references as any)?.reference1
        if (r1) {
          if (r1.name) setRefName(r1.name)
          if (r1.phone) setRefPhone(r1.phone)
          if (r1.relationship) setRefRelationship(r1.relationship)
        }

        if (prev.employment_status) setEmploymentStatus(prev.employment_status)
        if (prev.employer_name) setEmployerName(prev.employer_name)
        if ((prev as any).job_title) setJobTitle((prev as any).job_title)
        if (prev.monthly_income) setMonthlyIncome(String(prev.monthly_income))

        if (prev.move_in_date) setMoveInDate(prev.move_in_date)
        if (prev.lease_duration) setLeaseDuration(prev.lease_duration)
        if (prev.number_of_occupants) setNumberOfOccupants(String(prev.number_of_occupants))
        if (prev.has_pets) {
          setHasPets(true)
          if (prev.pet_details) setPetDetails(prev.pet_details)
        }

        if (prev.emergency_contact_name) setEmergencyContactName(prev.emergency_contact_name)
        if (prev.emergency_contact_phone) setEmergencyContactPhone(prev.emergency_contact_phone)
      } catch {
        /* reuse is best-effort; a fresh card is fine */
      } finally {
        if (!cancelled) setIsPrefilling(false)
      }
    }
    prefill()
    return () => { cancelled = true }
  }, [user, property.id])

  // ── Trust checks (3 top-level) + application details ─────────────────────
  const trustChecks = useMemo(() => [
    { key: "identity", label: "Identity", icon: IdCard,
      done: !!identity, reused: isSavedDoc(identity),
      hint: "NIN slip · National ID · passport · driver's licence",
      error: errors.identity },
    { key: "income", label: "Income evidence", icon: Wallet,
      done: !!income, reused: isSavedDoc(income),
      hint: "Payslip · bank statement · employment letter · business evidence",
      error: errors.income },
    { key: "reference", label: "Reference", icon: UserCheck,
      done: !!refName.trim() && !!refPhone.trim(), reused: false,
      hint: "Who can confirm you are a reliable tenant?",
      error: errors.refName || errors.refPhone },
  ], [identity, income, refName, refPhone, errors])

  const completedTrust = trustChecks.filter(c => c.done).length
  const showIdleProgress = isPrefilling

  const empOk = !!employmentStatus && (!incomeRequired || !!monthlyIncome.trim())
  const detailsComplete = [phoneValid, empOk, !!moveInDate].filter(Boolean).length

  // Auto-open the first incomplete trust check once pre-fill settles (unless the
  // tenant already navigated — never fight the user's manual accordion choice).
  useEffect(() => {
    if (isPrefilling || autoOpened.current) return
    autoOpened.current = true
    const first = ["identity", "income", "reference"].find(k => !trustChecks.find(c => c.key === k)?.done)
    setOpenSection(first ?? "details")
  }, [isPrefilling, trustChecks])

  const checkState = (c: (typeof trustChecks)[number]): CheckState => {
    if (c.reused) return "reused"
    if (c.done) return "complete"
    if (c.error) return "attention"
    return "not_started"
  }

  const clearError = (k: string) => setErrors(prev => ({ ...prev, [k]: "" }))

  const handleDocChange = (field: "identity" | "income", value: DocValue) => {
    if (field === "identity") setIdentity(value)
    else setIncome(value)
    clearError(field)
    setSubmitError(null)
  }

  const handleFileSelect = (field: "identity" | "income", e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleDocChange(field, f)
  }

  const replaceDoc = (field: "identity" | "income") => {
    // Clear so the big upload target reappears → tenant picks a fresh file.
    handleDocChange(field, null)
  }

  const viewDoc = async (v: DocValue) => {
    if (!v) return
    if (isSavedDoc(v)) {
      if (!v.sourceAppId) return
      setViewingDoc(v.filename)
      try {
        const { url } = await applicationsAPI.getDocumentSignedUrl(v.sourceAppId, v.path)
        window.open(url, "_blank", "noopener,noreferrer")
      } catch { /* ignore view failure */ }
      finally { setViewingDoc(null) }
    } else {
      window.open(URL.createObjectURL(v), "_blank", "noopener,noreferrer")
    }
  }

  const handleSubmit = async () => {
    setSubmitError(null)
    const errs: Record<string, string> = {}
    const phoneDigits = phoneNumber.trim().replace(/\D/g, "")
    if (!phoneNumber.trim()) errs.phoneNumber = "Phone number is required"
    else if (phoneDigits.length < 7 || phoneDigits.length > 15) errs.phoneNumber = "Enter a valid phone number"
    if (!identity) errs.identity = "Identity document is required"
    if (!income) errs.income = "Income evidence is required"
    if (!refName.trim()) errs.refName = "Reference name is required"
    if (!refPhone.trim()) errs.refPhone = "Reference phone is required"
    if (!employmentStatus) errs.employmentStatus = "Employment status is required"
    if (incomeRequired && !employerName.trim()) {
      errs.employerName = employmentStatus === "self-employed" ? "Business name is required" : "Employer name is required"
    }
    if (incomeRequired && !monthlyIncome.trim()) errs.monthlyIncome = "Monthly income is required"
    if (!moveInDate) errs.moveInDate = "Preferred move-in date is required"
    if (!consent) errs.consent = "You must consent to share your details with the landlord"
    setErrors(errs)
    if (Object.keys(errs).length) return

    // ✨ Set local submitting state immediately for visual feedback
    setIsSubmitting(true)

    const upload = async (v: DocValue): Promise<string | null> => {
      if (isSavedDoc(v)) return v.path
      if (v) return (await applicationsAPI.uploadDocument(v)).path
      return null
    }

    try {
      const documents = (await Promise.all([upload(identity), upload(income)]))
        .filter((p): p is string => !!p)

      const references: CompleteApplicationPayload["references"] = {
        reference1: { name: refName.trim(), phone: refPhone.trim(), relationship: refRelationship },
      }

      await onSubmit({
        documents,
        references,
        consent,
        phone_number: phoneNumber.trim() || undefined,
        employment_status: employmentStatus || undefined,
        employer_name: employerName.trim() || undefined,
        job_title: jobTitle.trim() || undefined,
        monthly_income: monthlyIncome ? parseInt(monthlyIncome, 10) : undefined,
        move_in_date: moveInDate || undefined,
        lease_duration: leaseDuration || undefined,
        number_of_occupants: numberOfOccupants ? parseInt(numberOfOccupants, 10) : undefined,
        has_pets: hasPets || undefined,
        pet_details: hasPets ? petDetails.trim() : undefined,
        emergency_contact_name: emergencyContactName.trim() || undefined,
        emergency_contact_phone: emergencyContactPhone.trim() || undefined,
        message: message.trim() || undefined,
      })
    } catch (e: any) {
      setSubmitError(e?.message || "We couldn't submit your application. Please try again.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const readyToSubmit =
    consent &&
    phoneValid &&
    !!identity && !!income &&
    !!refName.trim() && !!refPhone.trim() &&
    !!employmentStatus &&
    (!incomeRequired || !!monthlyIncome.trim()) &&
    !!moveInDate

  const isSubmittingNow = isLoading || isSubmitting  // Combined loading state

  const missing: string[] = []
  if (!identity) missing.push("an identity document")
  if (!income) missing.push("income evidence")
  if (!refName.trim() || !refPhone.trim()) missing.push("a reference")
  if (!phoneValid) missing.push("your phone number")
  if (!employmentStatus) missing.push("your employment status")
  if (incomeRequired && !monthlyIncome.trim()) missing.push("your monthly income")
  if (!moveInDate) missing.push("a move-in date")
  if (!consent) missing.push("confirm consent")
  const remainingText = missing.length === 0
    ? "Everything looks good — you're ready to submit."
    : "Add " + missing.slice(0, -1).join(", ") + (missing.length > 1 ? " and " : "") + missing[missing.length - 1] + " to continue."

  const propertyType = property.property_type
    ? property.property_type.charAt(0).toUpperCase() + property.property_type.slice(1)
    : null
  const propertyMeta = [
    property.beds ? `${property.beds} bed${property.beds > 1 ? "s" : ""}` : null,
    propertyType,
  ].filter(Boolean).join(" · ")

  const identityViewing = isSavedDoc(identity) ? viewingDoc === identity.filename : false
  const incomeViewing = isSavedDoc(income) ? viewingDoc === income.filename : false

  return (
    <div className="flex h-full max-h-[100dvh] flex-col bg-white sm:max-h-[calc(100dvh-4rem)]">
      {/* ── Header (sticky on mobile, fixed row on desktop) ─────────────────── */}
      <div className="shrink-0 border-b border-slate-100 bg-white px-5 pt-5 pb-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 h-10 w-10 rounded-2xl bg-orange-100 flex items-center justify-center">
            <ShieldCheck className="h-5 w-5 text-orange-600" />
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-base font-semibold text-slate-900 leading-tight">
              Complete your application
            </h2>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Share a few details once so landlords can review your application with confidence.
            </p>
          </div>
          <button
            type="button"
            onClick={onSaveLater}
            className="flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:text-slate-300 dark:hover:bg-slate-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-300"
            aria-label="Close and finish later"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Property summary row */}
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-slate-50/80 border border-slate-100 p-2.5">
          {property.images?.[0] ? (
            <img src={property.images[0]} alt={property.title} className="h-12 w-12 rounded-lg object-cover flex-shrink-0" />
          ) : (
            <div className="h-12 w-12 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0">
              <Building2 className="h-5 w-5 text-slate-400" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-800 truncate">{property.title}</p>
            <div className="flex items-center gap-1 text-[11px] text-slate-500 mt-0.5">
              <MapPin className="h-3 w-3 flex-shrink-0" />
              <span className="truncate">{property.location || "Location provided by landlord"}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 truncate">
              {propertyMeta && <>{propertyMeta} · </>}
              <span className="text-orange-600 font-semibold">
                NGN {(property.price ?? 0).toLocaleString()}/mo
              </span>
            </p>
          </div>
        </div>

        {/* Progress — the 3 top-level trust checks */}
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-700">
            {completedTrust} of 3 trust checks complete
          </span>
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
            {showIdleProgress && <Loader2 className="h-3 w-3 animate-spin" />}
            {showIdleProgress ? "Checking your profile…" : ""}
          </span>
        </div>
        <div className="mt-1.5 h-1.5 rounded-full bg-slate-100 overflow-hidden">
          <div
            className="h-full rounded-full bg-orange-500 transition-all duration-500"
            style={{ width: `${(completedTrust / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* ── Scrollable body (single scroll container — no nesting) ──────────── */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-3 bg-slate-50/50">
        {/* What we already have — real facts only */}
        {!isPrefilling && (
          <p className="text-[11px] text-slate-500">
            We already have:{" "}
            <span className="text-slate-700 font-medium">
              {user?.full_name || "your name"}{user?.email ? `, ${user.email}` : ""}
            </span>
          </p>
        )}

        {/* 1 · Identity */}
        <CheckAccordion
          id="identity"
          label="Identity"
          hint="Confirm who you are"
          icon={IdCard}
          state={checkState(trustChecks[0])}
          open={openSection === "identity"}
          onToggle={(id) => setOpenSection(prev => prev === id ? null : id)}
        >
          <DocSlot
            label="Identity document"
            value={identity}
            error={errors.identity}
            hint="NIN slip · National ID · passport · driver's licence"
            viewing={identityViewing}
            onFile={(e) => handleFileSelect("identity", e)}
            onView={viewDoc}
            onReplace={() => replaceDoc("identity")}
          />
        </CheckAccordion>

        {/* 2 · Income */}
        <CheckAccordion
          id="income"
          label="Income evidence"
          hint="Show you can meet the rent"
          icon={Wallet}
          state={checkState(trustChecks[1])}
          open={openSection === "income"}
          onToggle={(id) => setOpenSection(prev => prev === id ? null : id)}
        >
          <DocSlot
            label="Income evidence"
            value={income}
            error={errors.income}
            hint="Payslip · bank statement · employment letter · business evidence"
            viewing={incomeViewing}
            onFile={(e) => handleFileSelect("income", e)}
            onView={viewDoc}
            onReplace={() => replaceDoc("income")}
          />
        </CheckAccordion>

        {/* 3 · Reference */}
        <CheckAccordion
          id="reference"
          label="Reference"
          hint="Who can confirm you are a reliable tenant?"
          icon={UserCheck}
          state={checkState(trustChecks[2])}
          open={openSection === "reference"}
          onToggle={(id) => setOpenSection(prev => prev === id ? null : id)}
        >
          <div className="space-y-2">
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1" htmlFor="tp-ref-name">Full name</label>
              <input
                id="tp-ref-name"
                value={refName}
                onChange={(e) => { setRefName(e.target.value); clearError("refName"); setSubmitError(null) }}
                placeholder="e.g. Chinedu Okafor"
                className={inputCls}
                autoComplete="name"
              />
              {errors.refName && <p className="text-xs text-red-600 font-medium mt-1">{errors.refName}</p>}
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1" htmlFor="tp-ref-phone">Nigerian phone number</label>
              <input
                id="tp-ref-phone"
                value={refPhone}
                onChange={(e) => { setRefPhone(e.target.value); clearError("refPhone"); setSubmitError(null) }}
                placeholder="e.g. 0812 345 6789"
                inputMode="tel"
                autoComplete="tel"
                className={inputCls}
              />
              {errors.refPhone && <p className="text-xs text-red-600 font-medium mt-1">{errors.refPhone}</p>}
            </div>
            <div>
              <label className="text-[11px] font-medium text-slate-600 block mb-1" htmlFor="tp-ref-rel">Relationship to you</label>
              <select
                id="tp-ref-rel"
                value={refRelationship}
                onChange={(e) => setRefRelationship(e.target.value)}
                className={inputCls}
              >
                {REFERENCE_RELATIONSHIPS.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </CheckAccordion>

        {/* Application details (required by existing validators) */}
        <CheckAccordion
          id="details"
          label="Application details"
          hint={`Contact, employment & move-in — ${detailsComplete} of 3 complete`}
          icon={Briefcase}
          state={detailsComplete === 3 ? "complete" : errors.phoneNumber || errors.employmentStatus || errors.employerName || errors.monthlyIncome || errors.moveInDate ? "attention" : "not_started"}
          open={openSection === "details"}
          onToggle={(id) => setOpenSection(prev => prev === id ? null : id)}
        >
          <div className="space-y-3.5">
            {/* Contact — phone */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Contact</p>
                <span className="text-red-500">*</span>
              </div>
              <input
                value={phoneNumber}
                onChange={(e) => { setPhoneNumber(e.target.value); clearError("phoneNumber"); setSubmitError(null) }}
                placeholder="Phone number (e.g. 0812 345 6789)"
                inputMode="tel"
                autoComplete="tel"
                className={inputCls}
              />
              {errors.phoneNumber && <p className="text-xs text-red-600 font-medium">{errors.phoneNumber}</p>}
            </div>

            {/* Employment & income */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Employment & income</p>
                <span className="text-red-500">*</span>
              </div>
              <select
                value={employmentStatus}
                onChange={(e) => {
                  setEmploymentStatus(e.target.value)
                  clearError("employmentStatus"); clearError("employerName"); clearError("monthlyIncome")
                  setSubmitError(null)
                }}
                className={inputCls}
                aria-label="Employment status"
              >
                <option value="">Select employment status</option>
                {EMPLOYMENT_STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {errors.employmentStatus && <p className="text-xs text-red-600 font-medium">{errors.employmentStatus}</p>}

              {incomeRequired && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={employerName}
                    onChange={(e) => { setEmployerName(e.target.value); clearError("employerName") }}
                    placeholder={employmentStatus === "self-employed" ? "Business name" : "Employer name"}
                    className={inputCls}
                  />
                  <input
                    value={monthlyIncome}
                    onChange={(e) => { setMonthlyIncome(e.target.value); clearError("monthlyIncome") }}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="Monthly income (₦)"
                    className={inputCls}
                  />
                </div>
              )}
              {errors.employerName && <p className="text-xs text-red-600 font-medium">{errors.employerName}</p>}
              {errors.monthlyIncome && <p className="text-xs text-red-600 font-medium">{errors.monthlyIncome}</p>}

              {employmentStatus === "student" && (
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  <input
                    value={employerName}
                    onChange={(e) => setEmployerName(e.target.value)}
                    placeholder="School / institution (optional)"
                    className={inputCls}
                  />
                  <input
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="Course of study (optional)"
                    className={inputCls}
                  />
                </div>
              )}

              {(employmentStatus === "unemployed" || employmentStatus === "retired") && (
                <p className="text-[11px] text-slate-500">Your income evidence document covers this.</p>
              )}
            </div>

            {/* Tenancy details */}
            <div className="space-y-1.5">
              <div className="flex items-center gap-1.5">
                <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                <p className="text-xs font-semibold text-slate-700">Move-in & tenancy</p>
                <span className="text-red-500">*</span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1" htmlFor="tp-move-in">Preferred move-in</label>
                  <input
                    id="tp-move-in"
                    type="date"
                    value={moveInDate}
                    onChange={(e) => { setMoveInDate(e.target.value); clearError("moveInDate") }}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1" htmlFor="tp-lease">Lease duration</label>
                  <select
                    id="tp-lease"
                    value={leaseDuration}
                    onChange={(e) => setLeaseDuration(e.target.value)}
                    className={inputCls}
                  >
                    <option value="6">6 months</option>
                    <option value="12">12 months</option>
                    <option value="24">24 months</option>
                  </select>
                </div>
              </div>
              {errors.moveInDate && <p className="text-xs text-red-600 font-medium">{errors.moveInDate}</p>}
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-[11px] font-medium text-slate-600 block mb-1" htmlFor="tp-occupants">Occupants</label>
                  <input
                    id="tp-occupants"
                    type="number"
                    min={1}
                    value={numberOfOccupants}
                    onChange={(e) => setNumberOfOccupants(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 mt-4 cursor-pointer" htmlFor="tp-pets">
                  <input
                    id="tp-pets"
                    type="checkbox"
                    checked={hasPets}
                    onChange={(e) => setHasPets(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                  />
                  I have pets
                </label>
              </div>
              {hasPets && (
                <input
                  value={petDetails}
                  onChange={(e) => setPetDetails(e.target.value)}
                  placeholder="Pet details (e.g. 1 dog)"
                  className={inputCls}
                />
              )}
            </div>

            {/* Optional extras */}
            <div className="space-y-2 border-t border-slate-100 pt-3">
              <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide">Optional</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <input
                  value={emergencyContactName}
                  onChange={(e) => setEmergencyContactName(e.target.value)}
                  placeholder="Emergency contact name"
                  autoComplete="off"
                  className={inputCls}
                />
                <input
                  value={emergencyContactPhone}
                  onChange={(e) => setEmergencyContactPhone(e.target.value)}
                  placeholder="Emergency contact phone"
                  inputMode="tel"
                  className={inputCls}
                />
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Anything else the landlord should know?"
                rows={2}
                className={`${inputCls} resize-none`}
              />
            </div>
          </div>
        </CheckAccordion>
      </div>

      {/* ── Footer (sticky) ─────────────────────────────────────────────────── */}
      <div className="shrink-0 border-t border-slate-200 bg-white px-5 py-4">
        {submitError && (
          <div className="mb-3 rounded-xl bg-red-50 border border-red-100 px-3 py-2.5 flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
            <p className="text-xs text-red-700">{submitError}</p>
          </div>
        )}

        {/* Consent — directly above the submit action, never pre-checked */}
        <label className="flex items-start gap-2.5 rounded-xl p-2.5 -mx-2.5 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50" htmlFor="tp-consent">
          <input
            id="tp-consent"
            type="checkbox"
            checked={consent}
            onChange={(e) => { setConsent(e.target.checked); clearError("consent") }}
            className="mt-0.5 h-4 w-4 rounded border-slate-300 text-orange-500 focus:ring-orange-400"
          />
          <span className="text-xs text-slate-700 leading-relaxed">
            {"I agree that "}<span className="font-semibold">PropFlow</span>{" "}
            {"may share these application details with this property's landlord."}
          </span>
        </label>
        {errors.consent && <p className="text-xs text-red-600 font-medium px-1">{errors.consent}</p>}
        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Your documents are shared only for this application.
        </p>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onSaveLater}
            disabled={isSubmittingNow}
            className="h-11 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-slate-100"
          >
            Save and finish later
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={!readyToSubmit || isSubmittingNow}
            className="h-11 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold shadow-sm disabled:opacity-50"
          >
            {isSubmittingNow ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Submitting…
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Submit application
              </>
            )}
          </Button>
        </div>

        {!isSubmittingNow && (
          <p className={cn(
            "text-center text-[11px] mt-2.5",
            readyToSubmit ? "text-emerald-600" : "text-slate-400",
          )}>
            {remainingText}
          </p>
        )}
      </div>
    </div>
  )
}