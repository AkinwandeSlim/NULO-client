"use client"

import PaginationControls from './PaginationControls'

interface PropertyGridProps {
  properties: any[]
  pagination: any
  currentPage: number
  onPageChange: (page: number) => void
  propertyCards: React.ReactNode[]
}

export default function PropertyGrid({ 
  properties,
  pagination,
  currentPage,
  onPageChange,
  propertyCards
}: PropertyGridProps) {
  return (
    <div className="flex-1 min-h-0">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 mb-2">
          Properties ({properties.length})
        </h3>
        <p className="text-sm text-slate-600">
          Click on a property to view details on the map
        </p>
      </div>
      
      {/* Properties Grid for split view */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {propertyCards}
      </div>
      
      {/* Pagination for split view */}
      {pagination && (
        <div className="flex justify-center mt-6">
          <PaginationControls
            pagination={pagination}
            currentPage={currentPage}
            onPageChange={onPageChange}
          />
        </div>
      )}
    </div>
  )
}
