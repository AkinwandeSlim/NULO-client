/**
 * Landlord Profile Updates Module
 * Handles all landlord-specific profile updates using the landlord_profiles table
 */

import { createClient } from '@/utils/supabase/client'
import { toast } from 'sonner'

// Lazy-load the client to avoid AbortError during module initialization
function getSupabaseClient() {
  return createClient()
}

// Create or update landlord profile
export const createOrUpdateLandlordProfile = async (userId: string, profileData: any) => {
  try {
    console.log('📝 [LANDLORD PROFILE] Creating/updating landlord profile:', profileData);
    
    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .upsert({
        id: userId,
        ...profileData,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error creating/updating profile:', error);
      toast.error('Failed to save landlord profile');
      throw error;
    }

    console.log('✅ [LANDLORD PROFILE] Profile saved successfully:', data);
    return data;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Unexpected error:', error);
    toast.error('Failed to save landlord profile');
    throw error;
  }
};

// Phase 1: Basic Profile Completion (account_type, company_name, etc.)
export const completeLandlordPhase1Profile = async (userId: string, profileData: any) => {
  try {
    console.log('📝 [LANDLORD PROFILE] Completing Phase 1 profile:', profileData);
    
    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .upsert({
        id: userId,
        account_type: profileData.landlord_type || 'individual',
        company_name: profileData.company_name || null,
        date_of_birth: profileData.date_of_birth || null,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error in Phase 1:', error);
      toast.error('Failed to save basic information');
      throw error;
    }

    // Also update users table with basic info
    const { error: userError } = await getSupabaseClient()
      .from('users')
      .update({
        full_name: profileData.full_name,
        phone_number: profileData.phone_number,
        onboarding_step: 2,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('❌ [LANDLORD PROFILE] Error updating user info:', userError);
      toast.error('Failed to save basic information');
      throw userError;
    }

    console.log('✅ [LANDLORD PROFILE] Phase 1 completed successfully');
    return data;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Error in Phase 1:', error);
    toast.error('Failed to save basic information');
    throw error;
  }
};

// Phase 2: Document Upload & Verification (NIN, BVN, documents)
export const completeLandlordPhase2Profile = async (userId: string, documents: any[]) => {
  try {
    console.log('📝 [LANDLORD PROFILE] Completing Phase 2 with documents:', documents);
    
    const documentData = {
      nin: documents.find(doc => doc.type === 'nin')?.number || null,
      bvn: documents.find(doc => doc.type === 'bvn')?.number || null,
      id_document_url: documents.find(doc => doc.type === 'id_document')?.url || null,
      selfie_photo_url: documents.find(doc => doc.type === 'selfie')?.url || null,
      proof_of_address_url: documents.find(doc => doc.type === 'proof_of_address')?.url || null,
      verification_submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .update(documentData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error in Phase 2:', error);
      toast.error('Failed to upload documents');
      throw error;
    }

    // Update users table
    const { error: userError } = await getSupabaseClient()
      .from('users')
      .update({
        onboarding_step: 3,
        verification_status: 'pending',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('❌ [LANDLORD PROFILE] Error updating user status:', userError);
      toast.error('Failed to update status');
      throw userError;
    }

    console.log('✅ [LANDLORD PROFILE] Phase 2 completed successfully');
    return data;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Error in Phase 2:', error);
    toast.error('Failed to upload documents');
    throw error;
  }
};

// Phase 3: Property Information
export const completeLandlordPhase3Profile = async (userId: string, propertyData: any) => {
  try {
    console.log('📝 [LANDLORD PROFILE] Completing Phase 3 with properties:', propertyData);
    
    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .update({
        owns_properties: true,
        number_of_properties: propertyData.properties?.length || 0,
        property_addresses: propertyData.properties || [],
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error in Phase 3:', error);
      toast.error('Failed to save property information');
      throw error;
    }

    // Update users table
    const { error: userError } = await getSupabaseClient()
      .from('users')
      .update({
        onboarding_step: 4,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('❌ [LANDLORD PROFILE] Error updating user status:', userError);
      toast.error('Failed to update status');
      throw userError;
    }

    console.log('✅ [LANDLORD PROFILE] Phase 3 completed successfully');
    return data;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Error in Phase 3:', error);
    toast.error('Failed to save property information');
    throw error;
  }
};

// Phase 4: Complete Onboarding (Bank details, verification fee)
export const completeLandlordOnboarding = async (userId: string, finalData: any) => {
  try {
    console.log('📝 [LANDLORD PROFILE] Completing onboarding with final data:', finalData);
    
    const updateData: any = {
      bank_account_number: finalData.bank_account_number || null,
      bank_name: finalData.bank_name || null,
      account_name: finalData.account_name || null,
      verification_fee_paid: finalData.verification_fee_paid || false,
      verification_fee_amount: 5000, // 50 NGN in kobo
      verification_fee_reference: finalData.verification_fee_reference || null,
      verification_fee_paid_at: finalData.verification_fee_paid ? new Date().toISOString() : null,
      updated_at: new Date().toISOString()
    };

    // Add company documents if company type
    if (finalData.account_type === 'company') {
      updateData.cac_certificate_url = finalData.cac_certificate_url || null;
      updateData.tax_clearance_url = finalData.tax_clearance_url || null;
      updateData.cac_number = finalData.cac_number || null;
      updateData.tax_id = finalData.tax_id || null;
    }

    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error completing onboarding:', error);
      toast.error('Failed to complete onboarding');
      throw error;
    }

    // Update users table
    const { error: userError } = await getSupabaseClient()
      .from('users')
      .update({
        onboarding_completed: true,
        onboarding_step: 4,
        verification_status: 'pending', // Will be updated to 'approved' after admin review
        trust_score: 70, // Full trust score after completing onboarding
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('❌ [LANDLORD PROFILE] Error updating user status:', userError);
      toast.error('Failed to complete onboarding');
      throw userError;
    }

    console.log('✅ [LANDLORD PROFILE] Onboarding completed successfully');
    return data;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Error completing onboarding:', error);
    toast.error('Failed to complete onboarding');
    throw error;
  }
};

// Get landlord profile with user info
export const getLandlordProfile = async (userId: string) => {
  try {
    console.log('🔍 [LANDLORD PROFILE] Fetching landlord profile for:', userId);
    
    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .select(`
        *,
        users!landlord_profiles_id_fkey (
          id,
          email,
          full_name,
          phone_number,
          user_type,
          email_verified,
          phone_verified,
          onboarding_completed,
          onboarding_step,
          verification_status,
          trust_score,
          created_at,
          updated_at
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error fetching profile:', error);
      return null;
    }

    // Merge user and landlord profile data
    const mergedData = {
      ...data.users,
      ...data,
      landlord_type: data.account_type
    };

    console.log('✅ [LANDLORD PROFILE] Profile fetched successfully');
    return mergedData;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Error fetching profile:', error);
    return null;
  }
};

// Update verification status
export const updateLandlordVerificationStatus = async (userId: string, status: string, reason?: string) => {
  try {
    console.log('📝 [LANDLORD PROFILE] Updating verification status:', { userId, status, reason });
    
    const updateData: any = {
      verification_status: status,
      updated_at: new Date().toISOString()
    };

    if (status === 'approved') {
      updateData.verification_reviewed_at = new Date().toISOString();
      updateData.nin_verified = true;
      updateData.bvn_verified = true;
    } else if (status === 'rejected') {
      updateData.rejection_reason = reason;
      updateData.verification_reviewed_at = new Date().toISOString();
    }

    const { data, error } = await getSupabaseClient()
      .from('landlord_profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ [LANDLORD PROFILE] Error updating verification status:', error);
      toast.error('Failed to update verification status');
      throw error;
    }

    // Also update users table
    const { error: userError } = await getSupabaseClient()
      .from('users')
      .update({
        verification_status: status,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (userError) {
      console.error('❌ [LANDLORD PROFILE] Error updating user verification status:', userError);
      toast.error('Failed to update verification status');
      throw userError;
    }

    console.log('✅ [LANDLORD PROFILE] Verification status updated successfully');
    return data;
  } catch (error) {
    console.error('❌ [LANDLORD PROFILE] Error updating verification status:', error);
    toast.error('Failed to update verification status');
    throw error;
  }
};
