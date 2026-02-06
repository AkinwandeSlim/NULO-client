"use client"

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'

interface SearchBarProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onSearchSubmit: (query: string) => void
  onClear?: () => void
  placeholder?: string
  className?: string
}

export default function SearchBar({ 
  searchQuery, 
  onSearchChange, 
  onSearchSubmit,  onClear,  placeholder = "Search by location, property name...",
  className = ""
}: SearchBarProps) {
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      onSearchSubmit(searchQuery)
    }
  }

  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
      <Input
        type="text"
        placeholder={placeholder}
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        onKeyPress={handleKeyPress}
        className="pl-10 pr-10 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all duration-200"
      />

      {searchQuery && onClear && (
        <button
          aria-label="Clear search"
          onClick={() => onClear()}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 h-8 w-8 flex items-center justify-center rounded-full text-slate-600 hover:bg-slate-100"
        >
          ✕
        </button>
      )}
    </div>
  )
}
