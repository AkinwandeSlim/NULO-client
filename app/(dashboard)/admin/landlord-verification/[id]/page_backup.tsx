"use client"

/**
 * Landlord Verification Detail Page
 * Fixed version with proper status field references and API calls
 */

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { toast } from "sonner"
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  RefreshCw,
  ArrowLeft,
  Mail,
  Phone,
  Calendar,
  Shield,
  User,
  Building2
} from "lucide-react"

import {
  getLandlordVerificationDetail,
  approveLandlordVerification,
  rejectLandlordVerification,
  type LandlordVerification
} from '@/lib/api/verification'

export default function LandlordVerificationDetail() {
  const router = useRouter()
  const params = useParams()
  
  const { user, loading: authLoading } = useAuth()
  
  const [verification, setVerification] = useState<LandlordVerification | null>(null)
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [showRejectionForm, setShowRejectionForm] = useState(false)

  const verificationId = params.id as string

  const fetchVerificationDetail = async () => {
    if (!verificationId) return

    try {
      setLoading(true)
      console.log('📤 [DETAIL PAGE] Fetching verification:', verificationId)
      
      const response = await getLandlordVerificationDetail(verificationId)
      
      console.log('✅ [DETAIL PAGE] Verification loaded:', response.verification)
      setVerification(response.verification)
      
    } catch (error: any) {
      console.error('❌ [DETAIL PAGE] Error fetching verification:', error)
      toast.error(error.message || 'Failed to load verification details')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async () => {
    if (!verificationId) return

    try {
      setProcessing(true)
      console.log('📤 [DETAIL PAGE] Approving verification:', verificationId)
      
      await approveLandlordVerification(verificationId, 'Approved by admin')
      
      toast.success('✅ Landlord verification approved successfully')
      
      await fetchVerificationDetail()
      
    } catch (error: any) {
      console.error('❌ [DETAIL PAGE] Error approving:', error)
      toast.error(error.message || 'Failed to approve verification')
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!verificationId) return
    
    if (!rejectionReason.trim()) {
      toast.error('⚠️ Please provide a rejection reason')
      return
    }

    try {
      setProcessing(true)
      console.log('📤 [DETAIL PAGE] Rejecting verification:', verificationId)
      
      await rejectLandlordVerification(verificationId, rejectionReason)
      
      toast.success('✅ Landlord verification rejected')
      
      setShowRejectionForm(false)
      setRejectionReason("")
      
      await fetchVerificationDetail()
      
    } catch (error: any) {
      console.error('❌ [DETAIL PAGE] Error rejecting:', error)
      toast.error(error.message || 'Failed to reject verification')
    } finally {
      setProcessing(false)
    }
  }

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
    }
  }, [user, authLoading, router])

  useEffect(() => {
    if (!authLoading && user && verificationId) {
      fetchVerificationDetail()
    }
  }, [authLoading, user, verificationId])

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

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="h-8 w-8 animate-spin text-orange-500" />
          <span className="text-slate-600 font-medium">Loading verification details...</span>
        </div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50/30">
      <div className="container mx-auto px-4 py-6">
        
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
            
            {getStatusBadge(verification.admin_review_status)}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          
          <div className="lg:col-span-2 space-y-6">
            
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
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Submitted</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-700">{formatDate(verification.submitted_for_review_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            
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
