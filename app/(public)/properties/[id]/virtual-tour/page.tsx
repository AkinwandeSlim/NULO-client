"use client"

import Link from "next/link"
import { useParams, useSearchParams } from "next/navigation"
import { Calendar, ChevronRight, FileText, Home, MessageCircle, MapPin, ShieldCheck } from "lucide-react"
import { useEffect, useState } from "react"
import { MarketplaceHeader } from "@/components/navigation/MarketplaceHeader"
import { propertiesAPI } from "@/lib/api/properties"
import type { Property } from "@/lib/types/property"

const LOCAL_TOUR_PREFIX = "/demo-tours/"

export default function VirtualTourPage() {
  const params = useParams()
  const searchParams = useSearchParams()
  const propertyId = String(params?.id || "")
  const [property, setProperty] = useState<Property | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    if (!propertyId) return

    void propertiesAPI.getById(propertyId)
      .then(data => { if (active) setProperty(data) })
      .catch(() => { if (active) setError("We could not find this property.") })

    return () => { active = false }
  }, [propertyId])

  const tourUrl = property?.virtual_tour_url
  const hasLocalTour = !!tourUrl && tourUrl.startsWith(LOCAL_TOUR_PREFIX)
  const source = searchParams?.get("from")
  const propertyUrl = `/properties/${propertyId}`

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-slate-900 dark:bg-[#0B0B0B] dark:text-white">
        <MarketplaceHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Property unavailable</h1>
          <p className="mt-2 text-slate-600 dark:text-white/65">{error}</p>
          <Link href="/properties" className="mt-6 inline-flex rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white">Browse properties</Link>
        </main>
      </div>
    )
  }

  if (!property) {
    return <div className="min-h-screen bg-[#FAFAF8] dark:bg-[#0B0B0B]"><MarketplaceHeader /><main className="mx-auto max-w-6xl px-4 py-10"><div className="h-8 w-56 animate-pulse rounded bg-slate-200 dark:bg-white/10" /><div className="mt-6 aspect-video animate-pulse rounded-2xl bg-slate-200 dark:bg-white/10" /></main></div>
  }

  if (!hasLocalTour) {
    return (
      <div className="min-h-screen bg-[#FAFAF8] text-slate-900 dark:bg-[#0B0B0B] dark:text-white">
        <MarketplaceHeader />
        <main className="mx-auto max-w-3xl px-4 py-20 text-center">
          <h1 className="text-2xl font-bold">Virtual tour unavailable</h1>
          <p className="mt-2 text-slate-600 dark:text-white/65">This property does not currently have a demo virtual tour.</p>
          <Link href={propertyUrl} className="mt-6 inline-flex rounded-xl bg-orange-500 px-4 py-2.5 font-semibold text-white">Back to property</Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#FAFAF8] text-slate-900 dark:bg-[#0B0B0B] dark:text-white">
      <MarketplaceHeader />
      <div className="border-b border-slate-200 bg-white dark:border-white/10 dark:bg-black">
        <nav aria-label="Breadcrumb" className="mx-auto flex max-w-7xl items-center gap-2 overflow-x-auto px-4 py-3 text-sm">
          <Link href="/" className="inline-flex shrink-0 items-center gap-1 font-medium text-slate-600 hover:text-orange-600 dark:text-white/65 dark:hover:text-orange-400">
            <Home className="h-4 w-4" /> Home
          </Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/35" />
          <Link href="/properties" className="shrink-0 font-medium text-slate-600 hover:text-orange-600 dark:text-white/65 dark:hover:text-orange-400">Properties</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/35" />
          <Link href={propertyUrl} className="max-w-52 shrink-0 truncate font-medium text-slate-600 hover:text-orange-600 dark:text-white/65 dark:hover:text-orange-400 sm:max-w-80">{property.title}</Link>
          <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 dark:text-white/35" />
          <span className="shrink-0 font-semibold text-slate-900 dark:text-white">Virtual Tour</span>
        </nav>
      </div>
      <main className="mx-auto max-w-7xl px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-orange-200 bg-orange-50 px-3 py-1 text-xs font-semibold text-orange-700 dark:border-orange-500/30 dark:bg-orange-500/10 dark:text-orange-300"><ShieldCheck className="h-3.5 w-3.5" /> Demo virtual tour</div>
            <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">{property.title}</h1>
            <p className="mt-1 inline-flex items-center gap-1.5 text-sm text-slate-600 dark:text-white/65"><MapPin className="h-4 w-4" />{property.location}</p>
          </div>
          {source === "propflow" && <p className="rounded-lg bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 dark:bg-blue-500/10 dark:text-blue-300">Opened from NEST AI — return to chat whenever you are ready.</p>}
        </div>

        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-950 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-100">
          <strong>Demo virtual tour — illustrative preview.</strong> Please confirm the exact property condition during a physical viewing.
        </div>

        <section className="mt-5 overflow-hidden rounded-2xl border border-slate-200 bg-slate-950 shadow-sm dark:border-white/10">
          <iframe
            src={tourUrl}
            title={`Demo virtual tour for ${property.title}`}
            className="block h-[62svh] min-h-[420px] w-full border-0 sm:h-[72svh]"
            allowFullScreen
          />
        </section>

        <section className="sticky bottom-3 mt-5 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur dark:border-white/10 dark:bg-[#141414]/95 sm:static sm:bg-white sm:shadow-sm dark:sm:bg-[#141414]">
          <p className="px-1 pb-3 text-sm font-medium text-slate-700 dark:text-white/85">Ready for the next step?</p>
          <div className="grid gap-2 sm:grid-cols-3">
            <Link href={`${propertyUrl}?from=virtual-tour&action=schedule-viewing`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-orange-200 px-4 py-2.5 text-sm font-semibold text-orange-700 hover:bg-orange-50 dark:border-orange-500/35 dark:text-orange-300 dark:hover:bg-orange-500/10"><Calendar className="h-4 w-4" /> Schedule physical viewing</Link>
            <Link href={`/properties/${propertyId}/apply?from=virtual-tour`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700"><FileText className="h-4 w-4" /> Apply now</Link>
            <Link href={`/tenant?propflow=1&property_id=${encodeURIComponent(propertyId)}&from=virtual-tour`} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-orange-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"><MessageCircle className="h-4 w-4" /> Ask NEST AI</Link>
          </div>
        </section>
      </main>
    </div>
  )
}
