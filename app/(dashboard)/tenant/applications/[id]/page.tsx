"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft, FileText, MapPin, DollarSign, Calendar,
  Users, User, Loader2, AlertCircle, Phone, Mail,
  Building2, Briefcase, Home, Clock, CheckCircle,
  Eye, MessageSquare
} from "lucide-react"
import Link from "next/link"
import { applicationsAPI, type Application } from "@/lib/api/applications"
import { agreementsAPI } from "@/lib/api/agreements"
import { toast } from "sonner"
import { formatNGN, calculateRentalBreakdown } from "@/lib/utils/rentalCalculations"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'

// ============ HELPER FUNCTIONS ============

const formatEmploymentStatus = (status: string) => ({
  'employed': 'Employed',
  'self-employed': 'Self-Employed',
  'unemployed': 'Unemployed',
  'student': 'Student'
}[status] ?? status)

const getStatusBadgeStyle = (status: string) => ({
  pending:   "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
  submitted: "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
  under_review: "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
  approved:  "bg-green-100 text-green-800 border-green-200 font-semibold",
  rejected:  "bg-red-100 text-red-800 border-red-200 font-semibold",
  withdrawn: "bg-slate-100 text-slate-800 border-slate-200 font-semibold"
}[status] ?? "bg-slate-100 text-slate-800 border-slate-200 font-semibold")

const getPriorityBorder = (status: string) => {
  switch (status) {
    case 'pending':
    case 'submitted':
    case 'under_review':
      return 'border-l-4 border-l-orange-500'
    case 'approved':  return 'border-l-4 border-l-green-500'
    case 'rejected':  return 'border-l-4 border-l-red-500'
    case 'withdrawn': return 'border-l-4 border-l-slate-300'
    default:          return 'border-l-4 border-l-orange-500'
  }
}

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'approved': return <CheckCircle className="h-5 w-5 text-green-600" />
    case 'rejected': return <AlertCircle className="h-5 w-5 text-red-600" />
    case 'withdrawn': return <AlertCircle className="h-5 w-5 text-slate-500" />
    default:          return <AlertCircle className="h-5 w-5 text-orange-600" />
  }
}

const getStatusBadge = (status: string) => {
  return (
    <Badge className={`${getStatusBadgeStyle(status)}`}>
      {getStatusIcon(status)}
      <span className="ml-1">{status === 'pending' || status === 'submitted' || status === 'under_review' ? 'Under Review' : status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Withdrawn'}</span>
    </Badge>
  )
}

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

// ============ PAGE COMPONENT ============

export default function TenantApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const applicationId = (params?.id as string) || ""

  const [application, setApplication] = useState<Application | null>(null)
  const [agreement, setAgreement] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isCheckingAgreement, setIsCheckingAgreement] = useState(false)
  const [agreementRetries, setAgreementRetries] = useState(0)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/signin")
    }
  }, [user, isLoading, router])

  // Fetch application and agreement if approved
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setIsLoading(true)
        const app = await applicationsAPI.getById(applicationId)
        setApplication(app)
        
        // If application is approved, fetch the agreement
        if (app.status === 'approved') {
          try {
            console.log('📋 [TENANT APP] Fetching agreements for approved application...')
            const agreementsResponse = await agreementsAPI.getMyAgreements()
            console.log('📋 [TENANT APP] Agreements response:', agreementsResponse)
            
            // Backend returns {success, agreements[], count} - check the agreements array
            if (agreementsResponse?.agreements && agreementsResponse.agreements.length > 0) {
              console.log('📋 [TENANT APP] Found agreements:', agreementsResponse.agreements.length)
              console.log('📋 [TENANT APP] Looking for agreement with application_id:', applicationId)
              console.log('📋 [TENANT APP] All agreements details:', agreementsResponse.agreements.map(a => ({
                id: a.id,
                application_id: a.application_id,
                status: a.status,
                created_at: a.created_at
              })))
              
              // Try to find agreement by application_id first
              let appAgreement = agreementsResponse.agreements.find(a => a.application_id === applicationId)
              
              console.log('📋 [TENANT APP] Agreement found by application_id:', appAgreement)
              
              // If not found by application_id, take the most recent agreement (in case of timing issues)
              if (!appAgreement && agreementsResponse.agreements.length > 0) {
                console.log('⚠️ [TENANT APP] Agreement not found by application_id, using most recent agreement')
                appAgreement = agreementsResponse.agreements.sort(
                  (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                )[0]
                console.log('📋 [TENANT APP] Most recent agreement:', appAgreement)
              }
              
              console.log('📋 [TENANT APP] Final agreement selected:', appAgreement)
              
              if (appAgreement) {
                setAgreement(appAgreement)
                console.log('✅ [TENANT APP] Agreement set successfully')
              } else {
                console.log('❌ [TENANT APP] No agreement found for this application')
              }
            } else {
              console.log('⚠️ [TENANT APP] No agreements found - might still be generating:', agreementsResponse)
            }
          } catch (error) {
            console.error("❌ [TENANT APP] Failed to fetch agreement:", error)
            // Don't show error for agreement fetching, it might still be generating
          }
        }
      } catch (error) {
        console.error("Failed to fetch application:", error)
        toast.error("Failed to load application")
        router.push("/tenant/applications")
      } finally {
        setIsLoading(false)
      }
    }

    if (user && applicationId) {
      fetchApplication()
    }
  }, [user, applicationId, router])

  // Poll for agreement if application is approved but agreement not yet loaded
  useEffect(() => {
    if (application?.status !== 'approved' || agreement || agreementRetries > 10) {
      return // Stop polling if not needed
    }

    const pollForAgreement = async () => {
      setIsCheckingAgreement(true)
      try {
        console.log(`🔄 [TENANT APP] Polling for agreement (attempt ${agreementRetries + 1})...`)
        const agreementsResponse = await agreementsAPI.getMyAgreements()
        
        if (agreementsResponse?.agreements && agreementsResponse.agreements.length > 0) {
          console.log(`🔄 [TENANT APP] Poll ${agreementRetries + 1}: Found ${agreementsResponse.agreements.length} agreements`)
          console.log('🔄 [TENANT APP] Poll agreements details:', agreementsResponse.agreements.map(a => ({
            id: a.id,
            application_id: a.application_id,
            status: a.status,
            created_at: a.created_at
          })))
          
          // Try to find agreement by application_id first
          let appAgreement = agreementsResponse.agreements.find(a => a.application_id === applicationId)
          
          console.log(`🔄 [TENANT APP] Poll ${agreementRetries + 1}: Agreement found by application_id:`, appAgreement)
          
          // If not found by application_id, take the most recent agreement
          if (!appAgreement) {
            appAgreement = agreementsResponse.agreements.sort(
              (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            )[0]
            console.log(`🔄 [TENANT APP] Poll ${agreementRetries + 1}: Most recent agreement:`, appAgreement)
          }
          
          if (appAgreement) {
            console.log('✅ [TENANT APP] Agreement found on retry!')
            setAgreement(appAgreement)
            setAgreementRetries(0)
            return
          }
        } else {
          console.log(`🔄 [TENANT APP] Poll ${agreementRetries + 1}: No agreements found yet`, agreementsResponse)
        }
        
        // Agreement not found yet, increment retry counter
        setAgreementRetries(prev => prev + 1)
      } catch (error) {
        console.error("❌ [TENANT APP] Failed to poll for agreement:", error)
        setAgreementRetries(prev => prev + 1)
      } finally {
        setIsCheckingAgreement(false)
      }
    }

    // Poll every 3 seconds
    const timer = setTimeout(pollForAgreement, 3000)
    return () => clearTimeout(timer)
  }, [application?.status, agreement, applicationId, agreementRetries])

  // Handle withdraw
  const handleWithdraw = async () => {
    if (!application) return
    
    setIsWithdrawing(true)
    try {
      await applicationsAPI.withdraw(application.id)
      toast.success("Application withdrawn successfully")
      router.push("/tenant/applications")
    } catch (error) {
      console.error("Failed to withdraw application:", error)
      toast.error("Failed to withdraw application")
    } finally {
      setIsWithdrawing(false)
    }
  }

  // Loading state
  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <div className="h-12 w-48 bg-slate-200 rounded animate-pulse mb-4" />
          <div className="h-6 w-96 bg-slate-200 rounded animate-pulse" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 bg-white rounded-xl animate-pulse border border-slate-100" />
            ))}
          </div>
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="h-40 bg-white rounded-xl animate-pulse border border-slate-100" />
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (!application) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-10 w-10 text-orange-500" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Application Not Found</h2>
          <p className="text-slate-600 mb-6">The application could not be found.</p>
          <Button 
            onClick={() => router.push('/tenant/applications')}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Applications
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header Section */}
        <div className="mb-8">
          <Link href="/tenant/applications">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Applications
            </Button>
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3">
                Application Review
              </h1>
              <p className="text-slate-600">
                Review your rental application details
              </p>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </div>

      {/* Status Banner */}
      {(application.status === 'pending' || application.status === 'submitted' || application.status === 'under_review') && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-orange-50 border border-orange-200 rounded-xl">
          <Clock className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-orange-900">Application Under Review</p>
            <p className="text-sm text-orange-700 mt-0.5">
              The landlord is reviewing your application. You will be notified of their decision.
            </p>
          </div>
        </div>
      )}

      {application.status === 'approved' && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-green-900">Application Approved!</p>
            <p className="text-sm text-green-700 mt-0.5">
              Congratulations! Your application was approved. The landlord will reach out to
              discuss next steps including tenancy agreement.
            </p>
          </div>
        </div>
      )}

      {application.status === 'rejected' && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-900">Application Not Approved</p>
            <p className="text-sm text-red-700 mt-0.5">
              Unfortunately your application was not approved for this property.
              You can browse other available properties and apply again.
            </p>
            {application.rejection_reason && (
              <div className="mt-3 p-3 bg-white border border-red-200 rounded-lg">
                <p className="text-xs font-semibold text-red-800 uppercase tracking-wide mb-1">Landlord's Reason</p>
                <p className="text-sm text-red-900">{application.rejection_reason}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {application.status === 'withdrawn' && (
        <div className="flex items-start gap-3 p-4 mb-6 bg-slate-50 border border-slate-200 rounded-xl">
          <AlertCircle className="h-5 w-5 text-slate-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-slate-700">Application Withdrawn</p>
            <p className="text-sm text-slate-600 mt-0.5">
              You withdrew this application. Browse properties to find your next home.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content - Left Column */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Property Information */}
          <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm hover:shadow-lg transition-all duration-300 ${getPriorityBorder(application.status)}`}>
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Home className="h-4 w-4 text-orange-600" />
                </div>
                Property Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-6 mb-6">
                <div className="relative flex-shrink-0">
                  <div className="w-40 h-32 rounded-xl overflow-hidden bg-slate-100 shadow-md">
                    <img
                      src={application.property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                      alt={application.property?.title}
                      className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  {application.property?.price && (
                    <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow">
                      {formatNGN(application.property.price)}/mo
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-orange-600 transition-colors">{application.property?.title}</h3>
                  <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                    <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                    <span className="font-medium">{application.property?.location}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => router.push(`/properties/${application.property?.id}`)}
                    className="border-orange-200 text-orange-700 hover:bg-orange-50"
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    View Full Listing
                  </Button>
                </div>
              </div>
              
              {/* Property Specs Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                {application.property?.beds && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Bedrooms</p>
                    <p className="text-xl font-bold text-slate-900">{application.property.beds}</p>
                  </div>
                )}
                {application.property?.baths && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Bathrooms</p>
                    <p className="text-xl font-bold text-slate-900">{application.property.baths}</p>
                  </div>
                )}
                {application.property?.property_type && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Type</p>
                    <p className="text-lg font-semibold text-slate-900 capitalize">{application.property.property_type}</p>
                  </div>
                )}
                {application.property?.sqft && (
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Area</p>
                    <p className="text-lg font-semibold text-slate-900">{application.property.sqft} sqft</p>
                  </div>
                )}
              </div>

              {/* Full Address */}
              {application.property?.full_address && (
                <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Full Address</p>
                  <p className="text-sm text-slate-700">{application.property.full_address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Your Information */}
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-orange-600" />
                </div>
                Your Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {application.user && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Full Name</label>
                      <p className="text-lg font-semibold text-slate-900 mt-1">{application.user.full_name}</p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Email</label>
                      <div className="flex items-center gap-2 mt-1">
                        <Mail className="h-4 w-4 text-orange-500" />
                        <span className="text-slate-700">{application.user.email}</span>
                      </div>
                    </div>
                  </>
                )}
                {application.user?.phone_number && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Phone</label>
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-orange-500" />
                      <a href={`tel:${application.user.phone_number}`} className="text-orange-600 hover:text-orange-700 font-medium">
                        {application.user.phone_number}
                      </a>
                    </div>
                  </div>
                )}
                {application.monthly_income && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Monthly Income</label>
                    <p className="text-lg font-bold text-orange-600 mt-1">{formatNGN(application.monthly_income)}</p>
                  </div>
                )}
                {application.employment_status && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Employment Status</label>
                    <p className="text-slate-700 capitalize mt-1">{formatEmploymentStatus(application.employment_status)}</p>
                  </div>
                )}
                {application.employer_name && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Employer</label>
                    <p className="text-slate-700 mt-1">{application.employer_name}</p>
                  </div>
                )}
                {application.move_in_date && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Preferred Move-in Date</label>
                    <p className="text-slate-700 mt-1">{new Date(application.move_in_date).toLocaleDateString()}</p>
                  </div>
                )}
                {application.lease_duration && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Lease Duration</label>
                    <p className="text-slate-700 capitalize mt-1">{application.lease_duration}</p>
                  </div>
                )}
                {application.number_of_occupants && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Number of Occupants</label>
                    <p className="text-slate-700 mt-1">{application.number_of_occupants}</p>
                  </div>
                )}
                {application.has_pets !== undefined && (
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Has Pets</label>
                    <p className="text-slate-700 mt-1">{application.has_pets ? 'Yes' : 'No'}</p>
                  </div>
                )}
                {application.pet_details && (
                  <div className="md:col-span-2">
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Pet Details</label>
                    <p className="text-slate-700 mt-1">{application.pet_details}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* References */}
          {application.references && (Object.values(application.references).some(ref => ref)) && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Users className="h-4 w-4 text-orange-600" />
                  </div>
                  References
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                {application.references && application.references.reference1 && (
                  <div className="pb-4 border-b border-slate-100">
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Reference 1</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{application.references.reference1.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Relationship</label>
                        <p className="text-slate-700 capitalize mt-1">{application.references.reference1.relationship}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</label>
                      <a href={`tel:${application.references.reference1.phone}`} className="text-orange-600 hover:text-orange-700 font-medium mt-1 block">
                        {application.references.reference1.phone}
                      </a>
                    </div>
                  </div>
                )}
                {application.references && application.references.reference2 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-3">Reference 2</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Name</label>
                        <p className="text-lg font-semibold text-slate-900 mt-1">{application.references.reference2.name}</p>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Relationship</label>
                        <p className="text-slate-700 capitalize mt-1">{application.references.reference2.relationship}</p>
                      </div>
                    </div>
                    <div className="mt-3">
                      <label className="text-xs font-medium text-slate-500 uppercase tracking-wide">Phone</label>
                      <a href={`tel:${application.references.reference2.phone}`} className="text-orange-600 hover:text-orange-700 font-medium mt-1 block">
                        {application.references.reference2.phone}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Emergency Contact */}
          {application.emergency_contact_name && (
            <Card className="border-slate-200 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Phone className="h-4 w-4 text-orange-600" />
                  </div>
                  Emergency Contact
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Name</label>
                    <p className="text-lg font-semibold text-slate-900 mt-1">{application.emergency_contact_name}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500 uppercase tracking-wide">Phone</label>
                    <a href={`tel:${application.emergency_contact_phone}`} className="text-orange-600 hover:text-orange-700 text-lg font-semibold mt-1 block">
                      {application.emergency_contact_phone}
                    </a>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Additional Message */}
          {application.message && (
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-orange-600" />
                  </div>
                  Your Message
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-800 italic">"{application.message}"</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6  sticky top-24">
          
          {/* Status Panel */}
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Clock className="h-4 w-4 text-orange-600" />
                </div>
                Status
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="mb-4">{getStatusBadge(application.status)}</div>
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Submitted</p>
                  <p className="text-slate-700 font-medium mt-1">{formatDate(application.created_at)}</p>
                </div>
                {application.status !== 'pending' && (
                  <div>
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide">Status Updated</p>
                    <p className="text-slate-700 font-medium mt-1">{formatDate(application.updated_at)}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Application Timeline */}
          <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
            <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
              <CardTitle className="flex items-center gap-2 text-slate-900">
                <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-orange-600" />
                </div>
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex gap-3">
                  <div className="w-3 h-3 rounded-full bg-orange-500 flex-shrink-0 mt-1.5" />
                  <div>
                    <p className="text-sm font-medium text-slate-900">Application Submitted</p>
                    <p className="text-xs text-slate-600">{new Date(application.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                {application.status !== 'pending' && (
                  <div className="flex gap-3">
                    <div className={`w-3 h-3 rounded-full flex-shrink-0 mt-1.5 ${
                      application.status === 'approved' ? 'bg-green-500' : 'bg-red-500'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {application.status === 'approved' ? 'Application Approved' : 'Application ' + application.status}
                      </p>
                      <p className="text-xs text-slate-600">{new Date(application.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Button */}
          {application.status === 'pending' && (
            <Button
              onClick={handleWithdraw}
              disabled={isWithdrawing}
              className="w-full border-2 border-red-200 text-red-600 hover:bg-red-50 h-11 bg-white"
              variant="outline"
            >
              {isWithdrawing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Withdrawing...
                </>
              ) : (
                'Withdraw Application'
              )}
            </Button>
          )}

          {application.status === 'approved' && (
            <div className="space-y-4">
              {/* Success Message */}
              <Card className="border-green-200 bg-gradient-to-br from-green-50 via-emerald-50 to-green-50 shadow-lg">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-green-900 text-lg mb-1">Application Approved! 🎉</h3>
                      <p className="text-sm text-green-700 mb-3">
                        Congratulations! The landlord has approved your rental application for <strong>{application?.property?.title}</strong>. Your journey to move in is underway!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Agreement Info Card */}
              <Card className="border-blue-200">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/30 border-b border-blue-100">
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <FileText className="h-5 w-5 text-blue-600" />
                    Your Rental Agreement is Ready
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <p className="text-sm text-slate-700 mb-4">
                    A formal rental agreement has been automatically generated based on the property details and your application. This document outlines:
                  </p>
                  <ul className="space-y-2 text-sm text-slate-600 mb-4">
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Monthly rent amount and payment terms</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Security deposit and other charges</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Lease duration and start date</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Landlord and tenant responsibilities</span>
                    </li>
                    <li className="flex gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>Termination conditions and notice periods</span>
                    </li>
                  </ul>
                </CardContent>
              </Card>

              {/* Step-by-Step Guide */}
              <Card className="border-orange-200">
                <CardHeader className="bg-gradient-to-r from-orange-50 to-orange-100/30 border-b border-orange-100">
                  <CardTitle className="flex items-center gap-2 text-orange-900">
                    <Clock className="h-5 w-5 text-orange-600" />
                    How to Complete the Process
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="space-y-4">
                    {/* Step 1 */}
                    <div className="flex gap-4 pb-4 border-b border-slate-100">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">1</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 mb-1">Review the Agreement</p>
                        <p className="text-sm text-slate-600">
                          Click the button below to view the complete rental agreement. Read through all terms carefully, especially rent amount, dates, and responsibilities.
                        </p>
                      </div>
                    </div>

                    {/* Step 2 */}
                    <div className="flex gap-4 pb-4 border-b border-slate-100">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">2</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 mb-1">Sign the Agreement</p>
                        <p className="text-sm text-slate-600">
                          Add your digital signature. Your signature confirms you've read and accept all terms. The system captures your IP address for verification.
                        </p>
                      </div>
                    </div>

                    {/* Step 3 */}
                    <div className="flex gap-4 pb-4 border-b border-slate-100">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-orange-600">3</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 mb-1">Landlord Reviews</p>
                        <p className="text-sm text-slate-600">
                          The landlord will be notified and can review your signature. This typically takes 24-48 hours.
                        </p>
                      </div>
                    </div>

                    {/* Step 4 */}
                    <div className="flex gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-green-600">✓</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 mb-1">Agreement Complete</p>
                        <p className="text-sm text-slate-600">
                          Once both parties sign, the agreement is activated. You can then proceed with payment and move-in arrangements.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Important Notes */}
              <Card className="border-amber-200 bg-amber-50">
                <CardContent className="pt-6">
                  <div className="flex gap-3">
                    <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-semibold text-amber-900 mb-2">Important Notes</p>
                      <ul className="space-y-1 text-sm text-amber-800">
                        <li>• Digital signatures are legally binding in Nigeria</li>
                        <li>• You'll receive email confirmations at each step</li>
                        <li>• Keep copies of the signed agreement for your records</li>
                        <li>• Contact support within 7 days if you notice errors</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Primary CTA */}
              {agreement ? (
                <Button
                  onClick={() => router.push(`/tenant/agreements/${agreement.id}`)}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white h-12 text-base font-semibold rounded-lg shadow-lg"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  View & Sign Rental Agreement
                </Button>
              ) : (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Loader2 className="h-5 w-5 text-blue-600 mt-0.5 animate-spin flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-blue-900 mb-1">
                        {agreementRetries > 8 ? 'Having Trouble Finding Your Agreement' : 'Generating Your Agreement'}
                      </p>
                      <p className="text-sm text-blue-700 mb-3">
                        {agreementRetries > 8 
                          ? 'Your agreement is taking longer than expected. This can happen if there was a delay in processing. Try the buttons below to check again.'
                          : `Your rental agreement is being prepared. Checking... (attempt ${agreementRetries + 1}/11)`
                        }
                      </p>
                      <div className="flex gap-2">
                        <Button
                          onClick={async () => {
                            setIsCheckingAgreement(true)
                            try {
                              const agreementsResponse = await agreementsAPI.getMyAgreements()
                              if (agreementsResponse.success && agreementsResponse.agreements && agreementsResponse.agreements.length > 0) {
                                let appAgreement = agreementsResponse.agreements.find(a => a.application_id === applicationId)
                                if (!appAgreement) {
                                  appAgreement = agreementsResponse.agreements.sort(
                                    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                  )[0]
                                }
                                if (appAgreement) {
                                  setAgreement(appAgreement)
                                  toast.success('Agreement found!')
                                } else {
                                  toast.error('Agreement still being generated. Try again in a moment.')
                                }
                              }
                            } catch (error) {
                              toast.error('Failed to check for agreement')
                              console.error(error)
                            } finally {
                              setIsCheckingAgreement(false)
                            }
                          }}
                          disabled={isCheckingAgreement}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          {isCheckingAgreement ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Checking...
                            </>
                          ) : (
                            'Check Now'
                          )}
                        </Button>
                        <Button
                          onClick={() => window.location.reload()}
                          variant="outline"
                          className="border-blue-200 text-blue-600 hover:bg-blue-100"
                        >
                          Refresh Page
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <Card className="border-slate-200">
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3 text-sm">
                    <Clock className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-slate-900 mb-1">Expected Timeline</p>
                      <p className="text-slate-600">
                        Most agreements are fully signed within 48 hours. You'll be notified at each step. Average completion time is 24-48 hours from now.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {application.status === 'rejected' && (
            <Card className="border-red-200 shadow-sm">
              <CardHeader className="border-b border-red-100 bg-gradient-to-r from-red-50 to-red-100/30">
                <CardTitle className="flex items-center gap-2 text-red-700">
                  <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  </div>
                  Rejection Reason
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="bg-red-50 border border-red-100 rounded-lg p-4">
                  <p className="text-slate-700 leading-relaxed">
                    {application.rejection_reason || 'No reason provided by landlord.'}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
    </div>
  )
}
