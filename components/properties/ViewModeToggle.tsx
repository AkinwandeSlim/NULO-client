"use client"

import { useState } from 'react'
import { Grid, Map, Split } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type ViewMode = 'list' | 'map' | 'split'

interface ViewModeToggleProps {
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  className?: string
}

export default function ViewModeToggle({ 
  viewMode, 
  onViewModeChange,
  className = ""
}: ViewModeToggleProps) {
  return (
    <div className={`flex items-center bg-white rounded-xl border border-slate-200 p-1 ${className}`}>
      <Button
        variant={viewMode === 'list' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('list')}
        className={`flex items-center space-x-2 transition-colors duration-200 ${
          viewMode === 'list' 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Grid className="h-4 w-4" />
        <span>List</span>
      </Button>
      
      <Button
        variant={viewMode === 'split' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('split')}
        className={`flex items-center space-x-2 transition-colors duration-200 ${
          viewMode === 'split' 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Split className="h-4 w-4" />
        <span>Split</span>
      </Button>
      
      <Button
        variant={viewMode === 'map' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('map')}
        className={`flex items-center space-x-2 transition-colors duration-200 ${
          viewMode === 'map' 
            ? 'bg-gradient-to-r from-orange-500 to-orange-600 text-white hover:from-orange-600 hover:to-orange-700 shadow-lg shadow-orange-500/30' 
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
        }`}
      >
        <Map className="h-4 w-4" />
        <span>Map</span>
      </Button>
    </div>
  )
}
