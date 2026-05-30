"use client"

import { Brain, Sparkles } from "lucide-react"
import { type AgreementWithDetails } from "@/lib/api/agreements"

interface AIBadgeProps {
  agreement: AgreementWithDetails
  variant?: "badge" | "compact" | "detailed"
}

export function AIBadge({ agreement, variant = "badge" }: AIBadgeProps) {
  const isAIGenerated = agreement.agreement_source === "groq_llama"
  const metadata = agreement.generation_metadata || {}
  
  if (!isAIGenerated) return null

  // Compact version - just shows AI indicator
  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-blue-50 to-purple-50 rounded-full border border-blue-200">
        <Sparkles className="w-3 h-3 text-blue-600" />
        <span className="text-xs font-medium text-blue-700">AI-Enhanced</span>
      </div>
    )
  }

  // Badge version - shows in card header
  if (variant === "badge") {
    return (
      <div className="flex items-center gap-2 p-2.5 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
        <div className="w-5 h-5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-3 h-3 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-blue-800">AI-Enhanced Agreement</p>
          <p className="text-xs text-blue-600">
            {metadata.compliance_score ? `${metadata.compliance_score.toFixed(0)}% compliance` : 'High compliance'} • Professional quality
          </p>
        </div>
      </div>
    )
  }

  // Detailed version - shows full metadata
  return (
    <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
          <Brain className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-blue-800 mb-2">AI-Enhanced Agreement</p>
          
          <div className="grid grid-cols-2 gap-3 text-xs">
            {metadata.compliance_score && (
              <div>
                <p className="text-blue-600 font-medium">Compliance Score</p>
                <p className="text-blue-800 font-semibold">{metadata.compliance_score.toFixed(1)}%</p>
              </div>
            )}
            
            {metadata.tokens_used && (
              <div>
                <p className="text-blue-600 font-medium">Quality Score</p>
                <p className="text-blue-800 font-semibold">Professional</p>
              </div>
            )}
            
            {metadata.model_used && (
              <div>
                <p className="text-blue-600 font-medium">Generated With</p>
                <p className="text-blue-800 font-semibold">Advanced AI</p>
              </div>
            )}
            
            <div>
              <p className="text-blue-600 font-medium">Enhanced</p>
              <p className="text-blue-800 font-semibold">Legal Quality</p>
            </div>
          </div>
          
          <p className="text-xs text-blue-600 mt-3 italic">
            This agreement was enhanced with artificial intelligence to provide comprehensive legal coverage and professional quality.
          </p>
        </div>
      </div>
    </div>
  )
}
