"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { Header } from "@/components/header"
import { Footer } from "@/components/footer"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { toast } from "sonner"
import { 
  Users, 
  User,
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  Mail, 
  Phone, 
  FileText, 
  Calendar,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  MapPin,
  Briefcase
} from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { VerificationBadge } from "@/components/ui/verification-badge"

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

interface TenantVerification {
  id: string
  email: string
  full_name: string
  user_type: string
  verification_status: 'pending' | 'approved' | 'rejected'
  phone?: string
  current_address?: string
  employment_status?: string
  monthly_income?: string
  number_of_occupants?: number
  id_document_type?: string
  id_document?: string
  profile_photo?: string
  proof_of_income?: string
  references?: string
  verification_submitted_at?: string
  verification_approved_at?: string
  verification_rejected_at?: string
  rejection_reason?: string
  created_at: string
}

export default function TenantVerificationPage() {
  const { user, loading: authLoading } = useAuth()
  
  // ✅ USE DASHBOARD CONTEXT FOR CACHING
  const { stats: cachedStats } = useDashboard()
  
  const [verifications, setVerifications] = useState<TenantVerification[]>([])
  const [loading, setLoading] = useState(true)
  const [mounted, setMounted] = useState(false)
  const [dataReady, setDataReady] = useState(false)
  const [selectedVerification, setSelectedVerification] = useState<TenantVerification | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')

  // Check if user is admin
  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && !authLoading) {
      if (!user) {
        window.location.href = '/signin'
        return
      }
      
      if (user.user_type !== 'admin') {
        window.location.href = '/admin'
        return
      }
      
      setDataReady(true)
    }
  }, [user, authLoading, mounted])

  // Fetch tenant verifications
  const fetchVerifications = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem('access_token')
      const resp = await fetch(`${API_URL}/api/v1/admin/tenant-verifications?status=${filter}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!resp.ok) {
        throw new Error('Failed to fetch verifications')
      }

      const data = await resp.json()
      setVerifications(data)
      setLoading(false)
    } catch (error: any) {
      console.error('Error fetching verifications:', error)
      setLoading(false)
    }
  }

  // ✅ USE CACHED STATS IF AVAILABLE
  useEffect(() => {
    if (cachedStats && !verifications.length) {
      console.log('💾 [CACHE HIT] Using cached dashboard stats')
      setDataReady(true)
    }
  }, [cachedStats, verifications.length])

  // ============================================================================
  // LOADING STATE - Smart: only show on true initial auth load
  // ============================================================================
  if (!dataReady || (authLoading && !verifications.length)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
        <div className="container mx-auto px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-1/2 mb-2" />
            <Skeleton className="h-6 w-1/3" />
          </div>

          {/* Filters Skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-10" />
            ))}
          </div>

          {/* Table Skeleton */}
          <Card className="border-orange-200 bg-white/80">
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
  useEffect(() => {
    if (mounted) {
      fetchVerifications()
    }
  }, [filter, mounted])

  const handleApprove = async (verificationId: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const resp = await fetch(`${API_URL}/api/v1/admin/tenant-verifications/${verificationId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (!resp.ok) {
        throw new Error('Failed to approve verification')
      }

      toast.success('Tenant verification approved')
      fetchVerifications()
    } catch (error: any) {
      toast.error(error.message || 'Failed to approve verification')
    }
  }

  const handleReject = async (verificationId: string, reason: string) => {
    try {
      const token = localStorage.getItem('access_token')
      const resp = await fetch(`${API_URL}/api/v1/admin/tenant-verifications/${verificationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      })

      if (!resp.ok) {
        throw new Error('Failed to reject verification')
      }

      toast.success('Tenant verification rejected')
      fetchVerifications()
    } catch (error: any) {
      toast.error(error.message || 'Failed to reject verification')
    }
  }

  const getEmploymentBadge = (status?: string) => {
    if (!status) return <Badge variant="outline">Not specified</Badge>
    
    const colors: Record<string, string> = {
      'employed': 'bg-blue-100 text-blue-800',
      'self-employed': 'bg-purple-100 text-purple-800',
      'student': 'bg-yellow-100 text-yellow-800',
      'unemployed': 'bg-gray-100 text-gray-800'
    }
    
    return (
      <Badge className={colors[status] || 'bg-gray-100 text-gray-800'}>
        {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin mr-3" />
            <span>Loading tenant verifications...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* <Header /> */}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Tenant Verification</h1>
          <p className="text-muted-foreground mt-2">
            Review and verify tenant profiles, identity documents, and rental applications
          </p>
        </div>

        {/* Navigation */}
        <div className="mb-6 flex space-x-4">
          <Button
            variant={filter === 'all' ? 'default' : 'outline'}
            onClick={() => setFilter('all')}
          >
            All ({verifications.length})
          </Button>
          <Button
            variant={filter === 'pending' ? 'default' : 'outline'}
            onClick={() => setFilter('pending')}
          >
            Pending ({verifications.filter(v => v.verification_status === 'pending').length})
          </Button>
          <Button
            variant={filter === 'verified' ? 'default' : 'outline'}
            onClick={() => setFilter('verified')}
          >
            Verified ({verifications.filter(v => v.verification_status === 'approved').length})
          </Button>
          <Button
            variant={filter === 'rejected' ? 'default' : 'outline'}
            onClick={() => setFilter('rejected')}
          >
            Rejected ({verifications.filter(v => v.verification_status === 'rejected').length})
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="w-6 h-6 text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Pending Review</p>
                  <p className="text-2xl font-bold">
                    {verifications.filter(v => v.verification_status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Verified</p>
                  <p className="text-2xl font-bold">
                    {verifications.filter(v => v.verification_status === 'approved').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-red-100 rounded-lg">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                  <p className="text-2xl font-bold">
                    {verifications.filter(v => v.verification_status === 'rejected').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Tenants</p>
                  <p className="text-2xl font-bold">{verifications.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Verifications Table */}
        <Card>
          <CardHeader>
            <CardTitle>Tenant Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Employment</TableHead>
                  <TableHead>Income</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {verifications.map((verification) => (
                  <TableRow key={verification.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-muted rounded-full flex items-center justify-center">
                          {verification.profile_photo ? (
                            <img 
                              src={verification.profile_photo} 
                              alt={verification.full_name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <User className="w-5 h-5 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{verification.full_name}</p>
                          <p className="text-sm text-muted-foreground">{verification.email}</p>
                          {verification.number_of_occupants && (
                            <p className="text-xs text-muted-foreground">
                              {verification.number_of_occupants} occupant{verification.number_of_occupants > 1 ? 's' : ''}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {verification.phone && (
                          <div className="flex items-center text-sm">
                            <Phone className="w-3 h-3 mr-1 text-muted-foreground" />
                            {verification.phone}
                          </div>
                        )}
                        {verification.current_address && (
                          <div className="flex items-start text-sm">
                            <MapPin className="w-3 h-3 mr-1 text-muted-foreground mt-0.5" />
                            <span className="truncate max-w-[200px]">{verification.current_address}</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getEmploymentBadge(verification.employment_status)}
                    </TableCell>
                    <TableCell>
                      {verification.monthly_income ? (
                        <Badge variant="outline">
                          ₦{verification.monthly_income}
                        </Badge>
                      ) : (
                        <Badge variant="outline">Not specified</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <VerificationBadge 
                        status={
                          verification.verification_status === 'approved' ? 'verified' : 
                          verification.verification_status
                        } 
                        type="tenant" 
                        size="sm"
                      />
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {verification.verification_submitted_at ? 
                          <div className="flex items-center">
                            <Calendar className="w-3 h-3 mr-1 text-muted-foreground" />
                            {new Date(verification.verification_submitted_at).toLocaleDateString()}
                          </div> : 
                          'Not submitted'
                        }
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        {verification.profile_photo && (
                          <Button variant="outline" size="sm" onClick={() => window.open(verification.profile_photo, '_blank')}>
                            <User className="w-3 h-3" />
                          </Button>
                        )}
                        {verification.id_document && (
                          <Button variant="outline" size="sm" onClick={() => window.open(verification.id_document, '_blank')}>
                            <FileText className="w-3 h-3" />
                          </Button>
                        )}
                        {verification.proof_of_income && (
                          <Button variant="outline" size="sm" onClick={() => window.open(verification.proof_of_income, '_blank')}>
                            <Briefcase className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {verification.verification_status === 'pending' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="default"
                              onClick={() => handleApprove(verification.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Approve
                            </Button>
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => {
                                const reason = prompt('Enter rejection reason:')
                                if (reason) handleReject(verification.id, reason)
                              }}
                            >
                              <XCircle className="w-3 h-3 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        {verification.verification_status === 'rejected' && verification.rejection_reason && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => alert(`Rejection reason: ${verification.rejection_reason}`)}
                          >
                            <AlertTriangle className="w-3 h-3 mr-1" />
                            View Reason
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* <Footer /> */}
    </div>
  )
}
