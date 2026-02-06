"use client"

import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Pagination {
  page: number
  limit: number
  total: number
  total_pages: number
}

interface PaginationControlsProps {
  pagination: Pagination | null
  currentPage: number
  onPageChange: (page: number) => void
  className?: string
}

export default function PaginationControls({ 
  pagination, 
  currentPage, 
  onPageChange,
  className = ""
}: PaginationControlsProps) {
  // Guard against null/undefined pagination
  if (!pagination || pagination.total_pages <= 1) {
    return null
  }

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= pagination.total_pages) {
      onPageChange(page)
    }
  }

  // Generate page numbers to show
  const getPageNumbers = () => {
    const pages = []
    const totalPages = pagination.total_pages
    
    if (totalPages <= 7) {
      // Show all pages if 7 or fewer
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else if (currentPage <= 4) {
      // Show first 7 pages when near start
      for (let i = 1; i <= 7; i++) {
        pages.push(i)
      }
    } else if (currentPage >= totalPages - 3) {
      // Show last 7 pages when near end
      for (let i = totalPages - 6; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      // Show pages around current page
      for (let i = currentPage - 3; i <= currentPage + 3; i++) {
        pages.push(i)
      }
    }
    
    return pages
  }

  // Safe calculations for results summary
  const startItem = pagination.total > 0 ? ((currentPage - 1) * pagination.limit) + 1 : 0
  const endItem = pagination.total > 0 ? Math.min(currentPage * pagination.limit, pagination.total) : 0

  return (
    <div className={`flex flex-col items-center mt-8 space-y-4 ${className}`}>
      <div className="flex items-center space-x-2">
        {/* Previous Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>

        {/* Page Numbers */}
        <div className="flex items-center space-x-1">
          {getPageNumbers().map((pageNum) => (
            <Button
              key={pageNum}
              variant={currentPage === pageNum ? "default" : "outline"}
              size="sm"
              onClick={() => handlePageChange(pageNum)}
              className={`w-10 h-10 text-sm font-medium rounded-lg ${
                currentPage === pageNum
                  ? 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600'
                  : 'border border-slate-300 hover:bg-slate-50'
              }`}
            >
              {pageNum}
            </Button>
          ))}
        </div>

        {/* Next Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === pagination.total_pages}
          className="px-3 py-2 text-sm font-medium rounded-lg border border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>

      {/* Results Summary */}
      <div className="text-sm text-slate-600 text-center">
        Showing {startItem} to {endItem} of {pagination.total} properties
      </div>
    </div>
  )
}
