"use client"

import { Loader2, Home } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface LoadingStateProps {
  message?: string
  className?: string
}

export function LoadingState({ message = "Loading properties...", className = "" }: LoadingStateProps) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
        <p className="text-slate-600">{message}</p>
      </div>
    </div>
  )
}

interface ErrorStateProps {
  error: string
  onRetry?: () => void
  className?: string
}

export function ErrorState({ error, onRetry, className = "" }: ErrorStateProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-slate-900 mb-2">Error loading properties</h3>
      <p className="text-slate-600 mb-6">{error}</p>
      {onRetry && (
        <Button onClick={onRetry} className="bg-orange-500 hover:bg-orange-600">
          Try Again
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  message?: string
  onClearFilters?: () => void
  className?: string
}

export function EmptyState({ 
  message = "No properties found", 
  onClearFilters,
  className = "" 
}: EmptyStateProps) {
  return (
    <div className={`text-center py-16 ${className}`}>
      <Home className="h-16 w-16 text-slate-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-slate-900 mb-2">{message}</h3>
      <p className="text-slate-600 mb-6">Try adjusting your filters</p>
      {onClearFilters && (
        <Button onClick={onClearFilters} variant="outline">
          Clear All Filters
        </Button>
      )}
    </div>
  )
}
