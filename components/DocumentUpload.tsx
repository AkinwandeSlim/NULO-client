'use client'

import { useState } from 'react'
import { uploadFile } from '@/lib/supabase/storage'
import { Button } from '@/components/ui/button'
import { Upload, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface DocumentUploadProps {
  documentType: 'nin' | 'bvn' | 'id_document' | 'selfie' | 'bank_statement' | 'insurance'
  userId: string
  onUploadComplete: (url: string, path: string) => void
  label: string
  acceptedTypes?: string
  maxSizeMB?: number
}

export function DocumentUpload({
  documentType,
  userId,
  onUploadComplete,
  label,
  acceptedTypes = 'image/*,application/pdf',
  maxSizeMB = 10
}: DocumentUploadProps) {
  const [file, setFile] = useState<File | null>(null)
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'success' | 'error'>('idle')
  const [preview, setPreview] = useState<string | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    // Validate file size
    const fileSizeMB = selectedFile.size / (1024 * 1024)
    if (fileSizeMB > maxSizeMB) {
      toast.error(`File too large. Maximum size is ${maxSizeMB}MB`)
      return
    }

    setFile(selectedFile)
    setUploadStatus('idle')

    // Create preview for images
    if (selectedFile.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setPreview(reader.result as string)
      }
      reader.readAsDataURL(selectedFile)
    } else {
      setPreview(null)
    }
  }

  const handleUpload = async () => {
    if (!file) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    console.log('📤 Starting upload:', documentType)

    try {
      // Determine bucket based on document type
      const bucket = documentType === 'selfie' 
        ? 'landlord-verification' 
        : 'landlord-documents'

      const result = await uploadFile({
        bucket,
        folder: documentType,
        file,
        userId
      })

      if (result.success && result.url && result.path) {
        setUploadStatus('success')
        toast.success('Document uploaded successfully!')
        onUploadComplete(result.url, result.path)
      } else {
        setUploadStatus('error')
        toast.error(result.error || 'Upload failed')
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error)
      setUploadStatus('error')
      toast.error('Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-slate-700">
          {label}
        </label>
        {uploadStatus === 'success' && (
          <CheckCircle className="h-5 w-5 text-green-600" />
        )}
        {uploadStatus === 'error' && (
          <AlertCircle className="h-5 w-5 text-red-600" />
        )}
      </div>

      {/* File Input */}
      <div className="flex items-center gap-3">
        <input
          type="file"
          accept={acceptedTypes}
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
          id={`file-${documentType}`}
        />
        <label
          htmlFor={`file-${documentType}`}
          className="flex-1 cursor-pointer"
        >
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-orange-500 transition-colors">
            <div className="flex items-center gap-3">
              <Upload className="h-5 w-5 text-slate-400" />
              <div className="text-sm">
                {file ? (
                  <span className="text-slate-700 font-medium">{file.name}</span>
                ) : (
                  <span className="text-slate-500">Choose file or drag here</span>
                )}
              </div>
            </div>
          </div>
        </label>

        {file && uploadStatus !== 'success' && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="bg-orange-600 hover:bg-orange-700"
          >
            {uploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </>
            )}
          </Button>
        )}
      </div>

      {/* Image Preview */}
      {preview && (
        <div className="mt-3">
          <img
            src={preview}
            alt="Preview"
            className="max-w-xs rounded-lg border border-slate-200"
          />
        </div>
      )}

      {/* File Info */}
      {file && (
        <p className="text-xs text-slate-500">
          Size: {(file.size / 1024).toFixed(2)} KB • Max: {maxSizeMB}MB
        </p>
      )}
    </div>
  )
}