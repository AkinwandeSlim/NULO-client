"use client"

import { useState } from "react"
import { Upload, CheckCircle } from "lucide-react"
import { toast } from "sonner"

export function DummyUploadButton({ 
  label, 
  onUpload,
  uploaded = false
}: { 
  label: string
  onUpload: () => void
  uploaded?: boolean
}) {
  const [isUploaded, setIsUploaded] = useState(uploaded)

  const handleClick = () => {
    setIsUploaded(true)
    onUpload()
    toast.success(`${label} uploaded successfully!`)
  }

  return (
    <button
      onClick={handleClick}
      disabled={isUploaded}
      className={`
        flex items-center gap-2 px-4 py-3 border rounded-lg transition-all
        ${isUploaded 
          ? 'border-green-500 bg-green-50 text-green-700 cursor-default' 
          : 'border-gray-300 hover:border-orange-500 hover:bg-orange-50 text-gray-700'
        }
      `}
    >
      {isUploaded ? (
        <CheckCircle className="w-5 h-5 text-green-600" />
      ) : (
        <Upload className="w-5 h-5 text-gray-400" />
      )}
      <span className="font-medium">{label}</span>
      {isUploaded && <span className="text-green-600 text-sm ml-1">✓ Uploaded</span>}
    </button>
  )
}
