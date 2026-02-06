/**
 * FIXED Onboarding Hook - Correct API Integration
 * No naming conflicts, proper arguments
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
// ✅ FIX: Rename import to avoid conflict
import { submitCompleteOnboarding as apiSubmitOnboarding } from '@/lib/api/onboarding'

// ============================================================================
// TYPES
// ============================================================================

export interface OnboardingStep1Data {
  full_name: string
  phone: string
  date_of_birth: string
  landlord_type: 'individual' | 'company'
  company_name?: string
  company_address?: string
  nin: string
  bvn: string
}

export interface OnboardingStep2Data {
  id_document: string
  proof_of_address: string
  cac_certificate: string
  selfie: string
}

export interface OnboardingStep3Data {
  property_address: string
  property_type: string
  property_images: string[]
  property_ownership_proof: string
}

export interface OnboardingStep4Data {
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  bank_verification_number?: string
  bank_statement_url?: string
}

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

const STORAGE_KEYS = {
  STEP_1: 'nulo_onboarding_step1',
  STEP_2: 'nulo_onboarding_step2',
  STEP_3: 'nulo_onboarding_step3',
  STEP_4: 'nulo_onboarding_step4',
  CURRENT_STEP: 'nulo_onboarding_current_step',
  STARTED_AT: 'nulo_onboarding_started_at',
}

// ============================================================================
// LOCAL STORAGE UTILITIES
// ============================================================================

const storage = {
  save: (key: string, data: any) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(key, JSON.stringify(data))
        console.log(`✅ [STORAGE] Saved ${key}`)
        return true
      }
      return false
    } catch (error) {
      console.error(`❌ [STORAGE] Error saving ${key}:`, error)
      return false
    }
  },

  load: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        const data = localStorage.getItem(key)
        if (data) {
          return JSON.parse(data)
        }
      }
      return null
    } catch (error) {
      console.error(`❌ [STORAGE] Error loading ${key}:`, error)
      return null
    }
  },

  remove: (key: string) => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
        console.log(`✅ [STORAGE] Removed ${key}`)
      }
    } catch (error) {
      console.error(`❌ [STORAGE] Error removing ${key}:`, error)
    }
  },

  clearAll: () => {
    Object.values(STORAGE_KEYS).forEach(key => storage.remove(key))
    console.log('✅ [STORAGE] All onboarding data cleared')
  }
}

// ============================================================================
// MAIN HOOK
// ============================================================================

export function useOnboarding() {
  const router = useRouter()
  const { user, updateUserProfile } = useAuth() // Add this line
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)

  const [step1Data, setStep1Data] = useState<OnboardingStep1Data | null>(null)
  const [step2Data, setStep2Data] = useState<OnboardingStep2Data | null>(null)
  const [step3Data, setStep3Data] = useState<OnboardingStep3Data | null>(null)
  const [step4Data, setStep4Data] = useState<OnboardingStep4Data | null>(null)

  // Load data on mount
  useEffect(() => {
    console.log('🔄 [HOOK] Loading onboarding data from localStorage...')
    
    const savedStep = storage.load(STORAGE_KEYS.CURRENT_STEP)
    if (savedStep) {
      setCurrentStep(savedStep)
      console.log(`📍 [HOOK] Current step: ${savedStep}`)
    }

    const s1 = storage.load(STORAGE_KEYS.STEP_1)
    const s2 = storage.load(STORAGE_KEYS.STEP_2)
    const s3 = storage.load(STORAGE_KEYS.STEP_3)
    const s4 = storage.load(STORAGE_KEYS.STEP_4)

    console.log('🔍 [HOOK] Raw data from localStorage:', {
      s1: s1 ? 'exists' : 'null',
      s2: s2 ? 'exists' : 'null', 
      s3: s3 ? 'exists' : 'null',
      s4: s4 ? 'exists' : 'null'
    })

    if (s1) {
      setStep1Data(s1)
      console.log('✅ [HOOK] Step 1 data set:', Object.keys(s1))
    }
    if (s2) {
      setStep2Data(s2)
      console.log('✅ [HOOK] Step 2 data set:', Object.keys(s2))
    }
    if (s3) {
      setStep3Data(s3)
      console.log('✅ [HOOK] Step 3 data set:', Object.keys(s3))
    }
    if (s4) {
      setStep4Data(s4)
      console.log('✅ [HOOK] Step 4 data set:', Object.keys(s4))
    }
  }, [])

  // SAVE STEP 1 - localStorage only (fast!)
  const saveStep1 = useCallback(async (data: OnboardingStep1Data) => {
    console.log('📤 [STEP 1] Saving data to localStorage...')
    setIsProcessing(true)

    try {
      const saved = storage.save(STORAGE_KEYS.STEP_1, data)
      if (!saved) throw new Error('Failed to save to localStorage')

      setStep1Data(data)
      storage.save(STORAGE_KEYS.CURRENT_STEP, 2)
      setCurrentStep(2)

      if (!storage.load(STORAGE_KEYS.STARTED_AT)) {
        storage.save(STORAGE_KEYS.STARTED_AT, new Date().toISOString())
      }

      console.log('✅ [STEP 1] Data saved successfully')
      toast.success('Step 1 completed!')
      return true
    } catch (error: any) {
      console.error('❌ [STEP 1] Error saving:', error)
      toast.error(error.message || 'Failed to save step 1')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // SAVE STEP 2 - localStorage only (fast!)
  const saveStep2 = useCallback(async (data: OnboardingStep2Data) => {
    console.log('📤 [STEP 2] Saving data to localStorage...')
    setIsProcessing(true)

    try {
      const storageData = {
        id_document: data.id_document || '',
        proof_of_address: data.proof_of_address || '',
        cac_certificate: data.cac_certificate || '',
        selfie: data.selfie || '',
        uploaded: true,
      }

      const saved = storage.save(STORAGE_KEYS.STEP_2, storageData)
      if (!saved) throw new Error('Failed to save to localStorage')

      setStep2Data(data)
      storage.save(STORAGE_KEYS.CURRENT_STEP, 3)
      setCurrentStep(3)

      console.log('✅ [STEP 2] Data saved successfully')
      toast.success('Documents uploaded!')
      return true
    } catch (error: any) {
      console.error('❌ [STEP 2] Error saving:', error)
      toast.error(error.message || 'Failed to save step 2')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // SAVE STEP 3 - localStorage only (fast!)
  const saveStep3 = useCallback(async (data: OnboardingStep3Data) => {
    console.log('📤 [STEP 3] Saving data to localStorage...')
    setIsProcessing(true)

    try {
      const saved = storage.save(STORAGE_KEYS.STEP_3, data)
      if (!saved) throw new Error('Failed to save to localStorage')

      setStep3Data(data)
      storage.save(STORAGE_KEYS.CURRENT_STEP, 4)
      setCurrentStep(4)

      console.log('✅ [STEP 3] Data saved successfully')
      toast.success('Property details saved!')
      return true
    } catch (error: any) {
      console.error('❌ [STEP 3] Error saving:', error)
      toast.error(error.message || 'Failed to save step 3')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // SAVE STEP 4 - localStorage only (fast!)
  const saveStep4 = useCallback(async (data: OnboardingStep4Data) => {
    console.log('📤 [STEP 4] Saving data to localStorage...')
    setIsProcessing(true)

    try {
      const saved = storage.save(STORAGE_KEYS.STEP_4, data)
      if (!saved) throw new Error('Failed to save to localStorage')

      setStep4Data(data)
      storage.save(STORAGE_KEYS.CURRENT_STEP, 5)
      setCurrentStep(5)

      console.log('✅ [STEP 4] Data saved successfully')
      toast.success('Bank details saved!')
      return true
    } catch (error: any) {
      console.error('❌ [STEP 4] Error saving:', error)
      toast.error(error.message || 'Failed to save step 4')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [])

  // ✅ SUBMIT COMPLETE ONBOARDING - Calls Backend API
  // ✅ FIX: Uses apiSubmitOnboarding (renamed import) to avoid conflict
  const submitCompleteOnboarding = useCallback(async (userId: string, email: string) => {
    console.log('📤 [SUBMIT] Submitting complete onboarding to BACKEND API...')
    setIsProcessing(true)

    try {
      // 1. Get all data from localStorage
      const s1 = storage.load(STORAGE_KEYS.STEP_1)
      const s2 = storage.load(STORAGE_KEYS.STEP_2)
      const s3 = storage.load(STORAGE_KEYS.STEP_3)
      const s4 = storage.load(STORAGE_KEYS.STEP_4)

      if (!s1 || !s2 || !s3 || !s4) {
        throw new Error('Please complete all steps first')
      }

      console.log('📦 [SUBMIT] Collected data from localStorage')

      // 2. Prepare payload for backend API
      const payload = {
        landlord_id: userId,
        email: email,
        
        // Step 1 - Basic info
        full_name: s1.full_name,
        phone: s1.phone,
        date_of_birth: s1.date_of_birth,
        landlord_type: s1.landlord_type,
        company_name: s1.company_name,
        company_address: s1.company_address,
        
        // Step 3 - Property
        property_address: s3.property_address,
        property_type: s3.property_type,
        
        // Step 4 - Bank details
        bank_name: s4.bank_name,
        account_number: s4.bank_account_number,
        account_name: s4.bank_account_name,
      }

      console.log('📤 [SUBMIT] Payload prepared:', payload)
      console.log('📤 [SUBMIT] Calling backend API via apiSubmitOnboarding...')

      // 3. Call backend API using the RENAMED import
      // This avoids the naming conflict!
      const result = await apiSubmitOnboarding(payload)

      console.log(' [SUBMIT] Backend API response:', result)

      // 4. Update user verification_status locally for MVP
      // This ensures UI shows correct status even if backend is down
      if (user && updateUserProfile) {
        console.log('🔄 [SUBMIT] Updating user verification_status to pending')
        await updateUserProfile({
          verification_status: 'pending', // ✅ Fixed: Use 'pending' instead of 'under_review' (valid constraint value)
          onboarding_completed: true
        })
        console.log('✅ [SUBMIT] User status updated successfully')
      }

      // 5. Clear localStorage after successful submission
      storage.clearAll()

      toast.success(' Onboarding submitted for review!')
      
      // // 6. Redirect to pending review page
      // setTimeout(() => {
      //   router.push('/onboarding/landlord/verification-pending')
      // }, 2000)

      return true
    } catch (error: any) {
      console.error(' [SUBMIT] Error submitting to backend:', error)
      toast.error(error.message || 'Failed to submit onboarding')
      return false
    } finally {
      setIsProcessing(false)
    }
  }, [router])

  const clearData = useCallback(() => {
    storage.clearAll()
    setCurrentStep(1)
    setStep1Data(null)
    setStep2Data(null)
    setStep3Data(null)
    setStep4Data(null)
    toast.info('All onboarding data cleared')
  }, [])

  const exportData = useCallback(() => {
    const data = {
      currentStep,
      step1Data,
      step2Data,
      step3Data,
      step4Data,
    }
    return JSON.stringify(data, null, 2)
  }, [currentStep, step1Data, step2Data, step3Data, step4Data])

  return {
    currentStep,
    isProcessing,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    saveStep1,
    saveStep2,
    saveStep3,
    saveStep4,
    submitCompleteOnboarding, // ✅ This is the hook's function
    clearData,
    exportData,
  }
}