// Profile Update Utilities for Tenant and Landlord Verification

import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';

// Lazy-load the client to avoid AbortError during module initialization
function getSupabaseClient() {
  return createClient();
}

// Phase 1: Basic Profile Completion
export const completePhase1Profile = async (userId: string, profileData: any) => {
  try {
    console.log('📝 [PROFILE] Completing Phase 1 profile:', profileData);
    
    const { data, error } = await getSupabaseClient()
      .from('users')
      .update({
        ...profileData,
        onboarding_step: 2,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error updating Phase 1 profile:', error);
      toast.error('Failed to update profile');
      throw error;
    }

    console.log('✅ [PROFILE] Phase 1 profile completed:', data);
    toast.success('Profile updated successfully!');
    return data;
    
  } catch (error: any) {
    console.error('❌ [PROFILE] Error in Phase 1 profile update:', error);
    toast.error('Failed to update profile');
    throw error;
  }
};

// Phase 2: Document Upload & Verification
export const completePhase2Profile = async (userId: string, documents: any[]) => {
  try {
    console.log('📝 [PROFILE] Completing Phase 2 with documents:', documents);
    
    const { data, error } = await getSupabaseClient()
      .from('users')
      .update({
        onboarding_step: 3,
        verification_status: 'pending',
        documents_submitted: true,
        documents: documents,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error updating Phase 2 profile:', error);
      toast.error('Failed to submit documents');
      throw error;
    }

    console.log('✅ [PROFILE] Phase 2 documents submitted:', data);
    toast.success('Documents submitted successfully! Your account is now under review.');
    return data;
    
  } catch (error: any) {
    console.error('❌ [PROFILE] Error in Phase 2 document submission:', error);
    toast.error('Failed to submit documents');
    throw error;
  }
};

// Update Email Verification Status
export const updateEmailVerification = async (userId: string) => {
  try {
    console.log('📧 [PROFILE] Updating email verification for user:', userId);
    
    const { data, error } = await getSupabaseClient()
      .from('users')
      .update({
        email_verified: true,
        onboarding_step: 2,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error updating email verification:', error);
      toast.error('Failed to verify email');
      throw error;
    }

    console.log('✅ [PROFILE] Email verification updated:', data);
    return data;
    
  } catch (error: any) {
    console.error('❌ [PROFILE] Error updating email verification:', error);
    toast.error('Failed to verify email');
    throw error;
  }
};

// Update Phone Verification Status
export const updatePhoneVerification = async (userId: string, phoneNumber: string) => {
  try {
    console.log('📱 [PROFILE] Updating phone verification for user:', userId);
    
    const { data, error } = await getSupabaseClient()
      .from('users')
      .update({
        phone_number: phoneNumber,
        phone_verified: true,
        onboarding_step: 3,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error updating phone verification:', error);
      toast.error('Failed to verify phone');
      throw error;
    }

    console.log('✅ [PROFILE] Phone verification updated:', data);
    toast.success('Phone number verified successfully!');
    return data;
    
  } catch (error: any) {
    console.error('❌ [PROFILE] Error updating phone verification:', error);
    toast.error('Failed to verify phone');
    throw error;
  }
};

// Complete Onboarding - Updated to accept admin type
export const completeOnboarding = async (userId: string, userType: 'tenant' | 'landlord' | 'admin') => {
  try {
    console.log('🎉 [PROFILE] Completing onboarding for user:', userId, userType);
    
    const updateData: any = {
      onboarding_completed: true,
      onboarding_step: 4,
      updated_at: new Date().toISOString()
    };

    // For tenants, mark as ready for properties
    if (userType === 'tenant') {
      updateData.verification_status = 'approved';
    }
    
    // For admins, no special verification needed
    if (userType === 'admin') {
      updateData.verification_status = 'approved';
    }

    const { data, error } = await getSupabaseClient()
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
      throw error;
    }

    console.log('✅ [PROFILE] Onboarding completed:', data);
    toast.success('Onboarding completed successfully!');
    return data;
    
  } catch (error: any) {
    console.error('❌ [PROFILE] Error completing onboarding:', error);
    toast.error('Failed to complete onboarding');
    throw error;
  }
};

// Update Verification Status (for admin updates)
export const updateVerificationStatus = async (userId: string, status: 'pending' | 'under_review' | 'approved' | 'rejected', reason?: string) => {
  try {
    console.log('🔍 [PROFILE] Updating verification status:', { userId, status, reason });
    
    const updateData: any = {
      verification_status: status,
      updated_at: new Date().toISOString()
    };

    if (reason) {
      updateData.verification_reason = reason;
    }

    const { data, error } = await getSupabaseClient()
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [PROFILE] Error updating verification status:', error);
      toast.error('Failed to update verification status');
      throw error;
    }

    console.log('✅ [PROFILE] Verification status updated:', data);
    return data;
    
  } catch (error: any) {
    console.error('❌ [PROFILE] Error updating verification status:', error);
    toast.error('Failed to update verification status');
    throw error;
  }
};