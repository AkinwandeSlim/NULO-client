/**
 * Database Types for NuloAfrica
 * Generated from Supabase schema
 */

// User types from auth.users
export interface User {
  id: string
  email: string
  phone_number?: string
  first_name?: string
  last_name?: string
  full_name?: string
  email_verified: boolean
  onboarding_completed: boolean
  created_at: string
  updated_at: string
}

// Landlord onboarding table
export interface LandlordOnboarding {
  id: string
  landlord_id: string
  current_step: number
  profile_step_completed: boolean
  property_step_completed: boolean
  payment_step_completed: boolean
  protection_step_completed: boolean
  all_steps_completed: boolean
  onboarding_started_at: string
  onboarding_completed_at?: string
  
  // Personal Information (Step 1)
  full_name?: string
  phone?: string
  date_of_birth?: string
  landlord_type?: 'individual' | 'company'
  company_name?: string
  company_address?: string
  company_rc_number?: string
  
  // Verification (Step 1)
  nin?: string
  nin_verified: boolean
  nin_document_url?: string
  bvn?: string
  bvn_verified: boolean
  
  // Documents (Step 2)
  id_document_type?: string
  id_document_number?: string
  id_document_url?: string
  id_document_verified: boolean
  selfie_url?: string
  selfie_verified: boolean
  proof_of_address_url?: string
  proof_of_address_verified?: boolean
  company_registration_url?: string
  company_registration_verified?: boolean
  
  // Documents metadata
  documents?: Record<string, any>
  document_processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  document_extraction_cache?: Record<string, any>
  
  // Property (Step 3)
  first_property_id?: string
  property_address?: string
  property_type?: string
  property_images?: string[]
  property_ownership_proof?: string
  property_verified?: boolean
  
  // Payment (Step 4)
  bank_name?: string
  account_number?: string
  account_name?: string
  account_type?: string
  bank_verification_status: 'pending' | 'verified' | 'failed'
  bank_statement_url?: string
  
  created_at: string
  updated_at: string
}

// Landlord profiles table
export interface LandlordProfile {
  id: string
  user_id: string
  full_name: string
  email: string
  phone: string
  profile_image_url?: string
  bio?: string
  is_verified: boolean
  verification_status: 'pending' | 'verified' | 'rejected'
  total_properties: number
  created_at: string
  updated_at: string
}

// Properties table
export interface Property {
  id: string
  landlord_id: string
  title: string
  description: string
  address: string
  city: string
  state: string
  property_type: string
  bedrooms: number
  bathrooms: number
  rent_amount: number
  deposit_amount: number
  square_feet?: number
  furnished: boolean
  available: boolean
  images: string[]
  featured_image?: string
  latitude?: number
  longitude?: number
  amenities?: string[]
  rules?: string[]
  verification_status: 'pending' | 'verified' | 'rejected'
  payment_frequency?: string
  created_at: string
  updated_at: string
}

// Document processing jobs
export interface DocumentProcessingJob {
  id: string
  landlord_id: string
  document_type: 'id_document' | 'selfie' | 'proof_of_address' | 'company_registration' | 'property_document' | 'bank_statement'
  file_url: string
  processing_status: 'pending' | 'processing' | 'completed' | 'failed'
  extraction_result?: Record<string, any>
  error_message?: string
  created_at: string
  updated_at: string
}

// Verification documents table
export interface VerificationDocument {
  id: string
  landlord_id: string
  document_type: 'id_document' | 'selfie' | 'proof_of_address' | 'company_registration' | 'property_document' | 'bank_statement'
  file_url: string
  file_name: string
  file_size: number
  mime_type: string
  verified: boolean
  verification_notes?: string
  created_at: string
  updated_at: string
}

// Onboarding progress table
export interface OnboardingProgress {
  id: string
  user_id: string
  current_step: number
  step_1_completed: boolean
  step_2_completed: boolean
  step_3_completed: boolean
  step_4_completed: boolean
  completed_at?: string
  created_at: string
  updated_at: string
}

// Storage bucket types
export type StorageBucket = 'landlord-documents' | 'landlord-verification' | 'property-images'

// API Response types
export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number
  page: number
  limit: number
  total_pages: number
}

// Form types for onboarding steps
export interface OnboardingStep1Form {
  full_name: string
  phone: string
  landlord_type: 'individual' | 'company'
  company_name?: string
  company_address?: string
  date_of_birth: string
  nin: string
  bvn: string
}

export interface OnboardingStep2Form {
  id_document_url: string
  proof_of_address_url: string
  company_registration_url?: string
  selfie_url: string
}

export interface OnboardingStep3Form {
  property_address: string
  property_type: string
  property_images: string[]
  property_ownership_proof: string
}

export interface OnboardingStep4Form {
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  bank_verification_number: string
  bank_statement_url: string
}