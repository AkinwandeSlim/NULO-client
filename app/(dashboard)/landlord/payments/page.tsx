"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  ArrowLeft, Banknote, Calendar, Home, FileText, Eye, Mail,
  Loader2, AlertCircle, CheckCircle2, Clock, RefreshCw, User
} from "lucide-react"
import Link from "next/link"
import { paymentsAPI, type Transaction } from "@/lib/api/payments"
import { getPropertyById } from "@/lib/api/propertyVerification"
import { toast } from "sonner"
import { formatNGN, calculateRentalBreakdown, parsePaymentBreakdown } from "@/lib/utils/rentalCalculations"

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed="

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString("en-NG", {
    day: "numeric", month: "short", year: "numeric",
  })
}

const getTransactionTypeBadge = (type: Transaction["transaction_type"]) => {
  switch (type) {
    case "rent_payment":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <Banknote className="w-3 h-3 mr-1" />
          Rent Payment
        </Badge>
      )
    case "security_deposit":
      return (
        <Badge className="bg-blue-100 text-blue-700 border-blue-200">
          <Banknote className="w-3 h-3 mr-1" />
          Security Deposit
        </Badge>
      )
    case "guarantee_contribution":
      return (
        <Badge className="bg-purple-100 text-purple-700 border-purple-200">
          <Banknote className="w-3 h-3 mr-1" />
          Guarantee Fee
        </Badge>
      )
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          <Banknote className="w-3 h-3 mr-1" />
          Other
        </Badge>
      )
  }
}

const getStatusBadge = (status: Transaction["status"]) => {
  switch (status) {
    case "released":
      return (
        <Badge className="bg-green-100 text-green-700 border-green-200">
          <CheckCircle2 className="w-3 h-3 mr-1" />
          Received
        </Badge>
      )
    case "pending":
    case "held":
      return (
        <Badge className="bg-amber-100 text-amber-700 border-amber-200">
          <Clock className="w-3 h-3 mr-1" />
          Processing
        </Badge>
      )
    case "failed":
      return (
        <Badge className="bg-red-100 text-red-700 border-red-200">
          <AlertCircle className="w-3 h-3 mr-1" />
          Failed
        </Badge>
      )
    case "refunded":
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          <RefreshCw className="w-3 h-3 mr-1" />
          Refunded
        </Badge>
      )
    default:
      return (
        <Badge className="bg-slate-100 text-slate-700 border-slate-200">
          Unknown
        </Badge>
      )
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Breakdown Component
// ─────────────────────────────────────────────────────────────────────────────

interface PaymentBreakdownProps {
  transaction: Transaction
  property?: Transaction['property']
}

function PaymentBreakdown({ transaction, property }: PaymentBreakdownProps) {
  const [propertyDetails, setPropertyDetails] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(false)
  
  // Fetch property details to get actual price
  useEffect(() => {
    const fetchPropertyDetails = async () => {
      if (transaction.property_id && !(property as any)?.price) {
        setIsLoading(true)
        try {
          const details = await getPropertyById(transaction.property_id)
          setPropertyDetails(details)
        } catch (error) {
          console.warn('Failed to fetch property details:', error)
        } finally {
          setIsLoading(false)
        }
      }
    }
    
    fetchPropertyDetails()
  }, [transaction.property_id, (property as any)?.price])
  
  // Use centralized breakdown from notes first, then property price
  const breakdown = parsePaymentBreakdown(transaction)
  const monthlyRent = breakdown?.monthly_rent || (property as any)?.price || propertyDetails?.price || 0
  const annualRent = breakdown?.annual_rent || (monthlyRent * 12)
  const cautionFee = breakdown?.security_deposit || (monthlyRent * 2)
  const platformFee = breakdown?.platform_fee || 0
          const totalPaid = transaction.amount
  const isRentPayment = transaction.transaction_type === "rent_payment"
  const isSecurityDeposit = transaction.transaction_type === "security_deposit"
  const isGuarantee = transaction.transaction_type === "guarantee_contribution"
  
  if (isLoading) {
    return (
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <div className="flex items-center justify-center py-2">
          <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
          <span className="text-xs text-slate-500 ml-2">Loading property details...</span>
        </div>
      </div>
    )
  }
  
  if (isRentPayment && breakdown) {
    // Show detailed breakdown from notes
    return (
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-2">PAYMENT BREAKDOWN</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Monthly Rent:</span>
            <span className="font-semibold">{formatNGN(monthlyRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Annual Rent (×12):</span>
            <span className="font-semibold text-green-700">{formatNGN(annualRent)}</span>
          </div>
          {cautionFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Caution Fee:</span>
              <span className="font-semibold text-blue-700">{formatNGN(cautionFee)}</span>
            </div>
          )}
          {platformFee > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Platform Fee:</span>
              <span className="font-semibold text-purple-700">{formatNGN(platformFee)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-300">
            <span className="text-slate-900">Total Paid:</span>
            <span className="text-green-700">{formatNGN(totalPaid)}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Complete move-in payment
          </div>
        </div>
      </div>
    )
  }
  
  if (isRentPayment) {
    // Annual rent payment - show breakdown
    return (
      <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
        <p className="text-xs font-semibold text-slate-600 mb-2">PAYMENT BREAKDOWN</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Monthly Rent:</span>
            <span className="font-semibold">{formatNGN(monthlyRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Annual Rent (×12):</span>
            <span className="font-semibold text-green-700">{formatNGN(annualRent)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-300">
            <span className="text-slate-900">Total Paid:</span>
            <span className="text-green-700">{formatNGN(totalPaid)}</span>
          </div>
          <div className="text-xs text-slate-500 mt-2">
            {monthlyRent > 0 ? (
              totalPaid === annualRent ? 
                "Annual rent payment (12 months)" : 
                totalPaid > annualRent ? 
                  `Annual rent + caution fee (${Math.round((totalPaid - annualRent) / monthlyRent)} additional months)` :
                  `${Math.round(totalPaid / monthlyRent)} months of rent`
            ) : 'Monthly rent not available'}
          </div>
        </div>
      </div>
    )
  }
  
  if (isSecurityDeposit) {
    // Security deposit payment (Caution Fee)
    return (
      <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
        <p className="text-xs font-semibold text-blue-600 mb-2">CAUTION FEE BREAKDOWN</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Monthly Rent:</span>
            <span className="font-semibold">{formatNGN(monthlyRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Caution Fee:</span>
            <span className="font-semibold text-blue-700">2 Months Rent</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-300">
            <span className="text-slate-900">Deposit Amount:</span>
            <span className="text-blue-700">{formatNGN(totalPaid)}</span>
          </div>
          <div className="text-xs text-blue-600 mt-2">
            Held in escrow until lease completion
          </div>
        </div>
      </div>
    )
  }
  
  if (isGuarantee) {
    // Guarantee contribution
    return (
      <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
        <p className="text-xs font-semibold text-purple-600 mb-2">PLATFORM FEE BREAKDOWN</p>
        <div className="space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Monthly Rent:</span>
            <span className="font-semibold">{formatNGN(monthlyRent)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-600">Platform Fee:</span>
            <span className="font-semibold text-purple-700">{formatNGN(totalPaid)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold pt-2 border-t border-slate-300">
            <span className="text-slate-900">Fee Amount:</span>
            <span className="text-purple-700">{formatNGN(totalPaid)}</span>
          </div>
          <div className="text-xs text-purple-600 mt-2">
            One-time service fee for rental guarantee
          </div>
        </div>
      </div>
    )
  }
  
  // Other payment types
  return (
    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
      <p className="text-xs font-semibold text-slate-600 mb-2">PAYMENT DETAILS</p>
      <div className="space-y-1">
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Amount Paid:</span>
          <span className="font-semibold">{formatNGN(totalPaid)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-600">Type:</span>
          <span className="font-semibold">{transaction.transaction_type?.replace("_", " ") || "Other"}</span>
        </div>
      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// TransactionCard Component (Rule 22)
// ─────────────────────────────────────────────────────────────────────────────

interface TransactionCardProps {
  transaction: Transaction
  onViewDetails: (id: string) => void
  onMessageTenant: (tenantId: string, tenantName: string) => void
}

function TransactionCard({ transaction, onViewDetails, onMessageTenant }: TransactionCardProps) {
  return (
    <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
      <CardContent className="p-5">
        <div className="flex items-start gap-4 mb-4">
          {/* Tenant Avatar */}
          <Avatar className="w-12 h-12 flex-shrink-0">
            <AvatarImage 
              src={transaction.tenant?.avatar_url ?? `${DEFAULT_AVATAR}${transaction.tenant_id}`} 
            />
            <AvatarFallback className="bg-orange-200 text-orange-800 font-bold">
              {transaction.tenant?.full_name?.[0] ?? "T"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              {getTransactionTypeBadge(transaction.transaction_type)}
              {getStatusBadge(transaction.status)}
              <span className="text-xs text-slate-500">
                {formatDate(transaction.created_at)}
              </span>
            </div>
            <h3 className="font-semibold text-slate-900 mb-1 truncate">
              {transaction.property?.title || "Property Payment"}
            </h3>
            <p className="text-sm text-slate-600 mb-2">
              Tenant: {transaction.tenant?.full_name || "Unknown"}
            </p>
            {transaction.property?.city && (
              <p className="text-sm text-slate-600">
                {transaction.property.city}
                {transaction.property.state && `, ${transaction.property.state}`}
              </p>
            )}
          </div>

          <div className="text-right flex-shrink-0">
            <p className="text-xl font-bold text-slate-900">
              {formatNGN(transaction.amount)}
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {transaction.transaction_type === "rent_payment" ? "Annual Rent" : 
               transaction.transaction_type === "security_deposit" ? "Security Deposit" : 
               transaction.transaction_type.replace("_", " ")}
            </p>
          </div>
        </div>

        {/* Payment Breakdown */}
        <div className="mb-4">
          <PaymentBreakdown transaction={transaction} property={transaction.property} />
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <FileText className="w-3 h-3" />
            <span className="font-mono">{transaction.paystack_ref}</span>
          </div>
          <div className="flex items-center gap-2">
            {transaction.status === "released" && transaction.tenant && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onMessageTenant(transaction.tenant_id, transaction.tenant!.full_name)}
                className="border-green-200 text-green-700 hover:bg-green-50"
              >
                <Mail className="w-3 h-3 mr-1" />
                Message
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewDetails(transaction.id)}
              className="border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <Eye className="w-3 h-3 mr-1" />
              View Details
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Main page
// ─────────────────────────────────────────────────────────────────────────────

export default function LandlordPaymentsPage() {
  const router = useRouter()
  const { user } = useAuth()

  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  // ── Fetch payments ─────────────────────────────────────────────────────────

  const fetchPayments = useCallback(async () => {
    try {
      const response = await paymentsAPI.getReceivedPayments()
      
      if (response.success && response.payments) {
        setTransactions(response.payments)
      } else {
        toast.error(response.error ?? "Failed to load payment history")
      }
    } catch (error) {
      console.error("[LandlordPayments] fetch error:", error)
      toast.error("Failed to load payment history")
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!user) { router.push("/signin"); return }
    fetchPayments()
  }, [user, fetchPayments, router])

  // ── Refresh payments ───────────────────────────────────────────────────────

  const handleRefresh = async () => {
    setIsRefreshing(true)
    await fetchPayments()
    setIsRefreshing(false)
  }

  // ── View transaction details ───────────────────────────────────────────────

  const handleViewDetails = (transactionId: string) => {
    router.push(`/landlord/payments/${transactionId}`)
  }

  // ── Message tenant ───────────────────────────────────────────────────────────

  const handleMessageTenant = (tenantId: string, tenantName: string) => {
    router.push(`/landlord/messages?tenant=${tenantId}`)
  }

  // ── Calculate stats ─────────────────────────────────────────────────────────

  // Debug: Log transactions to understand the data structure
  console.log('🔍 [PAYMENTS] All transactions:', transactions.map(t => ({
    id: t.id,
    amount: t.amount,
    type: t.transaction_type,
    status: t.status,
    property_id: t.property_id,
    breakdown: parsePaymentBreakdown(t)
  })))

  // Calculate totals by parsing breakdown from notes
  let totalRentAmount = 0
  let totalSecurityDeposits = 0
  let totalPlatformFees = 0

  transactions.forEach(t => {
    if (t.status === "released") {
      const breakdown = parsePaymentBreakdown(t)
      if (breakdown) {
        // Use breakdown amounts if available
        totalRentAmount += breakdown.annual_rent || 0
        totalSecurityDeposits += breakdown.security_deposit || 0
        totalPlatformFees += breakdown.platform_fee || 0
      } else {
        // Fallback to transaction type filtering
        if (t.transaction_type === "rent_payment") {
          totalRentAmount += t.amount
        } else if (t.transaction_type === "security_deposit") {
          totalSecurityDeposits += t.amount
        } else if (t.transaction_type === "guarantee_contribution") {
          totalPlatformFees += t.amount
        }
      }
    }
  })

  const stats = {
    total: transactions.length,
    received: transactions.filter(t => t.status === "released").length,
    processing: transactions.filter(t => t.status === "pending" || t.status === "held").length,
    failed: transactions.filter(t => t.status === "failed").length,
    totalRentAmount,
    totalSecurityDeposits,
    totalGuaranteeFees: totalPlatformFees,
    totalAmount: totalRentAmount + totalSecurityDeposits + totalPlatformFees
  }

  // Debug: Log calculated stats
  console.log('🔍 [PAYMENTS] Calculated stats:', {
    rentAmount: stats.totalRentAmount,
    securityDeposits: stats.totalSecurityDeposits,
    platformFees: stats.totalGuaranteeFees,
    total: stats.totalAmount
  })

  // ─────────────────────────────────────────────────────────────────────────
  // Loading
  // ─────────────────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
        <div className="max-w-7xl mx-auto flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="w-20 h-20 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Loading Payment History</h3>
            <p className="text-slate-600">Fetching your payment records...</p>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Main render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">

        {/* ── Header ── */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
              Received Payments
            </h1>
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Link href="/landlord">
                <Button variant="ghost" size="sm" className="text-slate-600 hover:text-slate-900">
                  <Home className="w-4 h-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
            </div>
          </div>
          <p className="text-slate-600">
            Track all rental payments and security deposits received from your tenants. Annual rent payments are shown as received when tenants complete their payments.
          </p>
        </div>

        {/* ── Stats Cards ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card className="border-green-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Rent Collected</p>
                  <p className="text-2xl font-bold text-green-700 mt-1">{formatNGN(stats.totalRentAmount)}</p>
                  <p className="text-xs text-green-600 mt-1">Annual rent payments (12 months)</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-blue-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Caution Fees</p>
                  <p className="text-2xl font-bold text-blue-700 mt-1">{formatNGN(stats.totalSecurityDeposits)}</p>
                  <p className="text-xs text-blue-600 mt-1">Security deposits (2 months rent)</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Guarantee Fees</p>
                  <p className="text-2xl font-bold text-purple-700 mt-1">{formatNGN(stats.totalGuaranteeFees)}</p>
                  <p className="text-xs text-purple-600 mt-1">Service fees collected</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Banknote className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-amber-200 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300">
            <CardContent className="pt-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Processing</p>
                  <p className="text-2xl font-bold text-amber-700 mt-1">{stats.processing}</p>
                  <p className="text-xs text-amber-600 mt-1">Pending payments</p>
                </div>
                <div className="w-12 h-12 bg-amber-100 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* ── Transactions List ── */}
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg font-semibold text-slate-800">
              <Banknote className="h-5 w-5 text-orange-500" />
              Payment History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12">
                <Banknote className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Payments Received</h3>
                <p className="text-slate-500 mb-6">
                  You haven't received any rental payments yet. Once tenants complete their payments, they will appear here.
                </p>
                <Link href="/landlord/agreements">
                  <Button className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white">
                    <FileText className="mr-2 h-4 w-4" />
                    View Agreements
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-4">
                {transactions.map((transaction) => (
                  <TransactionCard
                    key={transaction.id}
                    transaction={transaction}
                    onViewDetails={handleViewDetails}
                    onMessageTenant={handleMessageTenant}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
