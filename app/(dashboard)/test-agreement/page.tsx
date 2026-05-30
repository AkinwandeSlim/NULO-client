"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/contexts/AuthContext"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Loader2, FileText, Sparkles, AlertCircle, CheckCircle2, Copy } from "lucide-react"
import { toast } from "sonner"
import { AIBadge } from "@/components/ui/ai-badge"

// Test data templates
const TEST_TEMPLATES = {
  luxury: {
    tenant_name: "Adebayo Johnson",
    landlord_name: "Chidi Properties Ltd",
    property_address: "Plot 1234, Victoria Island Extension, Lagos, Nigeria",
    monthly_rent: 2500000,
    lease_duration: "24 months",
    property_type: "Luxury 3-Bedroom Penthouse"
  },
  standard: {
    tenant_name: "Fatima Mohammed",
    landlord_name: "Okafor Real Estate",
    property_address: "Block 7, Flat 2, Lekki Phase 1, Lagos, Nigeria",
    monthly_rent: 850000,
    lease_duration: "12 months",
    property_type: "2-Bedroom Apartment"
  },
  budget: {
    tenant_name: "Emeka Okonkwo",
    landlord_name: "Ibrahim Holdings",
    property_address: "No 45, Surulere, Lagos, Nigeria",
    monthly_rent: 450000,
    lease_duration: "6 months",
    property_type: "Studio Apartment"
  }
}

export default function TestAgreementPage() {
  const { user } = useAuth()
  const router = useRouter()
  
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    tenant_name: "",
    landlord_name: "",
    property_address: "",
    monthly_rent: "",
    lease_duration: "12 months",
    property_type: "Apartment"
  })

  const [selectedTemplate, setSelectedTemplate] = useState<string>("")

  if (!user) {
    router.push("/signin")
    return null
  }

  const loadTemplate = (templateKey: string) => {
    const template = TEST_TEMPLATES[templateKey as keyof typeof TEST_TEMPLATES]
    if (template) {
      setFormData({
        tenant_name: template.tenant_name,
        landlord_name: template.landlord_name,
        property_address: template.property_address,
        monthly_rent: template.monthly_rent.toString(),
        lease_duration: template.lease_duration,
        property_type: template.property_type
      })
      setSelectedTemplate(templateKey)
    }
  }

  const generateAgreement = async () => {
    // Validation
    if (!formData.tenant_name || !formData.landlord_name || !formData.property_address || !formData.monthly_rent) {
      toast.error("Please fill in all required fields")
      return
    }

    const rentAmount = parseInt(formData.monthly_rent)
    if (isNaN(rentAmount) || rentAmount <= 0) {
      toast.error("Please enter a valid rent amount")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch("/api/test/generate-agreement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          tenant_name: formData.tenant_name,
          landlord_name: formData.landlord_name,
          property_address: formData.property_address,
          monthly_rent: rentAmount,
          lease_duration: formData.lease_duration,
          property_type: formData.property_type
        })
      })

      const data = await response.json()

      if (data.success) {
        setResult(data)
        toast.success("Agreement generated successfully!")
      } else {
        setError(data.error || "Failed to generate agreement")
        toast.error("Failed to generate agreement")
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Network error"
      setError(errorMessage)
      toast.error("Network error occurred")
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Agreement copied to clipboard!")
  }

  const downloadAgreement = () => {
    if (!result?.agreement) return
    
    const blob = new Blob([result.agreement], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `tenancy-agreement-${formData.tenant_name.replace(/\s+/g, '-').toLowerCase()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success("Agreement downloaded!")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-slate-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()}>
              ← Back
            </Button>
            <Badge variant="outline" className="border-orange-200 text-orange-700">
              Testing Environment
            </Badge>
          </div>
          
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-purple-500 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-orange-600 to-purple-600 bg-clip-text text-transparent">
                AI Agreement Generator Test
              </h1>
              <p className="text-slate-600">
                Test AI-powered tenancy agreement generation with custom data
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Left: Input Form */}
          <div className="space-y-6">
            
            {/* Quick Templates */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Quick Templates
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant={selectedTemplate === "luxury" ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadTemplate("luxury")}
                    className="text-xs"
                  >
                    Luxury
                  </Button>
                  <Button
                    variant={selectedTemplate === "standard" ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadTemplate("standard")}
                    className="text-xs"
                  >
                    Standard
                  </Button>
                  <Button
                    variant={selectedTemplate === "budget" ? "default" : "outline"}
                    size="sm"
                    onClick={() => loadTemplate("budget")}
                    className="text-xs"
                  >
                    Budget
                  </Button>
                </div>
                <p className="text-xs text-slate-500">
                  Click a template to pre-fill realistic test data
                </p>
              </CardContent>
            </Card>

            {/* Input Form */}
            <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-800">
                  Agreement Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="tenant_name">Tenant Name *</Label>
                    <Input
                      id="tenant_name"
                      value={formData.tenant_name}
                      onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
                      placeholder="John Doe"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="landlord_name">Landlord Name *</Label>
                    <Input
                      id="landlord_name"
                      value={formData.landlord_name}
                      onChange={(e) => setFormData({ ...formData, landlord_name: e.target.value })}
                      placeholder="Property Owner"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="property_address">Property Address *</Label>
                  <Textarea
                    id="property_address"
                    value={formData.property_address}
                    onChange={(e) => setFormData({ ...formData, property_address: e.target.value })}
                    placeholder="123 Main Street, Lagos, Nigeria"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="monthly_rent">Monthly Rent (₦) *</Label>
                    <Input
                      id="monthly_rent"
                      type="number"
                      value={formData.monthly_rent}
                      onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                      placeholder="500000"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="lease_duration">Lease Duration</Label>
                    <Select value={formData.lease_duration} onValueChange={(value) => setFormData({ ...formData, lease_duration: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6 months">6 months</SelectItem>
                        <SelectItem value="12 months">12 months</SelectItem>
                        <SelectItem value="24 months">24 months</SelectItem>
                        <SelectItem value="36 months">36 months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="property_type">Property Type</Label>
                    <Input
                      id="property_type"
                      value={formData.property_type}
                      onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
                      placeholder="Apartment"
                    />
                  </div>
                </div>

                <Button 
                  onClick={generateAgreement}
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-600 hover:to-purple-600"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating Agreement...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate AI Agreement
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Error Display */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>

          {/* Right: Results */}
          <div className="space-y-6">
            
            {result && (
              <>
                {/* Success Metrics */}
                <Card className="border-green-200 bg-green-50/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold text-green-800 flex items-center gap-2">
                      <CheckCircle2 className="h-5 w-5" />
                      Generation Successful!
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-green-600 font-medium">Source</p>
                        <p className="text-green-800 font-semibold">
                          {result.agreement_source === "groq_llama" ? "AI Generated" : "Template"}
                        </p>
                      </div>
                      <div>
                        <p className="text-green-600 font-medium">Compliance</p>
                        <p className="text-green-800 font-semibold">
                          {result.generation_metadata?.compliance_score?.toFixed(1) || "N/A"}%
                        </p>
                      </div>
                      <div>
                        <p className="text-green-600 font-medium">Length</p>
                        <p className="text-green-800 font-semibold">{result.agreement?.length || 0} chars</p>
                      </div>
                      <div>
                        <p className="text-green-600 font-medium">Cost</p>
                        <p className="text-green-800 font-semibold">
                          ${result.generation_metadata?.cost_usd?.toFixed(6) || "0.000000"}
                        </p>
                      </div>
                    </div>
                    
                    {/* AI Badge */}
                    <div className="mt-4">
                      <AIBadge agreement={result} variant="badge" />
                    </div>
                  </CardContent>
                </Card>

                {/* Agreement Content */}
                <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-orange-500" />
                        Generated Agreement
                      </CardTitle>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => copyToClipboard(result.agreement)}
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={downloadAgreement}
                        >
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 max-h-96 overflow-y-auto">
                      <pre className="whitespace-pre-wrap text-sm text-slate-700 font-sans leading-relaxed">
                        {result.agreement}
                      </pre>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}

            {/* Instructions */}
            {!result && (
              <Card className="border-blue-200 bg-blue-50/80 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-blue-800">
                    How to Test
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-blue-700">
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">1.</span>
                    <span>Click a template (Luxury, Standard, or Budget) to pre-fill realistic data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">2.</span>
                    <span>Modify any fields as needed or enter your own data</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">3.</span>
                    <span>Click "Generate AI Agreement" to create the document</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">4.</span>
                    <span>View the AI-generated agreement with compliance metrics</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="font-semibold">5.</span>
                    <span>Copy or download the agreement for review</span>
                  </div>
                  
                  <div className="mt-4 p-3 bg-blue-100 rounded-lg border border-blue-200">
                    <p className="text-xs font-semibold text-blue-800 mb-1">💡 Tip:</p>
                    <p className="text-xs text-blue-700">
                      This test page bypasses the full application process to let you quickly test AI agreement generation with any data you want.
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
