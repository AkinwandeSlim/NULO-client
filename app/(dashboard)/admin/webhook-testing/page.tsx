"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { 
  Shield, 
  AlertCircle, 
  CheckCircle2, 
  Loader2,
  Trash2,
  RefreshCw,
  Copy,
  Check,
  Zap
} from "lucide-react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { paymentsAPI } from "@/lib/api/payments"
import type { WebhookLog, WebhookTestResponse } from "@/lib/api/payments"

export default function WebhookTestingPage() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [isFetching, setIsFetching] = useState(true) // 🆕 Separate state for initial load
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [testResult, setTestResult] = useState<WebhookTestResponse | null>(null)
  const [showTestResult, setShowTestResult] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  // Fetch webhook logs
  const fetchLogs = async () => {
    try {
      setIsFetching(true)
      const logs = await paymentsAPI.getWebhookLogs()
      setLogs(logs)
      toast.success("Webhook logs loaded successfully")
    } catch (error: any) {
      console.error("Failed to fetch logs:", error)
      toast.error(error.message || "Failed to fetch webhook logs")
    } finally {
      setIsFetching(false)
    }
  }

  // Test with invalid signature
  const testInvalidSignature = async () => {
    try {
      setLoading(true)
      setTestResult(null)
      
      const result = await paymentsAPI.testWebhookSignature()
      
      setTestResult(result)
      setShowTestResult(true)
      toast.success("Invalid signature test completed - rejection verified ✓")

      // Refresh logs after a short delay
      setTimeout(fetchLogs, 500)
    } catch (error: any) {
      console.error("Test failed:", error)
      toast.error(error.message || "Failed to test webhook signature")
    } finally {
      setLoading(false)
    }
  }

  // Test with valid signature
  const testValidSignature = async () => {
    try {
      setLoading(true)
      setTestResult(null)
      
      const result = await paymentsAPI.testWebhookValidSignature()
      
      setTestResult(result)
      setShowTestResult(true)
      toast.success("Valid signature test completed - acceptance verified ✓")

      // Refresh logs after a short delay
      setTimeout(fetchLogs, 500)
    } catch (error: any) {
      console.error("Test failed:", error)
      toast.error(error.message || "Failed to test webhook signature")
    } finally {
      setLoading(false)
    }
  }

  // Clear all logs
  const clearLogs = async () => {
    if (!confirm("Are you sure you want to clear all webhook logs?")) {
      return
    }

    try {
      setIsFetching(true)
      await paymentsAPI.clearWebhookLogs()
      
      setLogs([])
      setTestResult(null)
      toast.success("Webhook logs cleared successfully")
    } catch (error: any) {
      console.error("Failed to clear logs:", error)
      toast.error(error.message || "Failed to clear webhook logs")
    } finally {
      setIsFetching(false)
    }
  }

  // Copy to clipboard
  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  // Load logs on mount
  useEffect(() => {
    if (user?.id) {
      fetchLogs()
    }
  }, [user?.id])

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div>
        <h1 className="text-4xl font-bold text-slate-900 mb-2">
          🔐 Webhook Testing Dashboard
        </h1>
        <p className="text-slate-600">
          Test Paystack webhook HMAC signature validation and view validation logs
        </p>
      </div>

      {/* Info Alert */}
      <Alert className="border-orange-200 bg-orange-50">
        <Shield className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-900">
          <strong>🔐 Test Both Scenarios:</strong> Click "Test Invalid Signature" to verify the backend rejects tampered webhooks (security check). Click "Test Valid Signature" to verify the backend accepts properly signed webhooks (functionality check).
        </AlertDescription>
      </Alert>

      {/* Test Controls */}
      <Card className="border-2 border-orange-200 bg-gradient-to-br from-orange-50 to-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Test Webhook Signature Validation
          </CardTitle>
          <CardDescription>
            Send a test webhook with an invalid HMAC signature to verify rejection
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Test Invalid Signature Button */}
            <Button
              onClick={testInvalidSignature}
              disabled={loading}
              className="bg-red-600 hover:bg-red-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Test Invalid Signature
                </>
              )}
            </Button>

            {/* Test Valid Signature Button */}
            <Button
              onClick={testValidSignature}
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Test Valid Signature
                </>
              )}
            </Button>
          </div>

          {/* Helper Text */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-600">
            <p className="p-2 bg-red-50 rounded border border-red-200">
              <strong>Invalid Test:</strong> Verifies the backend rejects fake/tampered signatures (security check)
            </p>
            <p className="p-2 bg-green-50 rounded border border-green-200">
              <strong>Valid Test:</strong> Verifies the backend accepts properly signed webhooks (functionality check)
            </p>
          </div>

          {/* Refresh Button */}
          <Button
            onClick={fetchLogs}
            disabled={isFetching}
            variant="outline"
            className="w-full border-slate-300 hover:bg-slate-50"
          >
            {isFetching ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Refreshing...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Logs
              </>
            )}
          </Button>

          {/* Test Result Display - Enhanced */}
          {showTestResult && testResult && (
            <div className="space-y-4">
              <div className={`border-2 rounded-xl p-6 ${testResult.success ? "border-green-300 bg-green-50" : "border-red-300 bg-red-50"}`}>
                {/* Status Header */}
                <div className="flex items-center gap-3 mb-4">
                  {testResult.success ? (
                    <>
                      <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                        <CheckCircle2 className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-green-900">✅ Test Passed</h3>
                        <p className="text-sm text-green-700">{testResult.message}</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-red-900">❌ Signature Rejected</h3>
                        <p className="text-sm text-red-700">{testResult.message}</p>
                      </div>
                    </>
                  )}
                </div>

                {/* Signature Details */}
                {testResult.details && (
                  <div className="space-y-3 mt-4 pt-4 border-t border-current border-opacity-20">
                    {/* Test Type Badge */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        🧪 Test Type
                      </label>
                      <Badge className={(testResult.details.test_type ?? 'invalid') === 'valid' ? "bg-green-100 text-green-800 border-green-300 text-sm py-1" : "bg-red-100 text-red-800 border-red-300 text-sm py-1"}>
                        {(testResult.details.test_type ?? 'invalid') === 'valid' ? "✅ VALID SIGNATURE TEST" : "❌ INVALID SIGNATURE TEST"}
                      </Badge>
                    </div>

                    {/* Validation Result */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        📊 Validation Result
                      </label>
                      <div className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${testResult.details.match ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                        {testResult.details.match ? "✅ SIGNATURES MATCH" : "❌ SIGNATURES DON'T MATCH"}
                      </div>
                    </div>

                    {/* Expected Signature */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        🔒 Expected HMAC SHA-512
                      </label>
                      <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 break-all leading-relaxed">
                        {testResult.details.expected}
                      </div>
                    </div>

                    {/* Received Signature */}
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">
                        📥 Received Signature
                      </label>
                      <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 break-all leading-relaxed">
                        {testResult.details.signature_header_received || "(Test in progress)"}
                      </div>
                    </div>

                    {/* Event Details (if available) */}
                    {(testResult.details.event_type ?? testResult.details.paystack_ref) && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            📨 Event Type
                          </label>
                          <p className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-900">
                            {testResult.details.event_type ?? 'charge.success'}
                          </p>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                            🔖 Reference
                          </label>
                          <p className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-900">
                            {testResult.details.paystack_ref ?? 'TEST'}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="bg-blue-50 rounded-lg p-3 border-l-4 border-blue-500">
                      <p className="text-xs text-slate-700">
                        <span className="font-semibold">💡 What this means:</span> {(testResult.details.test_type ?? 'invalid') === 'valid' 
                          ? "The backend successfully validated a properly signed webhook. This confirms your signature verification is working correctly." 
                          : "The backend correctly rejected an invalid signature. This confirms your security checks are protecting against tampering."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Webhook Logs */}
      <Card className="shadow-lg">
        <CardHeader className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
          <div className="flex flex-row items-center justify-between gap-4">
            <div className="flex-1">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-orange-600" />
                Webhook Test Log History
              </CardTitle>
              <CardDescription>
                {logs.length === 0 
                  ? "No tests run yet. Click \"Test Invalid Signature\" above to create the first entry."
                  : `Showing ${logs.length} webhook validation attempt${logs.length !== 1 ? 's' : ''} (most recent first)`}
              </CardDescription>
            </div>
            {logs.length > 0 && (
              <Button
                onClick={clearLogs}
                disabled={isFetching}
                variant="destructive"
                size="sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          {isFetching && logs.length === 0 ? (
            // 🆕 Loading skeleton while fetching logs
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="bg-slate-200 h-20 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-4">
                <Shield className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              </div>
              <p className="text-slate-600 font-semibold text-lg mb-2">No Webhook Attempts Yet</p>
              <p className="text-slate-500 text-sm max-w-md mx-auto">
                Test the webhook signature validation by clicking "Test Invalid Signature" above. Each test will create an entry here with detailed validation results.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Statistics Summary */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 p-4 bg-slate-50 rounded-xl border border-slate-200">
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{logs.length}</p>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Total Tests</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-red-600">{logs.filter(l => !l.signature_valid).length}</p>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Invalid ✓</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{logs.filter(l => l.signature_valid).length}</p>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Valid</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-slate-900">{new Date(logs[0]?.timestamp).toLocaleTimeString()}</p>
                  <p className="text-xs text-slate-600 uppercase font-semibold">Latest</p>
                </div>
              </div>

              {/* Log Entries */}
              <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                {logs.map((log, index) => (
                  <div
                    key={index}
                    className={`border-2 rounded-xl p-5 transition-all hover:shadow-md ${
                      log.signature_valid
                        ? "border-green-200 bg-gradient-to-r from-green-50 to-white"
                        : "border-red-200 bg-gradient-to-r from-red-50 to-white"
                    }`}
                  >
                    {/* Header with Status and Time */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className={`flex-shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${
                          log.signature_valid ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {log.signature_valid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <div>
                          <Badge className={log.signature_valid ? "bg-green-100 text-green-800 border-green-300" : "bg-red-100 text-red-800 border-red-300"}>
                            {log.signature_valid ? "✅ Valid Signature" : "❌ Invalid Signature"}
                          </Badge>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 font-semibold">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>

                    {/* Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 pb-4 border-b border-current border-opacity-10">
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">📨 Event Type</p>
                        <p className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-900">{log.event_type}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">🔖 Paystack Ref</p>
                        <p className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-900">{log.paystack_ref}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">📝 Status</p>
                        <p className="text-sm font-mono bg-slate-100 px-2 py-1 rounded text-slate-900">
                          {log.signature_valid ? "Accepted" : "Rejected"}
                        </p>
                      </div>
                    </div>

                    {/* Reason */}
                    <div className="mb-3 p-3 bg-white rounded border border-slate-200">
                      <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-2">💬 Validation Result</p>
                      <p className="text-sm text-slate-800">{log.reason}</p>
                    </div>

                    {/* Signature Hash */}
                    <div className="bg-slate-900 rounded-lg p-3 font-mono text-xs text-slate-300 overflow-hidden">
                      <p className="text-slate-400 text-xs font-semibold mb-2 uppercase tracking-wider">🔐 Signature Received</p>
                      <div className="flex justify-between items-center group">
                        <span className="break-all pr-2">
                          {log.signature_header_received || "(Backend processing - check result above)"}
                        </span>
                        {log.signature_header_received && (
                          <button
                            onClick={() =>
                              copyToClipboard(log.signature_header_received, index)
                            }
                            className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 p-1 hover:bg-slate-700 rounded flex-shrink-0"
                            title="Copy signature"
                          >
                            {copiedIndex === index ? (
                              <Check className="h-4 w-4 text-green-400" />
                            ) : (
                              <Copy className="h-4 w-4 text-slate-400 hover:text-slate-200" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Documentation */}
      <Card className="border-slate-200 bg-gradient-to-br from-slate-50 to-blue-50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-600" />
            Understanding Webhook HMAC Signature Validation
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-slate-700 space-y-4">
          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4">
            <p className="font-semibold mb-2">🔒 What is HMAC SHA-512?</p>
            <p className="text-slate-600">
              HMAC (Hash-based Message Authentication Code) is a cryptographic signature that proves a webhook message came from Paystack and hasn't been tampered with. Each webhook includes an `x-paystack-signature` header containing the SHA-512 hash of the request body using your secret key.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4">
            <p className="font-semibold mb-2">✅ Validation Flow</p>
            <ol className="space-y-2 list-decimal list-inside text-slate-600">
              <li><strong className="text-slate-900">Receive:</strong> Webhook arrives with `x-paystack-signature` header</li>
              <li><strong className="text-slate-900">Extract:</strong> Pull signature from header and request body</li>
              <li><strong className="text-slate-900">Compute:</strong> Calculate HMAC-SHA512(body, secret_key)</li>
              <li><strong className="text-slate-900">Compare:</strong> Use timing-safe comparison (prevents timing attacks)</li>
              <li><strong className="text-slate-900">Respond:</strong> Return 200 OK for both valid and invalid (prevents Paystack retries)</li>
              <li><strong className="text-slate-900">Log:</strong> Record attempt with validation result for audit trail</li>
            </ol>
          </div>

          <div className="bg-white/80 backdrop-blur-sm border border-slate-200 rounded-lg p-4">
            <p className="font-semibold mb-2">🧪 Two Test Scenarios</p>
            <div className="space-y-3 text-slate-600">
              <div className="border-l-4 border-red-400 pl-3">
                <p className="font-semibold text-red-700 mb-1">❌ Invalid Signature Test</p>
                <p className="text-sm">Tests that your backend REJECTS fake/tampered signatures. This verifies your security is working - malicious actors can't spoof webhooks.</p>
              </div>
              <div className="border-l-4 border-green-400 pl-3">
                <p className="font-semibold text-green-700 mb-1">✅ Valid Signature Test</p>
                <p className="text-sm">Tests that your backend ACCEPTS properly signed webhooks from Paystack. This verifies legitimate payments are processed correctly.</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
            <p className="font-semibold text-blue-900 mb-2">💡 Pro Tips</p>
            <ul className="space-y-1 text-blue-800 text-sm">
              <li>• Invalid signatures are <strong>expected and safe</strong> - they're rejected silently</li>
              <li>• The expected signature is computed using your real Paystack secret key</li>
              <li>• Each test creates a log entry for audit and verification purposes</li>
              <li>• Use "Clear All" between test runs to keep logs organized</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
