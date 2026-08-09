import { useState } from "react"
import { Label } from "@/components/ui/label"
import { Upload, FileText, CheckCircle, X } from "lucide-react"

interface DocumentsStepProps {
  formData: any
  errors: Record<string, string>
  onFileChange: (name: string, file: File | null) => void
}

export default function DocumentsStep({ formData, errors, onFileChange }: DocumentsStepProps) {
  const handleFileSelect = (name: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] || null
    onFileChange(name, file)
  }

  const handleRemoveFile = (name: string) => {
    onFileChange(name, null)
  }

  const FileUploadBox = ({
    name,
    label,
    required,
    description,
    acceptedFormats = ".pdf,.jpg,.jpeg,.png"
  }: {
    name: string
    label: string
    required: boolean
    description: string
    acceptedFormats?: string
  }) => {
    const file = formData[name]
    const error = errors[name]

    // Check if it's a SavedDoc (reused from previous application)
    const isSavedDoc = file && typeof file === 'object' && 'path' in file
    const isFile = file instanceof File

    return (
      <div className={`border-2 border-dashed rounded-lg p-6 transition-all ${
        error ? 'border-red-300 bg-red-50' :
        (file && (isFile || isSavedDoc)) ? 'border-green-300 bg-green-50' :
        'border-slate-300 bg-slate-50 hover:border-orange-400 hover:bg-orange-50'
      }`}>
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${
            file && (isFile || isSavedDoc) ? 'bg-green-600' : 'bg-slate-200'
          }`}>
            {file && (isFile || isSavedDoc) ? (
              <CheckCircle className="h-6 w-6 text-white" />
            ) : (
              <Upload className="h-6 w-6 text-slate-600" />
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <Label className="text-base font-semibold">
                {label} {required && <span className="text-red-600">*</span>}
              </Label>
              {file && (
                <button
                  type="button"
                  onClick={() => handleRemoveFile(name)}
                  className="text-red-600 hover:text-red-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            <p className="text-sm text-slate-600 mb-3">{description}</p>

            {isSavedDoc ? (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-blue-200">
                <FileText className="h-5 w-5 text-blue-600" />
                <div className="flex-1">
                  <span className="text-sm font-medium text-slate-900">{(file as any).filename}</span>
                  <span className="text-xs text-blue-600 ml-2">Reused from previous application</span>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(name)}
                  className="text-blue-600 hover:text-blue-700 ml-2"
                >
                  Replace
                </button>
              </div>
            ) : isFile ? (
              <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-green-200">
                <FileText className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-slate-900">{(file as File).name}</span>
                <span className="text-xs text-slate-500 ml-auto">
                  {((file as File).size / 1024).toFixed(1)} KB
                </span>
              </div>
            ) : (
              <div>
                <input
                  type="file"
                  id={name}
                  name={name}
                  accept={acceptedFormats}
                  onChange={(e) => handleFileSelect(name, e)}
                  className="hidden"
                />
                <label
                  htmlFor={name}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 hover:border-orange-400 cursor-pointer transition-all"
                >
                  <Upload className="h-4 w-4" />
                  Choose File
                </label>
                <p className="text-xs text-slate-500 mt-2">
                  Accepted formats: PDF, JPG, PNG (Max 5MB)
                </p>
              </div>
            )}

            {error && (
              <p className="text-sm text-red-600 mt-2 font-medium">{error}</p>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-900">
          <strong>Document Requirements:</strong> Please upload clear, legible copies of the required documents. All documents must be valid and up-to-date.
        </p>
      </div>

      <FileUploadBox
        name="idDocument"
        label="Government-Issued ID"
        required={true}
        description="Valid passport, driver's license, or national ID card"
      />

      <FileUploadBox
        name="proofOfIncome"
        label="Proof of Income"
        required={true}
        description="Recent payslip, bank statement, or tax return (last 3 months)"
      />

      <FileUploadBox
        name="bankStatement"
        label="Bank Statement"
        required={false}
        description="Bank statement from the last 3 months (optional but recommended)"
      />

      <FileUploadBox
        name="employmentLetter"
        label="Employment Letter"
        required={false}
        description="Letter from employer confirming employment and salary (optional)"
      />

      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mt-6">
        <p className="text-sm text-amber-900">
          <strong>Privacy & Security:</strong> All uploaded documents are encrypted and stored securely. They will only be shared with the property owner for verification purposes and will be deleted after the application process is complete.
        </p>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
        <h4 className="font-semibold text-slate-900 mb-2">Tips for uploading documents:</h4>
        <ul className="text-sm text-slate-700 space-y-1 list-disc list-inside">
          <li>Ensure all text is clearly readable</li>
          <li>Use good lighting if taking photos</li>
          <li>Include all pages of multi-page documents</li>
          <li>File size should not exceed 5MB per document</li>
          <li>Supported formats: PDF, JPG, PNG</li>
        </ul>
      </div>
    </div>
  )
}
