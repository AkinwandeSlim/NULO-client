"use client"

import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { AlertCircle, RefreshCw, Filter, Home } from 'lucide-react'
import PaginationControls from './PaginationControls'

interface PropertyListProps {
  properties: any[]
  selectedProperty: any | null
  isLoading: boolean
  error: string | null
  pagination: any
  currentPage: number
  handlePageChange: (page: number) => void
  handlePropertySelect: (property: any) => void
  handleFavoriteClick: (propertyId: string) => void
  favorites: string[]
  viewMode: 'split' | 'list' | 'map'
  clearAllFilters: () => void
  searchQuery: string
  loadingTime?: number
  propertyCards: React.ReactNode[]
}

// Loading State Component
function LoadingState({ viewMode }: { viewMode: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Search Stats Skeleton */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </div>
            <Skeleton className="h-10 w-32" />
          </div>
        </div>

        {/* Properties Grid Skeleton */}
        <div className={`grid gap-6 mb-8 ${
          viewMode === 'split' 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {[...Array(8)].map((_, index) => (
            <Card key={index} className="overflow-hidden shadow-lg rounded-2xl border-slate-200">
              <Skeleton className="h-56 w-full" />
              <CardContent className="p-5">
                <Skeleton className="h-6 w-full mb-2" />
                <Skeleton className="h-4 w-3/4 mb-4" />
                <div className="flex justify-between mb-4">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-6 w-16" />
                </div>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <div className="flex justify-between">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-8 w-24" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// Error State Component
function ErrorState({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertCircle className="h-10 w-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Something went wrong</h2>
        <p className="text-slate-600 mb-8">{error}</p>
        <Button 
          onClick={onRetry}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
      </div>
    </div>
  )
}

// Empty State Component
function EmptyState({ onClearFilters, searchQuery }: { onClearFilters: () => void; searchQuery: string }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white flex items-center justify-center">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <Home className="h-10 w-10 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">No properties found</h2>
        <p className="text-slate-600 mb-8">
          {searchQuery 
            ? `No properties match your search for "${searchQuery}"`
            : "No properties are currently available in this area."
          }
        </p>
        {searchQuery && (
          <Button 
            onClick={onClearFilters}
            variant="outline"
            className="border-2 border-slate-300 hover:bg-slate-50"
          >
            <Filter className="h-4 w-4 mr-2" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  )
}

// Search Stats Component
function SearchStats({ 
  total, 
  loadingTime, 
  location, 
  isLoading 
}: { 
  total: number; 
  loadingTime?: number; 
  location: string; 
  isLoading: boolean 
}) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isLoading ? 'Searching...' : `${total} Properties Found`}
          </h1>
          <p className="text-slate-600">
            {location ? `in ${location}` : 'in all locations'}
            {loadingTime && !isLoading && (
              <span className="ml-2 text-orange-600">
                • Loaded in {loadingTime}ms
              </span>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function PropertyList({ 
  properties,
  selectedProperty,
  isLoading,
  error,
  pagination,
  currentPage,
  handlePageChange,
  handlePropertySelect,
  handleFavoriteClick,
  favorites,
  viewMode,
  clearAllFilters,
  searchQuery,
  loadingTime,
  propertyCards
}: PropertyListProps) {

  // ✅ Show loading skeletons if loading and no results yet
  if (isLoading && properties.length === 0) {
    return <LoadingState viewMode={viewMode} />
  }

  if (error) {
    return <ErrorState error={error} onRetry={() => window.location.reload()} />
  }

  // ✅ Show empty state ONLY if done loading AND no properties found
  if (!isLoading && properties.length === 0) {
    return <EmptyState onClearFilters={clearAllFilters} searchQuery={searchQuery} />
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-white">
      <div className="container mx-auto px-4 lg:px-6 py-8">
        {/* Search Stats */}
        <SearchStats 
          total={pagination?.total || 0} 
          loadingTime={loadingTime}
          location={searchQuery}
          isLoading={isLoading}
        />

        {/* Properties Grid */}
        <div className={`grid gap-6 mb-8 ${
          viewMode === 'split' 
            ? 'grid-cols-1 md:grid-cols-2' 
            : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {propertyCards}
        </div>

        {/* Enhanced Pagination */}
        {pagination && (
          <div className="flex justify-center">
            <PaginationControls
              pagination={pagination}
              currentPage={currentPage}
              onPageChange={handlePageChange}
            />
          </div>
        )}
      </div>
    </div>
  )
}
