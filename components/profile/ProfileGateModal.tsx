"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Shield, CheckCircle, Clock, MessageSquare, Percent, Home, Sparkles, TrendingUp } from "lucide-react"
import { useRouter } from "next/navigation"
import { dialogStyles as s } from "@/lib/utils/dialogStyles"

interface ProfileGateModalProps {
  isOpen: boolean
  onClose: () => void
  profileCompletion: number
  onCompleteNow: () => void
}

export function ProfileGateModal({ 
  isOpen, 
  onClose, 
  profileCompletion,
  onCompleteNow 
}: ProfileGateModalProps) {
  const router = useRouter()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => setIsVisible(true), 50)
    } else {
      setIsVisible(false)
    }
  }, [isOpen])

  const benefits = [
    {
      icon: CheckCircle,
      title: "Apply to any property instantly",
      description: "One-click applications with auto-filled documents",
      color: "from-emerald-500 to-teal-600"
    },
    {
      icon: Clock,
      title: "Schedule verified viewings",
      description: "Book secure viewing slots with landlords",
      color: "from-blue-500 to-cyan-600"
    },
    {
      icon: MessageSquare,
      title: "Chat with landlords securely",
      description: "Direct messaging after application approval",
      color: "from-purple-500 to-pink-600"
    },
    {
      icon: Home,
      title: "Get priority in application queue",
      description: "Verified profiles are reviewed first",
      color: "from-orange-500 to-red-600"
    },
    {
      icon: TrendingUp,
      title: "Boost your trust score",
      description: "Complete profile increases approval chances by 3x",
      color: "from-amber-500 to-orange-600"
    },
    {
      icon: Shield,
      title: "Free rent guarantee (1st month)",
      description: "Protection for your first month's rent",
      color: "from-green-500 to-emerald-600"
    }
  ]

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[85vh] p-0 gap-0 overflow-hidden bg-gradient-to-br from-white via-orange-50/30 to-white border-2 border-orange-100/50 shadow-2xl dark:border-orange-500/20 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:shadow-black/60">
        {/* Animated Background Gradient */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-purple-500/5 dark:from-orange-500/10 dark:to-purple-500/10" />

        {/* Scrollable Content */}
        <div className="custom-scrollbar relative overflow-x-hidden overflow-y-auto" style={{ maxHeight: '85vh' }}>
          <div className="p-8 pb-6">
            {/* Header with Icon */}
            <div className="mb-8 flex flex-col items-center text-center">
              {/* Animated Icon Container */}
              <div className={`relative mb-6 transition-all duration-700 ${isVisible ? 'scale-100 opacity-100' : 'scale-50 opacity-0'}`}>
                <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-br from-orange-400 to-pink-500 opacity-30 blur-xl" />
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-pink-600 shadow-lg">
                  <Shield className="h-10 w-10 text-white drop-shadow-lg" />
                  <Sparkles className="absolute -right-1 -top-1 h-5 w-5 animate-pulse text-yellow-400" />
                </div>
              </div>

              <DialogTitle className={`mb-3 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 bg-clip-text text-3xl font-bold text-transparent transition-all duration-500 delay-100 dark:from-slate-100 dark:via-white dark:to-slate-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                Complete Your Profile to Apply
              </DialogTitle>
              <p className={`text-lg text-slate-600 transition-all duration-500 delay-200 dark:text-slate-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                Quick 2-minute verification • Unlock premium features
              </p>
            </div>

            {/* Progress Section */}
            <div className={`mb-8 transition-all duration-500 delay-300 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="rounded-2xl border border-orange-100/50 bg-white/80 p-6 shadow-lg backdrop-blur-sm dark:border-orange-500/20 dark:bg-slate-900/80">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-slate-900 dark:text-slate-100">
                      {profileCompletion}% Complete
                    </span>
                    <span className="rounded-full bg-gradient-to-r from-orange-500 to-pink-500 px-3 py-1 text-xs font-semibold text-white">
                      {profileCompletion === 0 ? "Let's start!" :
                       profileCompletion < 50 ? "Keep going!" :
                       profileCompletion < 100 ? "Almost there!" :
                       "Complete! 🎉"}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {Math.ceil((100 - profileCompletion) / 33)} steps left
                  </span>
                </div>
                <div className="relative h-4 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                  <div
                    className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 shadow-lg transition-all duration-1000 ease-out"
                    style={{ width: `${profileCompletion}%` }}
                  >
                    <div className="absolute inset-0 animate-shimmer bg-gradient-to-r from-white/0 via-white/30 to-white/0" />
                  </div>
                </div>
              </div>
            </div>

            {/* Benefits Grid */}
            <div className="mb-8">
              <h3 className={`mb-5 flex items-center gap-2 text-xl font-bold text-slate-900 transition-all duration-500 delay-400 dark:text-slate-100 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
                <Sparkles className="h-5 w-5 text-orange-500" />
                What you'll unlock:
              </h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {benefits.map((benefit, index) => (
                  <div
                    key={index}
                    className={`group relative flex cursor-pointer gap-4 rounded-2xl border border-slate-200/50 bg-white/80 p-4 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:border-orange-300 hover:shadow-xl dark:border-slate-800/60 dark:bg-slate-900/70 dark:hover:border-orange-500/40 dark:hover:shadow-black/40 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}
                    style={{ transitionDelay: `${500 + index * 100}ms` }}
                  >
                    {/* Gradient Background on Hover */}
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-orange-50 to-pink-50 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-orange-500/10 dark:to-pink-500/10" />

                    <div className="relative flex-shrink-0">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${benefit.color} shadow-lg transition-transform duration-300 group-hover:scale-110`}>
                        <benefit.icon className="h-6 w-6 text-white drop-shadow" />
                      </div>
                    </div>
                    <div className="relative">
                      <h4 className="mb-1.5 text-sm font-semibold text-slate-900 transition-colors group-hover:text-orange-600 dark:text-slate-100 dark:group-hover:text-orange-400">
                        {benefit.title}
                      </h4>
                      <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400">
                        {benefit.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time Estimate Banner */}
            <div className={`mb-6 rounded-2xl bg-gradient-to-r from-blue-500 to-cyan-500 p-5 shadow-lg transition-all duration-500 delay-1000 dark:from-blue-600 dark:to-cyan-600 ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}`}>
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm">
                  <Clock className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-lg font-bold text-white">Takes only 2 minutes</p>
                  <p className="text-sm text-blue-50 dark:text-blue-100/90">
                    {profileCompletion === 0 ? "3 quick steps • Start now and finish fast" :
                     profileCompletion === 33 ? "2 steps remaining • You're doing great!" :
                     profileCompletion === 66 ? "1 final step • Almost done!" :
                     "Just review and confirm • You're ready!"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Footer with Actions */}
          <div className="sticky bottom-0 border-t border-slate-200/50 bg-gradient-to-t from-white via-white to-white/95 p-6 pt-4 backdrop-blur-lg dark:border-slate-800/60 dark:from-slate-950 dark:via-slate-950 dark:to-slate-950/95">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <Button
                onClick={onCompleteNow}
                className="h-14 flex-1 rounded-xl bg-gradient-to-r from-orange-600 via-pink-600 to-purple-600 text-lg font-bold text-white shadow-lg transition-all duration-300 hover:-translate-y-0.5 hover:from-orange-700 hover:via-pink-700 hover:to-purple-700 hover:shadow-xl"
              >
                <span className="flex items-center gap-2">
                  Complete Now
                  <Sparkles className="h-5 w-5 transition-transform group-hover:rotate-12" />
                </span>
              </Button>
              <Button
                onClick={onClose}
                variant="outline"
                className="h-14 flex-1 rounded-xl border-2 border-slate-300 font-semibold text-slate-700 transition-all duration-300 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:bg-slate-800/60"
              >
                Maybe Later
              </Button>
            </div>

            {/* Security Badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <Shield className="h-4 w-4 text-green-600 dark:text-green-500" />
              <span>Your information is encrypted and secure • We never share your data</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
