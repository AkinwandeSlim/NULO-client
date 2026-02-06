/**
 * Simple File Upload Helper for MVP
 * Quick upload to get URLs and move on
 */

import { uploadFile } from '@/lib/supabase/storage'

export interface UploadResult {
  success: boolean
  url?: string
  error?: string
}

/**
 * Upload a file and return the URL
 * Simplified for MVP - just upload and return URL
 */
export async function uploadDocument(
  file: File,
  documentType: string,
  userId: string
): Promise<UploadResult> {
  try {
    console.log(`📤 [UPLOAD] Uploading ${documentType} for user ${userId}`)
    
    const result = await uploadFile({
      bucket: 'landlord-documents',
      folder: `${userId}/${documentType}`,
      file,
      userId
    })

    if (result.success && result.url) {
      console.log(`✅ [UPLOAD] ${documentType} uploaded: ${result.url}`)
      return { success: true, url: result.url }
    } else {
      throw new Error(result.error || 'Upload failed')
    }
  } catch (error: any) {
    console.error(`❌ [UPLOAD] Error uploading ${documentType}:`, error)
    return { success: false, error: error.message }
  }
}

/**
 * Upload multiple documents in parallel
 */
export async function uploadMultipleDocuments(
  files: { file: File; type: string }[],
  userId: string
): Promise<Record<string, UploadResult>> {
  console.log(`📤 [UPLOAD] Uploading ${files.length} documents in parallel`)
  
  const uploadPromises = files.map(({ file, type }) =>
    uploadDocument(file, type, userId)
  )

  const results = await Promise.all(uploadPromises)
  
  const resultMap: Record<string, UploadResult> = {}
  files.forEach((file, index) => {
    resultMap[file.type] = results[index]
  })

  console.log(`✅ [UPLOAD] All uploads completed`)
  return resultMap
}
