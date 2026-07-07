"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "sonner"
import {
  ArrowLeft, RefreshCw, Search, TrendingUp, Wallet, Activity,
  ChevronLeft, ChevronRight, Building2, Hash,
} from "lucide-react"
import adminTransactionsAPI, { Transaction } from "@/lib/api/adminTransactions"

type TransactionType = "account" | "virtual" | "bank"

export default function AdminTransactionsPage() {
  const [transactionType, setTransactionType] = useState<TransactionType>("account")
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [virtualAccount, setVirtualAccount] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const fetchTransactions = async () => {
    setIsLoading(true)
    setError(null)
    
    try {
      let response
      
      if (transactionType === "account") {
        response = await adminTransactionsAPI.getAccountTransactions({
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: 50,
          page,
        })
      } else if (transactionType === "virtual") {
        if (!virtualAccount) {
          setError("Virtual account number is required")
          setIsLoading(false)
          return
        }
        response = await adminTransactionsAPI.getVirtualAccountTransactions(virtualAccount, {
          dateFrom: dateFrom || undefined,
          dateTo: dateTo || undefined,
          limit: 50,
          page,
        })
      } else {
        response = await adminTransactionsAPI.getBankTransactions({
          limit: 50,
          page,
        })
      }
      
      if (response.success && response.data) {
        setTransactions(response.data.content || [])
        setTotalPages(response.data.pageable?.totalPages || 1)
      } else {
        setError(response.error || "Failed to fetch transactions")
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch transactions")
      toast.error("Failed to fetch transactions")
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [transactionType, page])

  const handleRefresh = () => {
    setPage(1)
    fetchTransactions()
  }

  const formatAmount = (amount: number) => {
    return `₦${Number(amount).toLocaleString("en-NG")}`
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase()
    if (statusLower === "success" || statusLower === "completed") {
      return "bg-green-100 text-green-700 border-green-200"
    }
    if (statusLower === "pending" || statusLower === "processing") {
      return "bg-amber-100 text-amber-700 border-amber-200"
    }
    if (statusLower === "failed" || statusLower === "error") {
      return "bg-red-100 text-red-700 border-red-200"
    }
    return "bg-slate-100 text-slate-700 border-slate-200"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900 -ml-2">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Admin Dashboard
            </Button>
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-2">
                Transaction Monitoring
              </h1>
              <p className="text-slate-600">Monitor Nomba transactions for reconciliation and debugging</p>
            </div>
            <Button onClick={handleRefresh} disabled={isLoading} variant="outline" size="sm"
              className="text-orange-700 border-orange-200 hover:bg-orange-50">
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="border-orange-200 bg-white/90 shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label htmlFor="transactionType">Transaction Type</Label>
                <Select value={transactionType} onValueChange={(value: TransactionType) => {
                  setTransactionType(value)
                  setPage(1)
                }}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="account">Account Transactions</SelectItem>
                    <SelectItem value="virtual">Virtual Account (NUBAN)</SelectItem>
                    <SelectItem value="bank">Bank Transactions</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {transactionType === "virtual" && (
                <div>
                  <Label htmlFor="virtualAccount">Virtual Account (NUBAN)</Label>
                  <Input
                    id="virtualAccount"
                    placeholder="e.g., 9988776655"
                    value={virtualAccount}
                    onChange={(e) => setVirtualAccount(e.target.value)}
                  />
                </div>
              )}

              <div>
                <Label htmlFor="dateFrom">Date From</Label>
                <Input
                  id="dateFrom"
                  type="datetime-local"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                />
              </div>

              <div>
                <Label htmlFor="dateTo">Date To</Label>
                <Input
                  id="dateTo"
                  type="datetime-local"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                />
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <Button onClick={handleRefresh} disabled={isLoading} className="bg-orange-500 hover:bg-orange-600">
                <Search className="w-4 h-4 mr-2" />
                Search
              </Button>
              <Button onClick={() => {
                setVirtualAccount("")
                setDateFrom("")
                setDateTo("")
                setPage(1)
                fetchTransactions()
              }} variant="outline">
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Table */}
        <Card className="border-orange-200 bg-white/90 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-600" />
              Transactions
              {transactions.length > 0 && (
                <Badge variant="outline" className="ml-2">
                  {transactions.length} records
                </Badge>
              )}
            </CardTitle>
            <CardDescription>
              {transactionType === "account" && "All transactions on the parent Nomba account"}
              {transactionType === "virtual" && `Transactions for virtual account ${virtualAccount}`}
              {transactionType === "bank" && "Credit/debit bank transactions"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <div className="p-4 rounded-lg bg-red-50 border border-red-200 mb-4">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : transactions.length === 0 ? (
              <div className="py-12 text-center">
                <Wallet className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                <p className="text-slate-600 mb-2">No transactions found</p>
                <p className="text-sm text-slate-400">Try adjusting your filters or refresh the data</p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50">
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Amount
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Type
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Reference
                        </th>
                        <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                          Description
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {transactions.map((tx, index) => (
                        <tr key={index} className="hover:bg-orange-50/40 transition-colors">
                          <td className="py-3 px-4 text-sm text-slate-600 whitespace-nowrap">
                            {formatDate(tx.createdAt)}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-bold text-slate-900">
                              {formatAmount(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <Badge variant="outline" className="text-xs">
                              {tx.type || "N/A"}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            <Badge className={getStatusColor(tx.status)}>
                              {tx.status}
                            </Badge>
                          </td>
                          <td className="py-3 px-4">
                            {tx.transactionRef ? (
                              <div className="flex items-center gap-1 text-xs text-slate-400 font-mono">
                                <Hash className="w-3 h-3" />
                                <span>{tx.transactionRef.slice(0, 12)}...</span>
                              </div>
                            ) : (
                              <span className="text-slate-300 text-xs">—</span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                            {tx.description || "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 mt-4">
                    <p className="text-xs text-slate-500">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="h-7 w-7 p-0 border-slate-200"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                      </Button>
                      <span className="text-sm text-slate-600 px-2">{page}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="h-7 w-7 p-0 border-slate-200"
                      >
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
