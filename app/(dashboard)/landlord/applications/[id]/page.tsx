"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import Link from "next/link"
import { 
  ArrowLeft, 
  User, 
  Calendar, 
  DollarSign, 
  FileText, 
  Mail, 
  Phone, 
  MapPin, 
  Briefcase,
  Users,
  CheckCircle2,
  X,
  Loader2,
  Eye,
  CheckCircle,
  Zap,
  AlertCircle,
  Download,
  Shield,
  Home,
  Clock,
  MessageSquare,
  Building2
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { applicationsAPI, type Application } from "@/lib/api/applications"
import { toast } from "sonner"

const DEFAULT_PROPERTY_IMAGE = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=800&h=600&fit=crop'
const DEFAULT_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed='

// ============ HELPER FUNCTIONS ============

const formatNGN = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency", currency: "NGN",
    minimumFractionDigits: 0, maximumFractionDigits: 0
  }).format(amount)

const formatEmploymentStatus = (status: string) => ({
  'employed': 'Employed',
  'self-employed': 'Self-Employed',
  'unemployed': 'Unemployed',
  'student': 'Student'
}[status] ?? status)

const getStatusBadgeStyle = (status: string) => ({
  pending:   "bg-orange-100 text-orange-800 border-orange-200 font-semibold",
  approved:  "bg-green-100 text-green-800 border-green-200 font-semibold",
  rejected:  "bg-red-100 text-red-800 border-red-200 font-semibold",
  withdrawn: "bg-slate-100 text-slate-800 border-slate-200 font-semibold"
}[status] ?? "bg-slate-100 text-slate-800 border-slate-200 font-semibold")

const getPriorityBorder = (status: string) => {
  switch (status) {
    case 'pending':   return 'border-l-4 border-l-orange-500'
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
      <span className="ml-1">{status === 'pending' ? 'Under Review' : status === 'approved' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Withdrawn'}</span>
    </Badge>
  )
}

// ============ DETAIL SECTION COMPONENT ============

interface DetailSectionProps {
  title: string
  children: React.ReactNode
}

function DetailSection({ title, children }: DetailSectionProps) {
  return (
    <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
      <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
            {title === "Tenant Profile" && <Users className="h-4 w-4 text-orange-600" />}
            {title === "Property Information" && <Home className="h-4 w-4 text-orange-600" />}
            {title === "Employment & Income" && <Briefcase className="h-4 w-4 text-orange-600" />}
            {title === "Tenancy Details" && <Building2 className="h-4 w-4 text-orange-600" />}
            {title === "References" && <Phone className="h-4 w-4 text-orange-600" />}
            {title === "Emergency Contact" && <Phone className="h-4 w-4 text-orange-600" />}
            {title === "Documents Provided" && <FileText className="h-4 w-4 text-orange-600" />}
            {title === "Message to Landlord" && <MessageSquare className="h-4 w-4 text-orange-600" />}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        {children}
      </CardContent>
    </Card>
  )
}

// ============ PAGE COMPONENT ============

export default function LandlordApplicationDetailPage() {
  const router = useRouter()
  const params = useParams()
  const { user } = useAuth()
  const applicationId = (params?.id as string) || ""

  const [application, setApplication] = useState<Application | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isApproving, setIsApproving] = useState(false)
  const [isRejecting, setIsRejecting] = useState(false)
  const [showApproveConfirm, setShowApproveConfirm] = useState(false)
  const [showRejectPanel, setShowRejectPanel] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [hasMarkedViewed, setHasMarkedViewed] = useState(false)

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/signin")
    }
  }, [user, isLoading, router])

  // Fetch application and mark as viewed
  useEffect(() => {
    const fetchApplication = async () => {
      try {
        setIsLoading(true)
        const app = await applicationsAPI.getById(applicationId)
        setApplication(app)
        // Mark as viewed on backend via the getById call
        setHasMarkedViewed(true)
      } catch (error) {
        console.error("Failed to fetch application:", error)
        toast.error("Failed to load application")
        router.push("/landlord/applications")
      } finally {
        setIsLoading(false)
      }
    }

    if (user && applicationId) {
      fetchApplication()
    }
  }, [user, applicationId, router])

  // Handle approve
  const handleApprove = async () => {
    if (!application) return

    setIsApproving(true)
    try {
      const updated = await applicationsAPI.approve(application.id)
      setApplication(updated)
      setShowApproveConfirm(false)
      toast.success(`Application approved for ${application.user?.full_name || 'tenant'}`)
    } catch (error: any) {
      console.error("Failed to approve application:", error)
      toast.error(error.response?.data?.detail || "Failed to approve application")
    } finally {
      setIsApproving(false)
    }
  }

  // Handle reject
  const handleReject = async () => {
    if (!application || !rejectionReason.trim()) return

    setIsRejecting(true)
    try {
      const updated = await applicationsAPI.reject(application.id, rejectionReason)
      setApplication(updated)
      setShowRejectPanel(false)
      setRejectionReason("")
      toast.success(`Application rejected for ${application.user?.full_name || 'tenant'}`)
    } catch (error: any) {
      console.error("Failed to reject application:", error)
      toast.error(error.response?.data?.detail || "Failed to reject application")
    } finally {
      setIsRejecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Application</h3>
              <p className="text-slate-600">Please wait while we fetch the application details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!application) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
        <div className="container mx-auto px-4 py-8 max-w-7xl">
          <div className="text-center py-20 max-w-md mx-auto">
            <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="h-8 w-8 text-orange-600" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">Application not found</h3>
            <p className="text-slate-600 mb-8">
              The application you're looking for doesn't exist or you don't have permission to view it.
            </p>
            <Link href="/landlord/applications">
              <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white px-6">
                Back to Applications
              </Button>
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const tenant = application.user
  const property = application.property
  const incomeRatio = application.monthly_income && property?.price 
    ? application.monthly_income / property.price 
    : 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Link href="/landlord/applications">
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
                Review tenant application for {property?.title || 'Property'}
              </p>
            </div>
            {getStatusBadge(application.status)}
          </div>
        </div>

        {/* Status Banner */}
        {application.status === 'pending' && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-orange-50 border border-orange-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-orange-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-orange-900">Application Under Review</p>
              <p className="text-sm text-orange-700 mt-0.5">
                This application is awaiting your decision. Please review the tenant's information and respond accordingly.
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
                You have approved this application. Contact the tenant to discuss next steps.
              </p>
            </div>
          </div>
        )}

        {application.status === 'rejected' && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-red-50 border border-red-200 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900">Application Rejected</p>
              <p className="text-sm text-red-700 mt-0.5">
                You have rejected this application. The tenant has been notified.
              </p>
            </div>
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tenant Profile Section */}
            <DetailSection title="Tenant Profile">
              <div className="flex items-start gap-6 mb-6">
                <Avatar className="h-14 w-14 flex-shrink-0 border-2 border-white shadow-md">
                  <AvatarImage src={tenant?.avatar_url || DEFAULT_AVATAR + (tenant?.id || 'unknown')} />
                  <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-lg">
                    {tenant?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900 mb-1">{tenant?.full_name}</h3>
                  <div className="flex items-center gap-4 text-sm text-slate-600 mb-3 flex-wrap">
                    <a href={`mailto:${tenant?.email}`} className="flex items-center gap-1 hover:text-orange-600 transition">
                      <Mail className="h-4 w-4" />
                      {tenant?.email}
                    </a>
                    {(tenant?.phone_number || tenant?.phone) && (
                      <a href={`tel:${tenant?.phone_number || tenant?.phone}`} className="flex items-center gap-1 hover:text-orange-600 transition">
                        <Phone className="h-4 w-4" />
                        {tenant?.phone_number || tenant?.phone}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </DetailSection>

            {/* Property Information */}
            {property && (
              <DetailSection title="Property Information">
                <div className="flex gap-6 mb-6">
                  <div className="relative flex-shrink-0">
                    <div className="w-40 h-32 rounded-xl overflow-hidden bg-slate-100 shadow-md">
                      <img
                        src={property.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                        alt={property.title}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
                    </div>
                    {property.price && (
                      <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold shadow">
                        ₦{property.price.toLocaleString()}/mo
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-slate-900 mb-1 hover:text-orange-600 transition-colors">{property.title}</h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600 mb-3">
                      <MapPin className="h-4 w-4 text-orange-500 flex-shrink-0" />
                      <span className="font-medium">{property.location}</span>
                    </div>
                    <Link href={`/properties/${property.id}`}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="border-orange-200 text-orange-700 hover:bg-orange-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View Full Listing
                      </Button>
                    </Link>
                  </div>
                </div>
                
                {/* Property Specs Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                  {property.beds && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Bedrooms</p>
                      <p className="text-xl font-bold text-slate-900">{property.beds}</p>
                    </div>
                  )}
                  {property.baths && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Bathrooms</p>
                      <p className="text-xl font-bold text-slate-900">{property.baths}</p>
                    </div>
                  )}
                  {property.property_type && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Type</p>
                      <p className="text-lg font-bold text-slate-900 capitalize">{property.property_type}</p>
                    </div>
                  )}
                  {property.sqft && (
                    <div className="text-center">
                      <p className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-1">Area</p>
                      <p className="text-lg font-bold text-slate-900">{property.sqft} sqft</p>
                    </div>
                  )}
                </div>

                {property.full_address && (
                  <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-1">Full Address</p>
                    <p className="text-sm text-slate-700">{property.full_address}</p>
                  </div>
                )}
              </DetailSection>
            )}


            {/* Employment & Income */}
            <DetailSection title="Employment & Income">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {application.employment_status && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Employment Status</p>
                    <p className="text-lg font-bold text-slate-900">{formatEmploymentStatus(application.employment_status)}</p>
                  </div>
                )}
                {application.employer_name && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Employer</p>
                    <p className="text-lg font-bold text-slate-900">{application.employer_name}</p>
                  </div>
                )}
              </div>
              {application.monthly_income && (
                <div className="mt-6 pt-6 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-3">Monthly Income vs Rent</p>
                  <p className="text-2xl font-bold text-orange-600 mb-2">{formatNGN(application.monthly_income)}</p>
                  <p className="text-sm text-slate-700 mb-3">
                    <span className="font-semibold">{formatNGN(application.monthly_income)}</span>
                    {" / "}
                    <span className="font-semibold">{formatNGN(property?.price || 0)}</span>
                    {" = "}
                    <span className={`font-bold ${
                      incomeRatio >= 3 ? 'text-emerald-600' :
                      incomeRatio >= 2 ? 'text-amber-600' : 'text-red-600'
                    }`}>
                      {incomeRatio.toFixed(1)}x monthly rent
                    </span>
                  </p>
                  <Badge className={
                    incomeRatio >= 3 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                    incomeRatio >= 2 ? 'bg-amber-100 text-amber-700 border-amber-200' :
                    'bg-red-100 text-red-700 border-red-200'
                  }>
                    {incomeRatio >= 3 ? 'Income OK' :
                     incomeRatio >= 2 ? 'Income Low' : 'Income Insufficient'}
                  </Badge>
                </div>
              )}
            </DetailSection>

            {/* Tenancy Details */}
            <DetailSection title="Tenancy Details">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {application.move_in_date && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Move-in Date</p>
                    <p className="text-slate-900 font-semibold">
                      {new Date(application.move_in_date).toLocaleDateString('en-NG', {
                        year: 'numeric', month: 'long', day: 'numeric'
                      })}
                    </p>
                  </div>
                )}
                {application.lease_duration && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Lease Duration</p>
                    <p className="text-slate-900 font-semibold">{application.lease_duration}</p>
                  </div>
                )}
                {application.number_of_occupants && (
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Number of Occupants</p>
                    <p className="text-slate-900 font-semibold">{application.number_of_occupants}</p>
                  </div>
                )}
                <div>
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Pets</p>
                  <p className="text-slate-900 font-semibold">
                    {application.has_pets ? `Yes — ${application.pet_details || 'Details provided'}` : 'No'}
                  </p>
                </div>
              </div>
            </DetailSection>

            {/* References */}
            {application.references && (Object.values(application.references).some(ref => ref)) && (
              <DetailSection title="References">
                <div className="space-y-4">
                  {application.references.reference1 && (
                    <div className="pb-4 border-b border-slate-100 last:border-b-0">
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Reference 1</p>
                      <p className="text-slate-900 font-semibold mb-1">{application.references.reference1.name}</p>
                      <a
                        href={`tel:${application.references.reference1.phone}`}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-1 block"
                      >
                        {application.references.reference1.phone}
                      </a>
                      <p className="text-slate-600 text-sm">{application.references.reference1.relationship}</p>
                    </div>
                  )}
                  {application.references.reference2 && (
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-2">Reference 2</p>
                      <p className="text-slate-900 font-semibold mb-1">{application.references.reference2.name}</p>
                      <a
                        href={`tel:${application.references.reference2.phone}`}
                        className="text-orange-600 hover:text-orange-700 text-sm font-medium mb-1 block"
                      >
                        {application.references.reference2.phone}
                      </a>
                      <p className="text-slate-600 text-sm">{application.references.reference2.relationship}</p>
                    </div>
                  )}
                </div>
              </DetailSection>
            )}

            {/* Emergency Contact */}
            {application.emergency_contact_name && (
              <DetailSection title="Emergency Contact">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Name</p>
                    <p className="text-slate-900 font-semibold">{application.emergency_contact_name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Phone</p>
                    <a
                      href={`tel:${application.emergency_contact_phone}`}
                      className="text-orange-600 hover:text-orange-700 text-sm font-semibold"
                    >
                      {application.emergency_contact_phone}
                    </a>
                  </div>
                </div>
              </DetailSection>
            )}

            {/* Documents */}
            {application.documents && application.documents.length > 0 && (
              <DetailSection title="Documents Provided">
                <div className="flex flex-wrap gap-2">
                  {application.documents.map((url, idx) => {
                    const filename = url.split('/').pop() || `Document ${idx + 1}`
                    return (
                      <a
                        key={idx}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                      >
                        <Download className="h-3.5 w-3.5 text-slate-500" />
                        <span className="text-xs text-slate-600 truncate max-w-[150px]">{filename}</span>
                      </a>
                    )
                  })}
                </div>
              </DetailSection>
            )}

            {/* Message */}
            {application.message && (
              <DetailSection title="Message to Landlord">
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                  <p className="text-blue-800 italic">"{application.message}"</p>
                </div>
              </DetailSection>
            )}
          </div>

          {/* RIGHT COLUMN - Application Review Panel */}
          <div className="lg:col-span-1 space-y-6">
            {/* Combined Application Review Card */}
            <Card className={`border-orange-200 bg-white/80 backdrop-blur-sm sticky top-24 ${getPriorityBorder(application.status)}`}>
              <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-white to-orange-50/20">
                <CardTitle className="flex items-center gap-2 text-slate-900">
                  <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-orange-600" />
                  </div>
                  Application Review
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                
                {/* Property Summary */}
                <div className="pb-6 border-b border-slate-100">
                  <div className="flex gap-4 mb-4">
                    <div className="w-20 h-16 rounded-lg overflow-hidden bg-slate-100 flex-shrink-0">
                      <img
                        src={property?.images?.[0] || DEFAULT_PROPERTY_IMAGE}
                        alt={property?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-slate-900 text-sm truncate">{property?.title}</h4>
                      <p className="text-xs text-slate-500 mb-2">{property?.location}</p>
                      <p className="text-lg font-bold text-orange-600">
                        {property?.price ? `₦${property.price.toLocaleString()}/month` : 'Price TBD'}
                      </p>
                    </div>
                  </div>
                  <Link href={`/properties/${property?.id}`}>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-orange-200 text-orange-600 hover:bg-orange-50"
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      View Full Property
                    </Button>
                  </Link>
                </div>

                {/* Application Status */}
                <div className="pb-6 border-b border-slate-100">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm font-semibold text-slate-700">Status</span>
                    {getStatusBadge(application.status)}
                  </div>
                  <div className="space-y-2 text-xs text-slate-600">
                    <p>
                      <strong>Applied:</strong> {new Date(application.created_at).toLocaleDateString('en-NG')}
                    </p>
                    {application.viewing_id && (
                      <p className="flex items-center gap-2 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Viewing scheduled
                      </p>
                    )}
                  </div>
                </div>

                {/* Tenant Quick Info */}
                <div className="pb-6 border-b border-slate-100">
                  <h4 className="text-sm font-semibold text-slate-700 mb-3">Tenant Information</h4>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                      <AvatarImage src={tenant?.avatar_url || DEFAULT_AVATAR + (tenant?.id || 'unknown')} />
                      <AvatarFallback className="bg-gradient-to-br from-orange-400 to-orange-600 text-white text-sm">
                        {tenant?.full_name?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'T'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-slate-900 text-sm truncate">{tenant?.full_name}</p>
                      <div className="flex items-center gap-2 text-xs text-slate-600">
                        <Mail className="h-3 w-3" />
                        <span className="truncate">{tenant?.email}</span>
                      </div>
                    </div>
                  </div>
                  {application.monthly_income && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-600">Monthly Income</span>
                      <span className="font-semibold text-slate-900">{formatNGN(application.monthly_income)}</span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {application.status === 'pending' && (
                  <div>
                    <div className="text-xs font-semibold text-orange-600 uppercase tracking-wider mb-4 bg-orange-50 px-3 py-1.5 rounded-lg text-center">
                      🏠 Action Required
                    </div>

                    {!showApproveConfirm && !showRejectPanel ? (
                      <div className="space-y-3">
                        {/* Approve Button */}
                        <Button
                          onClick={() => setShowApproveConfirm(true)}
                          className="w-full h-12 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-xl hover:shadow-lg transition-shadow flex items-center justify-center gap-2"
                        >
                          <CheckCircle2 className="h-5 w-5" />
                          Approve Application
                        </Button>

                        {/* Reject Button */}
                        <Button
                          onClick={() => setShowRejectPanel(true)}
                          variant="outline"
                          className="w-full h-11 border-2 border-red-200 text-red-600 hover:bg-red-50 font-semibold rounded-xl flex items-center justify-center gap-2"
                        >
                          <X className="h-5 w-5" />
                          Reject Application
                        </Button>
                      </div>
                    ) : null}

                    {/* Approve Confirmation Panel */}
                    {showApproveConfirm && (
                      <div className="space-y-3 p-4 bg-emerald-50 border-2 border-emerald-200 rounded-xl">
                        <p className="text-sm font-semibold text-emerald-900">
                          Approve {tenant?.full_name || 'tenant'}?
                        </p>
                        <p className="text-xs text-emerald-700">
                          This will mark their application as approved.
                        </p>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleApprove}
                            disabled={isApproving}
                            className="flex-1 h-10 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-semibold rounded-lg hover:shadow-md transition-shadow"
                          >
                            {isApproving ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Confirming...
                              </>
                            ) : (
                              'Confirm Approval'
                            )}
                          </Button>
                          <Button
                            onClick={() => setShowApproveConfirm(false)}
                            disabled={isApproving}
                            variant="ghost"
                            className="flex-1 h-10 text-emerald-700 hover:bg-emerald-100"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Reject Panel */}
                    {showRejectPanel && (
                      <div className="space-y-3 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <label className="text-xs text-red-600 font-semibold uppercase tracking-wider">
                          Reason for rejection (required)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          placeholder="e.g. Income below requirement, Too many occupants, Dates don't align..."
                          className="w-full h-24 p-3 border border-red-200 rounded-xl focus:outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 text-sm text-slate-900 resize-none"
                        />
                        <div className="text-xs text-slate-500 text-right">
                          {rejectionReason.length}/500
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleReject}
                            disabled={isRejecting || rejectionReason.length < 10}
                            className="flex-1 h-10 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:shadow-md transition-shadow disabled:opacity-50"
                          >
                            {isRejecting ? (
                              <>
                                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                Rejecting...
                              </>
                            ) : (
                              'Confirm Rejection'
                            )}
                          </Button>
                          <Button
                            onClick={() => {
                              setShowRejectPanel(false)
                              setRejectionReason("")
                            }}
                            disabled={isRejecting}
                            variant="ghost"
                            className="flex-1 h-10 text-red-700 hover:bg-red-100"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Read-only status for approved/rejected */}
                {(application.status === 'approved' || application.status === 'rejected') && (
                  <div>
                    <div className="text-center mb-4">
                      {getStatusBadge(application.status)}
                    </div>
                    {application.status === 'rejected' && application.message && (
                      <div className="p-3 bg-red-50 border border-red-100 rounded-lg">
                        <p className="text-xs font-semibold text-red-600 mb-1">Rejection Reason:</p>
                        <p className="text-sm text-red-800">{application.message}</p>
                      </div>
                    )}
                    {application.status === 'approved' && (
                      <div className="space-y-4">
                        {/* Success Message */}
                        <Card className="border-emerald-200 bg-gradient-to-br from-emerald-50 via-green-50 to-emerald-50">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                                <CheckCircle className="h-6 w-6 text-emerald-600" />
                              </div>
                              <div className="flex-1">
                                <h3 className="font-bold text-emerald-900 text-lg mb-1">Application Approved! 🎉</h3>
                                <p className="text-sm text-emerald-700">
                                  You've successfully approved {application?.user?.full_name}'s rental application for <strong>{application?.property?.title}</strong>.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* What Happens Next */}
                        <Card className="border-blue-200">
                          <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-100/30 border-b border-blue-100">
                            <CardTitle className="flex items-center gap-2 text-blue-900">
                              <Clock className="h-5 w-5 text-blue-600" />
                              What Happens Next
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-4">
                              {/* Step 1 */}
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">1</span>
                                  </div>
                                </div>
                                <div className="flex-1 pt-1">
                                  <p className="font-semibold text-slate-900 mb-1">Rental Agreement Generated</p>
                                  <p className="text-sm text-slate-600">
                                    A standard Nigerian rental agreement has been automatically created with lease terms, rent amounts, and deposit details.
                                  </p>
                                </div>
                              </div>

                              {/* Step 2 */}
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">2</span>
                                  </div>
                                </div>
                                <div className="flex-1 pt-1">
                                  <p className="font-semibold text-slate-900 mb-1">Tenant Reviews & Signs</p>
                                  <p className="text-sm text-slate-600">
                                    The tenant will receive a notification and can review the agreement in their dashboard. They'll sign digitally first.
                                  </p>
                                </div>
                              </div>

                              {/* Step 3 */}
                              <div className="flex gap-4">
                                <div className="flex-shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                                    <span className="text-sm font-bold text-blue-600">3</span>
                                  </div>
                                </div>
                                <div className="flex-1 pt-1">
                                  <p className="font-semibold text-slate-900 mb-1">Your Turn to Sign</p>
                                  <p className="text-sm text-slate-600">
                                    Once the tenant signs, you'll receive a notification to review and sign the agreement in your agreements dashboard.
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
                                <div className="flex-1 pt-1">
                                  <p className="font-semibold text-slate-900 mb-1">Agreement Activated</p>
                                  <p className="text-sm text-slate-600">
                                    Both signatures complete the agreement. The lease officially begins on the agreed start date.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="border-orange-200 bg-orange-50">
                          <CardHeader className="bg-gradient-to-r from-orange-100 to-orange-50 border-b border-orange-100">
                            <CardTitle className="text-orange-900 text-base">Quick Actions</CardTitle>
                          </CardHeader>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <Button 
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white h-10"
                                onClick={() => router.push(`/landlord/agreements`)}
                              >
                                <FileText className="h-4 w-4 mr-2" />
                                View Generated Agreement
                              </Button>
                              <Button 
                                variant="outline"
                                className="w-full border-orange-200 text-orange-700 hover:bg-orange-50 h-10"
                                onClick={() => router.push(`/landlord/applications`)}
                              >
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Applications
                              </Button>
                            </div>
                          </CardContent>
                        </Card>

                        {/* Timeline Estimate */}
                        <Card className="border-slate-200">
                          <CardContent className="pt-6">
                            <div className="flex items-start gap-3 text-sm">
                              <AlertCircle className="h-4 w-4 text-slate-500 flex-shrink-0 mt-0.5" />
                              <div>
                                <p className="font-semibold text-slate-900 mb-1">Typical Timeline</p>
                                <p className="text-slate-600">
                                  Tenants typically sign within 24 hours. The full agreement process is usually complete within 48 hours.
                                </p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    )}
                  </div>
                )}

              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
