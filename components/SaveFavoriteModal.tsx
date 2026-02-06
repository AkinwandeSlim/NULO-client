"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Heart, Mail, UserPlus, X } from "lucide-react"
import { toast } from "sonner"

interface SaveFavoriteModalProps {
  isOpen: boolean
  onClose: () => void
  onSaveWithEmail: (email: string) => void
  onContinueBrowsing: () => void
  propertyTitle: string
}

export function SaveFavoriteModal({
  isOpen,
  onClose,
  onSaveWithEmail,
  onContinueBrowsing,
  propertyTitle
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
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Heart className="h-5 w-5 text-red-500 fill-red-500" />
            Save Property to Favorites
          </DialogTitle>
          <DialogDescription className="text-slate-600">
            Save "{propertyTitle}" to view it later. We'll send you updates if the price changes or availability updates.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Email Input Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <Mail className="h-4 w-4 text-orange-500" />
              <span>Continue with Email</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm text-slate-600">
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
                className="h-11"
              />
            </div>
            <Button
              onClick={handleSaveWithEmail}
              disabled={isLoading}
              className="w-full h-11 bg-orange-500 hover:bg-orange-600 text-white font-semibold"
            >
              {isLoading ? (
                <>
                  <span className="animate-spin mr-2">⏳</span>
                  Saving...
                </>
              ) : (
                <>
                  <Heart className="h-4 w-4 mr-2" />
                  Save & Continue Browsing
                </>
              )}
            </Button>
          </div>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-white px-2 text-slate-500">Or</span>
            </div>
          </div>

          {/* Sign Up Option */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
              <UserPlus className="h-4 w-4 text-green-500" />
              <span>Create Free Account</span>
            </div>
            <p className="text-xs text-slate-600">
              Get full access to saved properties, viewing requests, and chat with landlords.
            </p>
            <Button
              onClick={() => {
                onClose()
                // Preselect tenant role when navigating to role selection
                window.location.href = "/signup?role=tenant"
              }}
              variant="outline"
              className="w-full h-11 border-2 border-slate-200 hover:border-orange-500 hover:bg-orange-50 hover:text-orange-600 font-semibold"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Sign Up (It's Free!)
            </Button>
          </div>

          {/* Skip Option */}
          <Button
            onClick={handleContinueBrowsing}
            variant="ghost"
            className="w-full text-slate-600 hover:text-slate-900 hover:bg-slate-50"
          >
            <X className="h-4 w-4 mr-2" />
            Skip for Now
          </Button>
        </div>

        {/* Trust Badge */}
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-700 text-center">
            🛡️ <strong>Your privacy matters:</strong> We'll never spam you. Unsubscribe anytime.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// Export as SaveFavoriteModal 
export default SaveFavoriteModal
