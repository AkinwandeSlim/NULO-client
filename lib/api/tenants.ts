import apiClient from './client'

export interface ProfileStatus {
  profile_completion: number
  onboarding_completed: boolean
  trust_score: number
  verification_status: string
  missing_fields: string[]
  can_apply: boolean
}

export interface TenantProfile {
  id: string
  budget?: number
  preferred_location?: string
  preferences?: {
    bedrooms?: number
    move_in_date?: string
    join_rent_credit?: boolean
  }
  documents?: {
    id_document?: string
    proof_of_income?: string
    references?: string[]
  }
  profile_completion: number
  onboarding_completed: boolean
  profile_completed_at?: string
}

export interface CompleteProfileData {
  // Step 1: Preferences
  budget: number
  preferred_location: string
  bedrooms: number
  move_in_date?: string
  
  // Step 2: Documents (URLs after upload)
  id_document_url: string
  proof_of_income_url: string
  reference1_email?: string
  reference2_email?: string
  
  // Step 3: Rent Credit
  join_rent_credit: boolean
}

export const tenantsAPI = {
  /**
   * Get tenant profile with completion status
   */
  getProfile: async (): Promise<TenantProfile> => {
    const response = await apiClient.get<{ success: boolean; profile: TenantProfile }>('/api/v1/tenants/profile')
    return response.data.profile
  },

  /**
   * Get profile completion status
   */
  getProfileStatus: async (): Promise<ProfileStatus> => {
    const response = await apiClient.get<ProfileStatus>('/api/v1/tenants/profile-status')
    return response.data
  },

  /**
   * Complete tenant profile (3-step wizard)
   */
  completeProfile: async (data: CompleteProfileData): Promise<{
    success: boolean
    message: string
    profile: TenantProfile
    trust_score: number
  }> => {
    const response = await apiClient.post('/api/v1/tenants/complete-profile', data)
    return response.data
  },

  /**
   * Update tenant profile
   */
  updateProfile: async (data: Partial<TenantProfile>): Promise<TenantProfile> => {
    const response = await apiClient.patch<{ success: boolean; profile: TenantProfile }>('/api/v1/tenants/profile', data)
    return response.data.profile
  },

  /**
   * Upload document to Supabase Storage
   * This is a helper function to upload files before completing profile
   */
  uploadDocument: async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('file', file)
    
    const response = await apiClient.post<{ url: string }>('/api/v1/tenants/upload-document', formData)
    
    return response.data.url
  }
}
