"use client"

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/contexts/AuthContext'
import { viewingRequestsAPI } from '@/lib/api/viewing-requests'
import { toast } from 'sonner'
import { Trash2, RefreshCw } from 'lucide-react'

export default function ViewingRequestsDebug() {
  const { user } = useAuth()
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  const fetchRequests = async () => {
    setLoading(true)
    try {
      const response = await viewingRequestsAPI.getMyRequests()
      if (response.success) {
        setRequests(response.data)
      } else {
        toast.error('Failed to fetch viewing requests')
      }
    } catch (error) {
      toast.error('Error fetching viewing requests')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (requestId: string) => {
    if (!confirm('Are you sure you want to delete this viewing request?')) {
      return
    }

    try {
      const response = await viewingRequestsAPI.delete(requestId)
      if (response.success) {
        toast.success('Viewing request deleted successfully')
        fetchRequests() // Refresh the list
      } else {
        toast.error(response.error)
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete viewing request')
    }
  }

  useEffect(() => {
    if (user) {
      fetchRequests()
    }
  }, [user])

  if (!user) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600">Please sign in to view your viewing requests</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Viewing Requests Debug</h1>
        <p className="text-slate-600">Manage your viewing requests for testing purposes</p>
      </div>

      <div className="mb-6 flex gap-3">
        <Button 
          onClick={fetchRequests} 
          disabled={loading}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      {requests.length === 0 ? (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <p className="text-blue-800">No viewing requests found. Submit one first to see it here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.id}
              className="bg-white border border-slate-200 rounded-lg p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {request.property?.title || 'Property'}
                  </h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Request ID: {request.id}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  request.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                  request.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                  request.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {request.status}
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
                <div>
                  <p className="text-slate-600">Date</p>
                  <p className="font-medium text-slate-900">{request.preferred_date}</p>
                </div>
                <div>
                  <p className="text-slate-600">Time</p>
                  <p className="font-medium text-slate-900">{request.time_slot}</p>
                </div>
                <div>
                  <p className="text-slate-600">Phone</p>
                  <p className="font-medium text-slate-900">{request.contact_number}</p>
                </div>
                <div>
                  <p className="text-slate-600">Submitted</p>
                  <p className="font-medium text-slate-900">
                    {new Date(request.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {request.message && (
                <div className="mb-4 p-3 bg-slate-50 rounded text-sm">
                  <p className="text-slate-600 font-medium mb-1">Message:</p>
                  <p className="text-slate-700">{request.message}</p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDelete(request.id)}
                  className="flex items-center gap-2"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete Request
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How to Use:</h3>
        <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
          <li>Submit a viewing request on the property detail page</li>
          <li>Visit this page to see all your viewing requests</li>
          <li>Click "Delete Request" to remove a viewing request</li>
          <li>You can then submit a new viewing request for the same property</li>
        </ol>
      </div>
    </div>
  )
}
