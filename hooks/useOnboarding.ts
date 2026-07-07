/**
 * FIXED Onboarding Hook - Correct API Integration
 * No naming conflicts, proper arguments
 */

'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { submitCompleteOnboarding as apiSubmitOnboarding, getFeatureFlags } from '@/lib/api/onboarding'
import { useDashboard } from '@/contexts/DashboardContext'

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
  nin_document?: string
}

export interface OnboardingStep3Data {
  property_address: string
  property_type: string
  property_images?: string[]
  property_ownership_proof: string
}

export interface OnboardingStep4Data {
  bank_name: string
  bank_account_number: string
  bank_account_name: string
  bank_verification_number?: string
  bank_statement_url?: string
  guarantor_id_url?: string
  insurance_document_url?: string
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
  const pathname = usePathname()
  const { user, loading, updateUserProfile } = useAuth()
  const { invalidateLandlordCache } = useDashboard()
  const [isProcessing, setIsProcessing] = useState(false)
  const [currentStep, setCurrentStep] = useState(1)
  const [isReady, setIsReady] = useState(false)

  const [step1Data, setStep1Data] = useState<OnboardingStep1Data | null>(null)
  const [step2Data, setStep2Data] = useState<OnboardingStep2Data | null>(null)
  const [step3Data, setStep3Data] = useState<OnboardingStep3Data | null>(null)
  const [step4Data, setStep4Data] = useState<OnboardingStep4Data | null>(null)

  // ── Feature Flags ──
  const [featureFlags, setFeatureFlags] = useState({
    enable_property_step: true,
    total_steps: 4,
    skipped_steps: [] as number[],
    active_steps: [1, 2, 3, 4]
  })

  // ── Fetch feature flags on mount ──
  useEffect(() => {
    const fetchFlags = async () => {
      try {
        const flags = await getFeatureFlags()
        setFeatureFlags(flags)
        console.log('✅ [HOOK] Feature flags loaded:', flags)
      } catch (error) {
        console.warn('⚠️ [HOOK] Failed to load feature flags, using defaults:', error)
      }
    }
    fetchFlags()
  }, [])

  // ── Helper: Get next step number based on feature flags ──
  const getNextStep = useCallback((currentStep: number): number => {
    // If property step is disabled and we're at step 2, skip to step 4
    if (!featureFlags.enable_property_step && currentStep === 2) {
      console.log('⏭️ [HOOK] Property step disabled - skipping from Step 2 to Step 4')
      return 4
    }
    return currentStep + 1
  }, [featureFlags.enable_property_step])

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

  // ── AUTH GUARD ────────────────────────────────────────────────────────────
  // Runs once after auth is resolved. Handles all redirect logic in one place
  // so individual step pages don't need to repeat it.
  //
  // KEY FIX: After Google OAuth callback, the AuthContext user object can be
  // stale (user_type still 'tenant'). Query it fresh from the database instead
  // of trusting the potentially stale session metadata.
  //
  // KEY FIX: Google OAuth users have their email verified by Google, but
  // user.email_verified in the DB can be false right after sign-up (the trigger
  // hasn't fired yet, or doesn't set the flag for OAuth users). Sending them to
  // the confirmation page is wrong — they never got a confirmation email.
  // We detect OAuth users via user.auth_provider === 'google'.
  //
  // FIX: Also verify onboarding status in database for established users with
  // potentially stale session metadata (e.g., when network is unreliable)
  useEffect(() => {
    // Still loading - wait for auth to resolve
    if (loading) return

    // Auth resolved but no user - redirect to signin
    if (!user) {
      console.log('❌ [HOOK] User not authenticated, redirecting to signin...')
      toast.error('Please sign in to continue')
      router.push('/signin')
      return
    }

    // ✅ CRITICAL FIX: Query fresh user_type from database instead of trusting
    // the potentially stale AuthContext user object (especially after Google OAuth)
    const verifyUserType = async () => {
      try {
        const { createClient } = await import('@/utils/supabase/client')
        const supabase = createClient()
        
        const { data: freshUser, error } = await supabase
          .from('users')
          .select('user_type, email_verified, onboarding_completed, auth_provider')
          .eq('id', user.id)
          .single()
        
        if (error) {
          console.warn('⚠️ [HOOK] Failed to fetch fresh user data:', error.message)
          // Fallback to potentially stale user object
          if (user.user_type !== 'landlord') {
            toast.error('This page is only for landlords')
            router.push('/properties')
          }
          return
        }

        // 1. Check user type (use fresh data from database)
        if (freshUser.user_type !== 'landlord') {
          console.log('❌ [HOOK] User type mismatch:', {
            db: freshUser.user_type,
            context: user.user_type
          })
          toast.error('This page is only for landlords')
          router.push('/properties')
          return
        }

        // Update user object with fresh data for rest of the auth checks
        const freshUserData = {
          ...user,
          ...freshUser,
          auth_provider: freshUser.auth_provider || user.auth_provider
        }
        
        continueAuthGuard(freshUserData)
      } catch (err) {
        console.error('⚠️ [HOOK] Error fetching fresh user data:', err)
        // Fallback: check stale user object
        if (user.user_type !== 'landlord') {
          toast.error('This page is only for landlords')
          router.push('/properties')
          return
        }
        continueAuthGuard(user)
      }
    }

    // Helper function for remaining auth checks
    const continueAuthGuard = (freshUserData: any) => {
      // 2. Email not verified — skip for Google OAuth users
      const isOAuthUser =
        freshUserData.auth_provider === 'google' ||
        (freshUserData as any).provider === 'google'

      if (!freshUserData.email_verified && !isOAuthUser) {
        console.log('❌ [HOOK] Email not verified and not OAuth user')
        toast.error('Please verify your email first')
        router.push('/signup/landlord/confirmation')
        return
      }

      // 3. Onboarding completed — verify against DB before redirecting
      //    (the flag can go stale on partial submits)
      //    IMPORTANT: Skip this redirect if the user is on a step page right now.
      //    When step-5 submits, it sets onboarding_completed=true which triggers
      //    this effect — but the step page handles its own redirect to
      //    verification-pending. Redirecting here simultaneously causes a bounce.
      const isOnStepPage = pathname?.includes('/onboarding/landlord/step-')
      if (freshUserData.onboarding_completed && !isOnStepPage) {
        const verify = async () => {
          try {
            const { createClient } = await import('@/utils/supabase/client')
            const supabase = createClient()
            const { data } = await supabase
              .from('landlord_onboarding')
              .select('all_steps_completed, submitted_for_review')
              .eq('landlord_id', freshUserData.id)
              .single()

            if (data?.all_steps_completed && data?.submitted_for_review) {
              console.log('✅ [HOOK] Onboarding complete, redirecting to dashboard')
              router.push('/landlord/overview')
            } else {
              // Flag is stale — reset it and let the user continue
              await supabase
                .from('users')
                .update({ onboarding_completed: false })
                .eq('id', freshUserData.id)
              console.log('🔄 [HOOK] Reset stale onboarding flag')
              setIsReady(true)
            }
          } catch (e) {
            console.error('⚠️ [HOOK] Verification error:', e)
            // Can't confirm — let the user through rather than blocking them
            setIsReady(true)
          }
        }
        verify()
        return
      }

      // 4. Onboarding NOT completed - but for established users, verify in database
      //    to avoid incorrect redirects due to stale session metadata
      if (!freshUserData.onboarding_completed && !isOnStepPage) {
        const isNewUser = freshUserData.created_at && 
          (Date.now() - new Date(freshUserData.created_at).getTime()) < 5 * 60 * 1000; // Created less than 5 min ago
        
        if (isNewUser) {
          // New user - allow onboarding flow
          console.log('👤 [HOOK] New landlord user, allowing onboarding...')
          setIsReady(true)
        } else {
          // Established user with potentially stale session - verify in database
          console.log('⏳ [HOOK] Established landlord user, verifying onboarding status in database...')
          const verify = async () => {
            try {
              const { createClient } = await import('@/utils/supabase/client')
              const supabase = createClient()
              const { data } = await supabase
                .from('landlord_onboarding')
                .select('all_steps_completed, submitted_for_review')
                .eq('landlord_id', freshUserData.id)
                .single()

              console.log('📊 [HOOK] Database check result:', data)

              if (data?.all_steps_completed && data?.submitted_for_review) {
                // Onboarding actually complete - redirect to dashboard
                console.log('✅ [HOOK] Onboarding complete, redirecting to dashboard...')
                router.push('/landlord/overview')
              } else {
                // Onboarding incomplete - allow step pages
                console.log('🎓 [HOOK] Onboarding incomplete, allowing steps...')
                setIsReady(true)
              }
            } catch (error) {
              console.error('⚠️ [HOOK] Database verification failed:', error)
              // On error, let the user continue (they might be in the middle of onboarding)
              console.log('💭 [HOOK] Continuing due to verification error...')
              setIsReady(true)
            }
          }
          verify()
          return
        }
      }

      // All checks passed
      console.log('✅ [HOOK] All auth guards passed, ready for onboarding')
      setIsReady(true)
    }

    verifyUserType()
  }, [loading, user, router, pathname])

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
        nin_document: data.nin_document || '',
        uploaded: true,
      }

      const saved = storage.save(STORAGE_KEYS.STEP_2, storageData)
      if (!saved) throw new Error('Failed to save to localStorage')

      setStep2Data(data)

      // ── OPTIONAL STEP 3: Check feature flag ──
      const nextStep = getNextStep(2)
      console.log(`📍 [STEP 2] Next step determined: ${nextStep} (property_step_enabled=${featureFlags.enable_property_step})`)

      storage.save(STORAGE_KEYS.CURRENT_STEP, nextStep)
      setCurrentStep(nextStep)

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
  }, [getNextStep, featureFlags.enable_property_step])

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

      if (!s1 || !s2 || !s4) {
        throw new Error('Please complete all steps first')
      }

      // ── OPTIONAL STEP 3: Only require if enabled ──
      // If feature flags haven't loaded yet, use conservative default (skip property step)
      const propertyStepEnabled = featureFlags?.enable_property_step ?? false
      if (propertyStepEnabled && !s3) {
        throw new Error('Please complete property step first')
      }

      console.log('📦 [SUBMIT] Collected data from localStorage')

      // 2. Prepare payload for backend API
      const payload: any = {
        landlord_id: userId,
        email: email,

        // Step 1 - Basic info
        full_name: s1.full_name,
        phone: s1.phone,
        date_of_birth: s1.date_of_birth,
        landlord_type: s1.landlord_type,
        company_name: s1.company_name,
        company_address: s1.company_address,

        // Step 2 - Documents
        id_document_url: s2.id_document,
        selfie_url: s2.selfie,
        nin_document_url: s2.nin_document,

        // Step 3 - Property (optional, only include if exists)
        property_address: s3?.property_address || null,
        property_type: s3?.property_type || null,

        // Step 4 - Bank details
        bank_name: s4.bank_name,
        account_number: s4.bank_account_number,
        account_name: s4.bank_account_name,
        bank_statement_url: s4.bank_statement_url,
        guarantor_id_url: s4.guarantor_id_url,
        insurance_document_url: s4.insurance_document_url,
      }

      console.log('📤 [SUBMIT] Payload prepared:', payload)
      console.log('📤 [SUBMIT] Calling backend API via apiSubmitOnboarding...')

      // 3. Call backend API using the RENAMED import
      // This avoids the naming conflict!
      const result = await apiSubmitOnboarding(payload)

      console.log(' [SUBMIT] Backend API response:', result)

      // 4. Bust the dashboard cache immediately so the overview page
      //    re-fetches fresh data (updated onboarding + verification_status)
      //    instead of showing the stale cached snapshot.
      invalidateLandlordCache()
      console.log('🔄 [SUBMIT] Dashboard cache invalidated')

      // 5. Update user verification_status locally for MVP
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

      // toast.success(' Onboarding submitted for review!')
      
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
  }, [router, invalidateLandlordCache, featureFlags.enable_property_step])

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
    isReady,
    currentStep,
    isProcessing,
    step1Data,
    step2Data,
    step3Data,
    step4Data,
    featureFlags, // Added this!
    saveStep1,
    saveStep2,
    saveStep3,
    saveStep4,
    submitCompleteOnboarding,
    clearData,
    exportData,
  }
}

