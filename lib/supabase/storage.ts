import { supabase } from '@/lib/supabase/client'

interface UploadOptions {
  bucket: 'landlord-documents' | 'landlord-verification' | 'property-images'
  folder: string
  file: File
  userId: string
}

interface UploadResult {
  success: boolean
  url?: string
  path?: string
  error?: string
}

/**
 * Upload file to Supabase Storage
 * @returns Public URL or signed URL depending on bucket privacy
 */
export async function uploadFile({
  bucket,
  folder,
  file,
  userId
}: UploadOptions): Promise<UploadResult> {
  try {
    // Generate unique filename
    const timestamp = Date.now()
    const fileExt = file.name.split('.').pop()
    const fileName = `${folder}_${timestamp}.${fileExt}`
    const filePath = `${userId}/${folder}/${fileName}`

    console.log('📤 Uploading to:', bucket, filePath)

    // Upload file
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false // Don't overwrite existing files
      })

    if (error) {
      console.error('❌ Upload error:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Upload successful:', data.path)

    // Get URL based on bucket type
    let url: string

    if (bucket === 'property-images') {
      // Public bucket - get public URL
      const { data: urlData } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)
      
      url = urlData.publicUrl
    } else {
      // Private bucket - get signed URL (valid for 1 year)
      const { data: urlData, error: urlError } = await supabase.storage
        .from(bucket)
        .createSignedUrl(data.path, 60 * 60 * 24 * 365) // 1 year

      if (urlError) {
        console.error('❌ Error getting signed URL:', urlError)
        return { success: false, error: urlError.message }
      }

      url = urlData.signedUrl
    }

    return {
      success: true,
      url,
      path: data.path
    }

  } catch (error: any) {
    console.error('❌ Upload exception:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete file from Supabase Storage
 */
export async function deleteFile(
  bucket: string,
  filePath: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath])

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    return { success: false, error: error.message }
  }
}

/**
 * Get signed URL for private file (expires in 1 hour)
 */
export async function getSignedUrl(
  bucket: string,
  filePath: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string | null> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, expiresIn)

    if (error) {
      console.error('❌ Error getting signed URL:', error)
      return null
    }

    return data.signedUrl
  } catch (error) {
    console.error('❌ Exception getting signed URL:', error)
    return null
  }
}

/**
 * List files in a folder
 */
export async function listFiles(
  bucket: string,
  folder: string
): Promise<any[]> {
  try {
    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder)

    if (error) {
      console.error('❌ Error listing files:', error)
      return []
    }

    return data || []
  } catch (error) {
    console.error('❌ Exception listing files:', error)
    return []
  }
}