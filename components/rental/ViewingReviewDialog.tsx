"use client"

import { useEffect, useState } from "react"
import { CalendarCheck2, CalendarClock, Check, Clock, MessageSquare, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"
import { dialogStyles as s } from "@/lib/utils/dialogStyles"

export function ViewingReviewDialog({ request, open, submitting, onClose, onConfirm, onPropose, onDecline }: any) {
  const [confirmedDate, setConfirmedDate] = useState("")
  const [confirmedTime, setConfirmedTime] = useState("")
  const [notes, setNotes] = useState("")

  useEffect(() => {
    if (!request) return
    // Pre-fill date: use confirmed_date if set, or preferred_date if it's today/future.
    // Never pre-fill a past date — the backend rejects it with 422.
    const today = new Date().toISOString().slice(0, 10)
    const rawDate = request.confirmed_date || request.preferred_date || ""
    setConfirmedDate(rawDate >= today ? rawDate : today)
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
      <DialogContent className={s.card}>
        <DialogHeader className={cn(s.header, 'pt-16')}>
          <div className="flex items-start gap-3">
            <span className="mt-1 inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600 ring-1 ring-orange-200/70 dark:bg-orange-500/10 dark:text-orange-400 dark:ring-orange-500/20">
              <CalendarCheck2 className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 pt-2">
              <DialogTitle className={s.title}>
                Review viewing appointment
              </DialogTitle>
              <DialogDescription className={s.description}>
                Confirm the exact appointment, or propose a new time for the tenant to accept.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className={s.body}>
          <div className={s.section}>
            <div className={s.sectionLabel}>
              <Clock className="h-3.5 w-3.5" />
              Appointment slot
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label htmlFor="viewing-date" className={s.label}>
                  Date
                </Label>
                <Input
                  id="viewing-date"
                  type="date"
                  min={new Date().toISOString().slice(0, 10)}
                  value={confirmedDate}
                  onChange={(e) => setConfirmedDate(e.target.value)}
                  className={s.input}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="viewing-time" className={s.label}>
                  Exact time
                </Label>
                <Input
                  id="viewing-time"
                  type="time"
                  value={confirmedTime}
                  onChange={(e) => setConfirmedTime(e.target.value)}
                  className={s.input}
                />
              </div>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="viewing-note" className={s.label}>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
                Message to tenant
                <span className={s.labelOptional}>(optional)</span>
              </span>
            </Label>
            <Textarea
              id="viewing-note"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="For example: Please meet the caretaker at the gate."
              className={s.textarea}
            />
          </div>

          <p className={s.infoAmber}>
            Proposing a time keeps the request pending until the tenant accepts it. Confirming schedules the viewing immediately.
          </p>
        </div>

        <div className={s.footer}>
          <Button
            variant="outline"
            className={s.danger}
            disabled={submitting}
            onClick={() => onDecline(notes || "This time is unavailable.")}
          >
            <X className="h-4 w-4" />
            Decline request
          </Button>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Button
              variant="outline"
              disabled={!canSubmit}
              onClick={() => onPropose(appointment)}
              className={s.secondary}
            >
              <CalendarClock className="h-4 w-4" />
              Propose time
            </Button>
            <Button
              className={s.primary}
              disabled={!canSubmit}
              onClick={() => onConfirm(appointment)}
            >
              {submitting ? (
                "Saving..."
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Confirm viewing
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
