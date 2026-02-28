"use client"

/**
 * Landlord Verification Detail Page
 * REFACTORED: Uses centralized API module and auth hook
 * Features:
 * - Centralized API calls via verification.ts
 * - Proper auth handling with useAuth hook
 * - Consistent error handling
 * - Loading states
 */

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { useDashboard } from "@/contexts/DashboardContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Eye, 
  User, 
  Building, 
  FileText,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  Shield,
  Camera,
  FileCheck,
  Building2,
  Users,
  ExternalLink,
  CreditCard,
  Banknote
} from "lucide-react"

// ✅ USE CENTRALIZED API MODULE
import {
  getLandlordVerificationDetail,
  approveLandlordVerification,
  rejectLandlordVerification,
  type LandlordVerification
} from '@/lib/api/verification'

export default function LandlordVerificationDetail() {
  const router = useRouter()
  const params = useParams()
  
  // ✅ USE AUTH HOOK (consistent with list page)
  const { user, loading: authLoading } = useAuth()
  
  // ✅ USE DASHBOARD CONTEXT FOR CACHING
  const { stats: cachedStats } = useDashboard()
  
  // State
  const [verification, setVerification] = useState<LandlordVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionForm, setShowRejectionForm] = useState(false)
  const [trustScore, setTrustScore] = useState(85)
  const [approvalNotes, setApprovalNotes] = useState("")
  const [dataReady, setDataReady] = useState(false)

  const verificationId = params.id as string

  // ============================================================================
  // FETCH VERIFICATION DETAIL
  // ============================================================================

  const fetchVerificationDetail = async () => {
    if (!verificationId) return

    try {
      setLoading(true)
      console.log(' [DETAIL PAGE] Fetching verification:', verificationId)
      
      // USE API MODULE (centralized)
      const response = await getLandlordVerificationDetail(verificationId)
      
      console.log('✅ [DETAIL PAGE] Verification loaded:', response)
      // Backend returns { success: true, verification: {...} }
      setVerification(response.verification)
      
    } catch (error: any) {
      console.error(' [DETAIL PAGE] Error fetching verification:', error)
      toast.error(error.message || 'Failed to load verification details')
    } finally {
      setLoading(false)
    }
  }

  // ============================================================================
  // APPROVE VERIFICATION
  // ============================================================================

  const handleApprove = async () => {
    if (!verificationId) return

    try {
      setProcessing(true)
      console.log('📤 [DETAIL PAGE] Approving verification:', verificationId)
      
      // ✅ USE API MODULE - Fixed: pass string instead of object
      await approveLandlordVerification(verificationId, approvalNotes || 'Approved by admin')
      
      toast.success('✅ Landlord verification approved successfully')
      
      // Refresh data
      await fetchVerificationDetail()
      
    } catch (error: any) {
      console.error('❌ [DETAIL PAGE] Error approving:', error)
      toast.error(error.message || 'Failed to approve verification')
    } finally {
      setProcessing(false)
    }
  }

  // ============================================================================
  // REJECT VERIFICATION
  // ============================================================================

  const handleReject = async () => {
    if (!verificationId) return
    
    if (!rejectionReason.trim()) {
      toast.error('⚠️ Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      console.log('📤 [DETAIL PAGE] Rejecting verification:', verificationId)
      
      // ✅ USE API MODULE
      await rejectLandlordVerification(verificationId, rejectionReason)
      
      toast.success('✅ Landlord verification rejected')
      
      // Reset form
      setShowRejectionForm(false)
      setRejectionReason("")
      
      // Refresh data
      await fetchVerificationDetail()
      
    } catch (error: any) {
      console.error('❌ [DETAIL PAGE] Error rejecting:', error)
      toast.error(error.message || 'Failed to reject verification')
    } finally {
      setProcessing(false)
    }
  }

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Auth & access control - simplified and immediate
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        router.push('/signin')
        return
      }
      
      if (user.user_type !== 'admin') {
        router.push('/dashboard')
        return
      }
      
      // Set data ready immediately and fetch verification
      setDataReady(true)
    }
  }, [user, authLoading, router])

  // Fetch data when auth is ready and we have verification ID
  useEffect(() => {
    if (!authLoading && user?.user_type === 'admin' && verificationId) {
      fetchVerificationDetail()
    }
  }, [authLoading, user, verificationId])

  // ============================================================================
  // HELPERS
  // ============================================================================

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { 
        icon: Clock, 
        label: 'Pending Review',
        className: 'bg-orange-100 text-orange-700 border-orange-200'
      },
      approved: { 
        icon: CheckCircle, 
        label: 'Verified',
        className: 'bg-green-100 text-green-700 border-green-200'
      },
      rejected: { 
        icon: XCircle, 
        label: 'Rejected',
        className: 'bg-red-100 text-red-700 border-red-200'
      }
    }
    const config = configs[status as keyof typeof configs] || configs.pending
    const Icon = config.icon
    
    return (
      <Badge className={`px-4 py-2 text-sm ${config.className}`}>
        <Icon className="h-4 w-4 mr-1" />
        {config.label}
      </Badge>
    )
  }

  // ============================================================================
  // LOADING STATE - Simplified: only show skeleton during auth loading or data fetch
  // ============================================================================

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#FFF9F1] via-[#FEF7E6] to-[#FFF5E1]">
        <div className="container mx-auto max-w-6xl px-4 py-8">
          {/* Header Skeleton */}
          <div className="mb-8">
            <Skeleton className="h-10 w-48 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>

          {/* Main Content Grid Skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2">
              <Card className="border-orange-200 bg-white/80">
                <CardHeader>
                  <Skeleton className="h-6 w-48 mb-2" />
                  <Skeleton className="h-4 w-96" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i}>
                      <Skeleton className="h-4 w-24 mb-2" />
                      <Skeleton className="h-8 w-full" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Right Column */}
            <div>
              <Card className="border-orange-200 bg-white/80">
                <CardHeader>
                  <Skeleton className="h-6 w-32 mb-2" />
                </CardHeader>
                <CardContent className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // NOT FOUND STATE
  // ============================================================================

  if (!verification) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center max-w-md mx-auto">
            <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-10 w-10 text-orange-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Verification Not Found</h2>
            <p className="text-slate-600 mb-6">The landlord verification request could not be found.</p>
            <Button 
              onClick={() => router.push('/admin/landlord-verification')}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Verifications
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ============================================================================
  // MAIN RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 py-6">
        
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => router.push('/admin/landlord-verification')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50 hover:border-orange-400"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-slate-900">Verification Review</h1>
                <p className="text-slate-600">Review and manage landlord onboarding application</p>
              </div>
            </div>
            
            {/* Status Badge */}
            {getStatusBadge(verification.admin_review_status)}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Landlord Information */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <User className="h-4 w-4 text-orange-600" />
                  </div>
                  Landlord Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Full Name</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{verification.landlord?.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Email Address</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-orange-500" />
                      <span className="text-slate-700">{verification.landlord?.email}</span>
                    </div>
                  </div>
                  {verification.phone_number && (
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Phone Number</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Phone className="h-4 w-4 text-orange-500" />
                        <span className="text-slate-700">{verification.phone_number}</span>
                      </div>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Account Type</label>
                    <Badge 
                      variant="outline"
                      className="mt-1 bg-orange-50 text-orange-700 border-orange-200"
                    >
                      {verification.account_type === 'company' ? (
                        <>
                          <Building2 className="h-3 w-3 mr-1" />
                          Company
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Individual
                        </>
                      )}
                    </Badge>
                  </div>
                  {verification.company_name && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Company Name</label>
                      <p className="font-semibold text-slate-900 mt-1">{verification.company_name}</p>
                    </div>
                  )}
                  {verification.company_address && (
                    <div className="md:col-span-2">
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Company Address</label>
                      <div className="flex items-start gap-2 mt-1">
                        <MapPin className="h-4 w-4 text-orange-500 mt-1 flex-shrink-0" />
                        <span className="text-slate-700">{verification.company_address}</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Submitted</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{formatDate(verification.submitted_at)}</span>
                      </div>
                    </div>
                    {verification.admin_reviewed_at && (
                      <div>
                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Approved</label>
                        <div className="flex items-center gap-2 mt-1">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span className="text-slate-700">{formatDate(verification.admin_reviewed_at)}</span>
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Account Created</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-700">{formatDate(verification.created_at)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bank Information */}
            {verification.account_name && (
              <Card className="border-slate-200 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                  <CardTitle className="flex items-center gap-2 text-slate-900">
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                      <Banknote className="h-4 w-4 text-orange-600" />
                    </div>
                    Bank Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {verification.account_name && (
                      <div>
                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Account Name</label>
                        <p className="font-semibold text-slate-900 mt-1">{verification.account_name}</p>
                      </div>
                    )}
                    {verification.account_number && (
                      <div>
                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Account Number</label>
                        <p className="font-mono text-slate-900 mt-1">{verification.account_number}</p>
                      </div>
                    )}
                    {verification.bank_name && (
                      <div>
                        <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Bank Name</label>
                        <p className="font-semibold text-slate-900 mt-1">{verification.bank_name}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Verification Documents */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  Verification Documents
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  {/* NIN */}
                  {verification.nin && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50/30 hover:border-orange-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                            <FileCheck className="h-4 w-4 text-blue-600" />
                          </div>
                          <span className="font-semibold text-slate-900">NIN</span>
                        </div>
                        <Badge className={verification.nin_verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                          {verification.nin_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 font-mono">{verification.nin}</p>
                      {verification.nin_document_url && (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full border-slate-200 hover:bg-slate-50"
                          onClick={() => window.open(verification.nin_document_url, '_blank')}
                        >
                          <Eye className="h-3 w-3 mr-2" />
                          View Document
                        </Button>
                      )}
                    </div>
                  )}

                  {/* BVN */}
                  {verification.bvn && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50/30 hover:border-orange-200 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                            <FileCheck className="h-4 w-4 text-green-600" />
                          </div>
                          <span className="font-semibold text-slate-900">BVN</span>
                        </div>
                        <Badge className={verification.bvn_verified ? 'bg-green-100 text-green-700 border-green-200' : 'bg-slate-100 text-slate-600 border-slate-200'}>
                          {verification.bvn_verified ? 'Verified' : 'Pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 font-mono">{verification.bvn}</p>
                    </div>
                  )}

                  {/* Selfie Photo */}
                  {verification.selfie_url && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50/30 hover:border-orange-200 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Camera className="h-4 w-4 text-orange-600" />
                        </div>
                        <span className="font-semibold text-slate-900">Selfie Photo</span>
                      </div>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-slate-200 hover:bg-slate-50"
                        onClick={() => window.open(verification.selfie_url, '_blank')}
                      >
                        <Eye className="h-3 w-3 mr-2" />
                        View Photo
                      </Button>
                    </div>
                  )}

                  {/* ID Document */}
                  {verification.id_document_url && (
                    <div className="border border-slate-200 rounded-lg p-4 bg-gradient-to-br from-white to-slate-50/30 hover:border-orange-200 transition-colors">
                      <div className="flex items-center gap-2 mb-3">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                          <FileCheck className="h-4 w-4 text-purple-600" />
                        </div>
                        <span className="font-semibold text-slate-900">ID Document</span>
                      </div>
                      {verification.id_document_type && (
                        <p className="text-sm text-slate-600 mb-3 font-mono">Type: {verification.id_document_type}</p>
                      )}
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="w-full border-slate-200 hover:bg-slate-50"
                        onClick={() => window.open(verification.id_document_url, '_blank')}
                      >
                        <Download className="h-3 w-3 mr-2" />
                        Download
                      </Button>
                    </div>
                  )}
                </div>

                {/* Empty State */}
                {!verification.nin_document_url && !verification.bvn && !verification.id_document_url && 
                 !verification.selfie_url && (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-slate-400" />
                    </div>
                    <p className="text-slate-600">No documents uploaded yet</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Rejection Reason (if rejected) */}
            {verification.admin_review_status === 'rejected' && verification.admin_notes && (
              <Card className="border-red-200 shadow-sm">
                <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100/30">
                  <CardTitle className="flex items-center gap-2 text-red-700">
                    <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                      <XCircle className="h-4 w-4 text-red-600" />
                    </div>
                    Rejection Reason
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                    <p className="text-slate-700 leading-relaxed">
                      {verification.admin_notes}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            
            {/* Verification Actions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Shield className="h-4 w-4 text-orange-600" />
                  </div>
                  Actions
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 pt-6">
                {verification.admin_review_status === 'pending' ? (
                  <>
                    <div className="bg-orange-50 border border-orange-100 rounded-lg p-4 mb-4">
                      <div className="flex items-start gap-3">
                        <Clock className="h-5 w-5 text-orange-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-semibold text-slate-900 mb-1">Pending Review</p>
                          <p className="text-sm text-slate-600">This application requires your review and decision.</p>
                        </div>
                      </div>
                    </div>

                    {!showRejectionForm ? (
                      <div className="space-y-3">
                        <Button 
                          onClick={handleApprove} 
                          disabled={processing}
                          className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm"
                        >
                          {processing ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <CheckCircle className="h-4 w-4 mr-2" />
                          )}
                          Approve Application
                        </Button>
                        
                        <Button 
                          onClick={() => setShowRejectionForm(true)}
                          variant="outline"
                          className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                        >
                          <XCircle className="h-4 w-4 mr-2" />
                          Reject Application
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="bg-red-50 border border-red-100 rounded-lg p-3">
                          <p className="text-sm font-medium text-red-800 mb-2">Rejection Reason *</p>
                          <Textarea
                            placeholder="Please provide a detailed reason for rejection..."
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="min-h-[120px] bg-white border-red-200 focus:border-red-400"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            onClick={handleReject}
                            disabled={processing || !rejectionReason.trim()}
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                          >
                            {processing ? (
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                              <XCircle className="h-4 w-4 mr-2" />
                            )}
                            Confirm
                          </Button>
                          <Button 
                            onClick={() => {
                              setShowRejectionForm(false)
                              setRejectionReason("")
                            }}
                            variant="outline"
                            className="flex-1"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <div className={`rounded-lg p-4 border ${
                    verification.admin_review_status === 'approved'
                      ? 'bg-green-50 border-green-200'
                      : 'bg-red-50 border-red-200'
                  }`}>
                    <div className="flex items-start gap-3">
                      {verification.admin_review_status === 'approved' ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-green-900 mb-1">Approved</p>
                            <p className="text-sm text-green-700">This landlord has been verified and can list properties.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold text-red-900 mb-1">Rejected</p>
                            <p className="text-sm text-red-700">This application was rejected.</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100">
                <CardTitle className="text-slate-900">Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 pt-6">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                  onClick={() => window.location.href = `mailto:${verification.landlord?.email}`}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                {verification.phone_number && (
                  <Button 
                    variant="outline" 
                    className="w-full justify-start border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                    onClick={() => window.location.href = `tel:${verification.phone_number}`}
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call Landlord
                  </Button>
                )}
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-slate-200 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700"
                  onClick={fetchVerificationDetail}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                  Refresh Data
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}