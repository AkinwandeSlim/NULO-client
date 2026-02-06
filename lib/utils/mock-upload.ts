// Mock URL generator for MVP onboarding
// This creates fake but realistic-looking URLs for document uploads

export const generateMockDocumentUrl = (fileName: string, userId: string): string => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  return `https://tqmjcygeykmbdjcfdbga.supabase.co/storage/v1/object/public/landlord-documents/${userId}/documents/${timestamp}_${randomId}_${fileName}`
}

export const generateMockSelfieUrl = (userId: string): string => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  return `https://tqmjcygeykmbdjcfdbga.supabase.co/storage/v1/object/public/landlord-documents/${userId}/selfie/${timestamp}_${randomId}_selfie.png`
}

export const generateMockPropertyImageUrl = (propertyId: string, userId: string, imageIndex: number): string => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  return `https://tqmjcygeykmbdjcfdbga.supabase.co/storage/v1/object/public/property-images/${userId}/${propertyId}/image_${imageIndex}_${timestamp}_${randomId}.jpg`
}

export const generateMockOwnershipDocumentUrl = (propertyId: string, userId: string): string => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  return `https://tqmjcygeykmbdjcfdbga.supabase.co/storage/v1/object/public/property-documents/${userId}/${propertyId}/ownership_${timestamp}_${randomId}.pdf`
}

export const generateMockBankStatementUrl = (userId: string): string => {
  const timestamp = Date.now()
  const randomId = Math.random().toString(36).substring(2, 15)
  
  return `https://tqmjcygeykmbdjcfdbga.supabase.co/storage/v1/object/public/bank-documents/${userId}/bank_statement_${timestamp}_${randomId}.pdf`
}

// Simulate upload delay for realistic UX
export const simulateUploadDelay = async (ms: number = 1000): Promise<void> => {
  return new Promise(resolve => setTimeout(resolve, ms))
}
