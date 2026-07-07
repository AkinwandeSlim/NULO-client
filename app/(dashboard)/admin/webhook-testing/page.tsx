"use client"

/**
 * Admin: Webhook testing -- Nomba flow
 * =====================================
 * Replaces the Paystack webhook testing tool. For the Nomba flow,
 * webhook simulation happens via the backend script:
 *   server/scripts/simulate_live_webhook.py
 *
 * This page is a small admin tool that:
 *   1. Surfaces the live webhook URL & secret (admin-only)
 *   2. Runs a server-side simulator (calls the same code path as
 *      server/scripts/simulate_live_webhook.py via a new
 *      /api/v1/nomba/admin/simulate-webhook endpoint -- added in Phase 1)
 *   3. Shows the recent webhook log (in-memory, server-side)
 *
 * The legacy Paystack webhook testing page is preserved at
 * page-backup.tsx.
 */

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Loader2, Send, Webhook, Terminal, FileText } from "lucide-react"
import { toast } from "sonner"
import apiClient from "@/lib/api/client"

interface WebhookLogEntry {
  timestamp: string
  event_type: string
  account_ref: string
  amount: number
  result: "FULL_PAYMENT" | "UNDERPAYMENT" | "OVERPAYMENT" | "ERROR"
  signature_valid: boolean
  message: string
}

export default function WebhookTestingPage() {
  const [accountRef, setAccountRef] = useState("")
  const [amount, setAmount] = useState("100")
  const [isSimulating, setIsSimulating] = useState(false)
  const [logs, setLogs] = useState<WebhookLogEntry[]>([])
  const [webhookUrl, setWebhookUrl] = useState<string>("")

  useEffect(() => {
    // Pull the live webhook URL for the configured environment
    apiClient.get("/health/nomba")
      .then((res) => {
        setWebhookUrl(res.data?.webhook_url ?? "Not configured")
      })
      .catch(() => setWebhookUrl("Not configured"))
  }, [])

  const handleSimulate = async () => {
    if (!accountRef) {
      toast.error("Account ref is required (use the agreement UUID with -SUB suffix)")
      return
    }
    if (!amount || isNaN(Number(amount))) {
      toast.error("Amount must be a number")
      return
    }
    try {
      setIsSimulating(true)
      const { data } = await apiClient.post("/nomba/admin/simulate-webhook", {
        account_ref: accountRef,
        amount_ngn: Number(amount),
      })
      toast.success("Simulated webhook — check server logs")
      if (data?.log) {
        setLogs((prev) => [data.log, ...prev].slice(0, 50))
      }
    } catch (error: any) {
      console.error("[AdminWebhookTest] simulate error:", error)
      toast.error(error?.response?.data?.detail ?? "Simulation failed")
    } finally {
      setIsSimulating(false)
    }
  }

  const handleFetchLogs = async () => {
    try {
      const { data } = await apiClient.get("/nomba/admin/webhook-log")
      setLogs(data?.logs ?? [])
    } catch (error) {
      console.error("[AdminWebhookTest] fetch logs error:", error)
      toast.error("Failed to fetch logs")
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50 p-6">
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent">
            Webhook Testing (Nomba)
          </h1>
          <p className="text-slate-600 mt-1">
            Simulate inbound NUBAN transfers against a real or sandbox VA.
          </p>
        </div>

        {/* Webhook URL card */}
        <Card className="border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-orange-600" />
              Live Webhook URL
            </CardTitle>
          </CardHeader>
          <CardContent>
            <code className="block text-sm font-mono text-slate-900 p-3 bg-slate-50 rounded border border-slate-200">
              {webhookUrl || "Loading…"}
            </code>
            <p className="text-xs text-slate-500 mt-2">
              This is the URL Nomba POSTs inbound payment notifications to. The
              signed payload is verified with the shared secret in
              <code className="ml-1">NOMBA_WEBHOOK_SECRET</code>.
            </p>
          </CardContent>
        </Card>

        {/* Simulator form */}
        <Card className="border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600" />
              Simulate Inbound Transfer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Account Ref (use full UUID with -SUB suffix)
                </label>
                <input
                  type="text"
                  value={accountRef}
                  onChange={(e) => setAccountRef(e.target.value)}
                  placeholder="e.g. 8b565c14-79f7-4b0d-b84f-19cfbb2b18e8-SUB"
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm font-mono focus:outline-none focus:border-orange-500"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  Amount (NGN)
                </label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-300 rounded-md text-sm focus:outline-none focus:border-orange-500"
                />
              </div>
              <Button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="bg-orange-500 hover:bg-orange-600 text-white"
              >
                {isSimulating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Simulating…
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Simulate Webhook
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4 p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-start gap-2">
              <Terminal className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium text-slate-700 mb-1">CLI alternative</p>
                <code className="block font-mono">
                  python server/scripts/simulate_live_webhook.py
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logs */}
        <Card className="border-orange-200 bg-white/90 backdrop-blur-sm shadow-sm">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-orange-600" />
                Recent Webhook Events
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={handleFetchLogs}
                className="border-orange-200 text-orange-700"
              >
                Refresh
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <p className="text-sm text-slate-500 italic">
                No webhook events yet. Click "Simulate Webhook" or hit "Refresh" to pull server logs.
              </p>
            ) : (
              <div className="divide-y divide-slate-100">
                {logs.map((log, idx) => (
                  <div key={idx} className="py-2 flex items-center justify-between text-sm">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge
                          className={
                            log.result === "FULL_PAYMENT"
                              ? "bg-green-100 text-green-700"
                              : log.result === "UNDERPAYMENT"
                                ? "bg-amber-100 text-amber-700"
                                : log.result === "OVERPAYMENT"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-red-100 text-red-700"
                          }
                        >
                          {log.result}
                        </Badge>
                        <span className="text-slate-600">₦{log.amount.toLocaleString("en-NG")}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-mono mt-1">
                        {log.account_ref}
                      </p>
                    </div>
                    <p className="text-xs text-slate-500">
                      {new Date(log.timestamp).toLocaleString("en-NG")}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
