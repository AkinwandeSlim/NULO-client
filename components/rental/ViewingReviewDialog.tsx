"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

export function ViewingReviewDialog({ request, open, submitting, onClose, onConfirm, onPropose, onDecline }: any) {
  const [confirmedDate, setConfirmedDate] = useState("")
  const [confirmedTime, setConfirmedTime] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!request) return
    setConfirmedDate(request.confirmed_date || request.preferred_date || "")
    setConfirmedTime(request.confirmed_time || "")
    setNotes(request.landlord_notes || "")
  }, [request])

  const appointment = {
    confirmed_date: confirmedDate,
    confirmed_time: confirmedTime,
    landlord_notes: notes,
  }
  const canSubmit = Boolean(confirmedDate && confirmedTime && !submitting)

  return (
    <Dialog open={open} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-lg overflow-hidden rounded-2xl border border-slate-200 bg-white p-0 shadow-xl sm:w-full">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-6 py-5 text-left">
          <DialogTitle className="text-xl font-semibold text-slate-900">Review viewing appointment</DialogTitle>
          <DialogDescription className="mt-1 text-sm leading-6 text-slate-600">
            Confirm the exact appointment, or propose a new time for the tenant to accept.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 px-6 py-6">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="viewing-date" className="text-sm font-medium text-slate-700">Date</Label>
                <Input id="viewing-date" type="date" min={new Date().toISOString().slice(0, 10)} value={confirmedDate} onChange={(e) => setConfirmedDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="viewing-time" className="text-sm font-medium text-slate-700">Exact time</Label>
                <Input id="viewing-time" type="time" value={confirmedTime} onChange={(e) => setConfirmedTime(e.target.value)} />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="viewing-note" className="text-sm font-medium text-slate-700">
              Message to tenant <span className="font-normal text-slate-400">(optional)</span>
            </Label>
            <Textarea id="viewing-note" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="For example: Please meet the caretaker at the gate." className="min-h-24 resize-none" />
          </div>

          <p className="rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-800">
            Proposing a time keeps the request pending until the tenant accepts it. Confirming schedules the viewing immediately.
          </p>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-slate-200 bg-slate-50 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700" disabled={submitting} onClick={() => onDecline(notes || "This time is unavailable.")}>
            Decline request
          </Button>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" disabled={!canSubmit} onClick={() => onPropose(appointment)}>
              Propose time
            </Button>
            <Button disabled={!canSubmit} onClick={() => onConfirm(appointment)}>
              {submitting ? "Saving..." : "Confirm viewing"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
