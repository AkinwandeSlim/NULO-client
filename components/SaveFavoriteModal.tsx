"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Mail, UserPlus, X } from "lucide-react"
import { toast } from "sonner"
import { dialogStyles as s } from "@/lib/utils/dialogStyles"

interface SaveFavoriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveWithEmail: (email: string) => void
  onContinueBrowsing: () => void
  propertyTitle: string
  redirectTo?: string
}

export function SaveFavoriteModal({
  isOpen,
  onClose,
  onSaveWithEmail,
  onContinueBrowsing,
  propertyTitle,
  redirectTo
}: SaveFavoriteModalProps) {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSaveWithEmail = async () => {
    if (!email) {
      toast.error("Please enter your email address")
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address")
      return
    }

    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      onSaveWithEmail(email)
      setEmail("")
      setIsLoading(false)
      onClose()
    }, 500)
  }

  const handleContinueBrowsing = () => {
    onContinueBrowsing()
    setEmail("")
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`${s.card} ${s.cardMd}`}>
        <DialogHeader className={s.header}>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 fill-red-500 text-red-500 dark:fill-red-400 dark:text-red-400" />
            Save Property to Favorites
          </DialogTitle>
          <DialogDescription className={s.description}>
            Save "{propertyTitle}" to view it later. We'll send you updates if the price changes or availability updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 px-6 py-4">
          {/* Email Input Option */}
          <div className="space-y-3">
            <div className={`flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200`}>
              <Mail className="h-4 w-4 text-orange-500" />
              <span>Continue with Email</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-slate-600 dark:text-slate-400">
                Enter your email to save and get updates
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="your.email@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleSaveWithEmail()
                  }
                }}
                className={`h-11 ${s.input}`}
              />
            </div>
            <Button
              onClick={handleSaveWithEmail}
              disabled={isLoading}
              className="h-11 w-full bg-orange-500 font-semibold text-white hover:bg-orange-600 dark:bg-orange-500 dark:hover:bg-orange-400"
            >
              {isLoading ? (
                <>
                  <span className="mr-2 animate-spin">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Heart className="mr-2 h-4 w-4" />
                  Save & Continue Browsing
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500 dark:bg-slate-950 dark:text-slate-400">Or</span>
            </div>
          </div>

          {/* Sign Up Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700 dark:text-slate-200">
              <UserPlus className="h-4 w-4 text-green-500" />
              <span>Create Free Account</span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Get full access to saved properties, viewing requests, and chat with landlords.
            </p>
            <Button
              onClick={() => {
                onClose()
                // Preselect tenant role when navigating to role selection
                const signupUrl = redirectTo
                  ? `/signup?role=tenant&redirect_to=${encodeURIComponent(redirectTo)}`
                  : "/signup?role=tenant"
                window.location.href = signupUrl
              }}
              variant="outline"
              className="h-11 w-full border-2 border-slate-200 font-semibold hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 dark:border-slate-700 dark:hover:border-orange-500/50 dark:hover:bg-orange-500/10 dark:hover:text-orange-300"
            >
              <UserPlus className="mr-2 h-4 w-4" />
              Sign Up (It's Free!)
            </Button>
          </div>

          {/* Skip Option */}
          <Button
            onClick={handleContinueBrowsing}
            variant="ghost"
            className="w-full text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/60 dark:hover:text-slate-100"
          >
            <X className="mr-2 h-4 w-4" />
            Skip for Now
          </Button>
        </div>

        {/* Trust Badge */}
        <div className="mx-6 mb-6 mt-2 rounded-lg border border-blue-200 bg-blue-50 p-3 dark:border-blue-800/50 dark:bg-blue-950/40">
          <p className="text-center text-xs text-blue-700 dark:text-blue-200">
            🛡️ <strong>Your privacy matters:</strong> We'll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Export as SaveFavoriteModal
export default SaveFavoriteModal
