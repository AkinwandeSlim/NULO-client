"use client"

import { Badge } from "@/components/ui/badge"
import { Shield } from "lucide-react"

interface TrustScoreBadgeProps {
  score: number
  showLabel?: boolean
  showProgress?: boolean
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'detailed'
}

export function TrustScoreBadge({ 
  score, 
  showLabel = true, 
  showProgress = false,
  size = 'md',
  variant = 'default'
}: TrustScoreBadgeProps) {
  const getTrustScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-red-600'
  }

  const getTrustScoreBgColor = (score: number) => {
    if (score >= 70) return 'bg-green-500'
    if (score >= 40) return 'bg-orange-500'
    return 'bg-red-500'
  }

  const getTrustScoreLevel = (score: number) => {
    if (score >= 70) return 'High'
    if (score >= 40) return 'Medium'
    return 'Low'
  }

  const getTrustScoreBadgeColor = (score: number) => {
    if (score >= 70) return 'bg-green-100 text-green-800 border-green-200'
    if (score >= 40) return 'bg-orange-100 text-orange-800 border-orange-200'
    return 'bg-red-100 text-red-800 border-red-200'
  }

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5'
  }

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-center gap-1">
        <Shield className={`${iconSizes[size]} ${getTrustScoreColor(score)}`} />
        <span className={`font-bold ${getTrustScoreColor(score)} ${sizeClasses[size]}`}>
          {score}
        </span>
      </div>
    )
  }

  if (variant === 'detailed') {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Shield className={`${iconSizes[size]} text-slate-600`} />
          {showLabel && (
            <span className="text-sm font-medium text-slate-700">Trust Score:</span>
          )}
          <span className={`font-bold ${getTrustScoreColor(score)}`}>
            {score}/100
          </span>
          <Badge className={`${sizeClasses[size]} ${getTrustScoreBadgeColor(score)}`}>
            {getTrustScoreLevel(score)}
          </Badge>
        </div>
        {showProgress && (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-slate-200 rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getTrustScoreBgColor(score)}`}
                style={{ width: `${score}%` }}
              />
            </div>
            <span className={`text-xs font-medium ${getTrustScoreColor(score)}`}>
              {getTrustScoreLevel(score)}
            </span>
          </div>
        )}
      </div>
    )
  }

  return (
    <Badge className={`${sizeClasses[size]} ${getTrustScoreBadgeColor(score)} flex items-center gap-1`}>
      <Shield className={iconSizes[size]} />
      {showLabel && <span>Trust:</span>}
      {score}/100
    </Badge>
  )
}
