/**
 * Authentication Service
 * Handles all auth-related operations
 */

import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'
import {
  completePhase1Profile,
  completePhase2Profile,
  updateEmailVerification,
  updatePhoneVerification,
  completeOnboarding,
  updateVerificationStatus
} from '@/lib/profile-updates'
import {
  getLandlordProfile,
  completeLandlordPhase1Profile,
  completeLandlordPhase2Profile,
  completeLandlordPhase3Profile,
  completeLandlordOnboarding,
  updateLandlordVerificationStatus
} from '@/lib/profile-updates-landlord'

export const authService = {
  // Sign up functions
  signUpAdmin: async (fullName: string, email: string, password: string, adminCode: string) => {
    try {
      // Implementation for admin signup
      console.log('Admin signup:', { fullName, email })
      // TODO: Implement admin signup logic
      return { success: true }
    } catch (error) {
      toast.error('Admin signup failed')
      return { success: false, error }
    }
  },

  signUpTenant: async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Tenant signup starting...', { firstName, lastName, email })
      
      const supabase = createClient()
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            user_type: 'tenant'
          }
        }
      })
      
      if (authError) {
        console.error('❌ [AUTH] Auth signup error:', authError)
        toast.error(authError.message || 'Failed to create account')
        return { success: false, error: authError }
      }
      
      if (!authData.user) {
        toast.error('Failed to create user account')
        return { success: false, error: new Error('No user created') }
      }
      
      // 2. Create user record in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          user_type: 'tenant',
          auth_provider: 'email',
          email_verified: false,
          phone_verified: false,
          onboarding_completed: false,
          onboarding_step: 0,
          verification_status: 'pending'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('❌ [AUTH] User record error:', userError)
        toast.error('Failed to create user record')
        return { success: false, error: userError }
      }
      
      console.log('✅ [AUTH] Tenant signup successful:', userData)
      toast.success('Account created successfully! Please check your email to verify.')
      
      return { success: true, data: userData }
      
    } catch (error: any) {
      console.error('❌ [AUTH] Tenant signup error:', error)
      toast.error(error.message || 'Tenant signup failed')
      return { success: false, error }
    }
  },

  signUpLandlord: async (firstName: string, lastName: string, email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Landlord signup starting...', { firstName, lastName, email })
      
      const supabase = createClient()
      
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
            first_name: firstName,
            last_name: lastName,
            user_type: 'landlord'
          }
        }
      })
      
      if (authError) {
        console.error('❌ [AUTH] Auth signup error:', authError)
        toast.error(authError.message || 'Failed to create account')
        return { success: false, error: authError }
      }
      
      if (!authData.user) {
        toast.error('Failed to create user account')
        return { success: false, error: new Error('No user created') }
      }
      
      // 2. Create user record in users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          full_name: `${firstName} ${lastName}`,
          first_name: firstName,
          last_name: lastName,
          user_type: 'landlord',
          auth_provider: 'email',
          email_verified: false,
          phone_verified: false,
          onboarding_completed: false,
          onboarding_step: 0,
          verification_status: 'pending'
        })
        .select()
        .single()
      
      if (userError) {
        console.error('❌ [AUTH] User record error:', userError)
        toast.error('Failed to create user record')
        return { success: false, error: userError }
      }
      
      console.log('✅ [AUTH] Landlord signup successful:', userData)
      toast.success('Account created successfully! Please check your email to verify.')
      
      return { success: true, data: userData }
      
    } catch (error: any) {
      console.error('❌ [AUTH] Landlord signup error:', error)
      toast.error(error.message || 'Landlord signup failed')
      return { success: false, error }
    }
  },

  signUpTenantWithGoogle: async () => {
    try {
      console.log('🔐 [AUTH] Starting Google tenant signup')
      
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?user_type=tenant`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })

      if (error) {
        console.error('❌ [AUTH] Google signup error:', error)
        toast.error('Failed to sign up with Google')
        throw error
      }
      
    } catch (error: any) {
      console.error('❌ [AUTH] Google signup error:', error)
      toast.error('Failed to sign up with Google')
      throw error
    }
  },

  signUpLandlordWithGoogle: async () => {
    try {
      console.log('🔐 [AUTH] Starting Google landlord signup')
      
      const supabase = createClient()
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?user_type=landlord`,
          queryParams: {
            prompt: 'select_account',
            access_type: 'offline',
          },
        },
      })

      if (error) {
        console.error('❌ [AUTH] Google signup error:', error)
        toast.error('Failed to sign up with Google')
        throw error
      }
      
    } catch (error: any) {
      console.error('❌ [AUTH] Google signup error:', error)
      toast.error('Failed to sign up with Google')
      throw error
    }
  },

  // Sign in functions
  signIn: async (email: string, password: string) => {
    try {
      console.log('🔐 [AUTH] Sign in attempt:', { email })
      
      const supabase = createClient()
      
      // 1. Authenticate with Supabase
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (authError) {
        console.error('❌ [AUTH] Sign in error:', authError)
        toast.error(authError.message || 'Invalid email or password')
        return { user: null, redirectPath: '/signin' }
      }
      
      if (!authData.user) {
        toast.error('Failed to sign in')
        return { user: null, redirectPath: '/signin' }
      }
      
      // 2. Get user data from users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      if (userError || !userData) {
        console.error('❌ [AUTH] User data error:', userError)
        toast.error('User account not found')
        return { user: null, redirectPath: '/signin' }
      }
      
      // 3. Determine redirect path based on user_type
      let redirectPath = '/dashboard'
      if (userData.user_type === 'tenant') {
        redirectPath = '/tenant'
      } else if (userData.user_type === 'landlord') {
        redirectPath = '/landlord'
      } else if (userData.user_type === 'admin') {
        redirectPath = '/admin'
      }
      
      console.log('✅ [AUTH] Sign in successful:', { user: userData, redirectPath })
      toast.success(`Welcome back, ${userData.full_name || userData.email}!`)
      
      return { user: userData, redirectPath }
      
    } catch (error: any) {
      console.error('❌ [AUTH] Sign in error:', error)
      toast.error(error.message || 'Sign in failed')
      return { user: null, redirectPath: '/signin' }
    }
  },

  signInWithGoogle: async () => {
    try {
      // Implementation for Google sign in
      // TODO: Implement Google OAuth sign in
      return { success: true }
    } catch (error) {
      toast.error('Google sign in failed')
      return { success: false, error }
    }
  },

  // Sign out
  signOut: async () => {
    try {
      console.log('🔐 [AUTH] Signing out...')
      
      const supabase = createClient()
      
      // Sign out from Supabase
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        console.error('❌ [AUTH] Sign out error:', error)
        toast.error('Failed to sign out')
        return
      }
      
      console.log('✅ [AUTH] Signed out successfully')
      toast.success('Signed out successfully')
      
    } catch (error: any) {
      console.error('❌ [AUTH] Sign out error:', error)
      toast.error(error.message || 'Failed to sign out')
    }
  },

  // Reset password
  resetPassword: async (email: string) => {
    try {
      console.log('Password reset request:', { email })
      // TODO: Implement password reset logic
      return { success: true }
    } catch (error) {
      toast.error('Password reset failed')
      return { success: false, error }
    }
  },

  // Profile updates
  updateUserProfile: async (updates: any) => {
    try {
      console.log('Updating profile:', updates)
      // TODO: Implement profile update logic
    } catch (error) {
      toast.error('Profile update failed')
      throw error
    }
  },

  completePhase1Profile: async (userId: string, profileData: any) => {
    try {
      console.log('Completing phase 1 profile:', profileData)
      await completePhase1Profile(userId, profileData)
    } catch (error) {
      toast.error('Phase 1 profile update failed')
      throw error
    }
  },

  completePhase2Profile: async (userId: string, documents: any[]) => {
    try {
      console.log('Completing phase 2 profile:', documents.length)
      await completePhase2Profile(userId, documents)
    } catch (error) {
      toast.error('Phase 2 profile update failed')
      throw error
    }
  },

  updateEmailVerification: async (userId: string) => {
    try {
      console.log('Updating email verification')
      await updateEmailVerification(userId)
    } catch (error) {
      toast.error('Email verification update failed')
      throw error
    }
  },

  updatePhoneVerification: async (userId: string, phoneNumber: string) => {
    try {
      console.log('Updating phone verification:', phoneNumber)
      await updatePhoneVerification(userId, phoneNumber)
    } catch (error) {
      toast.error('Phone verification update failed')
      throw error
    }
  },

  completeOnboarding: async (userId: string, userType: 'tenant' | 'landlord' | 'admin') => {
    try {
      console.log('Completing onboarding')
      await completeOnboarding(userId, userType)
    } catch (error) {
      toast.error('Onboarding completion failed')
      throw error
    }
  }
}
