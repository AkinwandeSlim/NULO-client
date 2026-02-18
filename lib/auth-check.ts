/**
 * Email existence checking utility
 * Used to detect duplicate email signups and offer signin instead
 */

import { createClient } from '@/utils/supabase/client'

interface EmailCheckResult {
  exists: boolean
  userType?: 'landlord' | 'tenant' | 'admin'
  error?: string
}

/**
 * Check if email exists in database and return user type if it does
 * Uses Supabase public API (no service role required)
 */
export async function checkEmailExists(email: string): Promise<EmailCheckResult> {
  try {
    console.log('🔍 [EMAIL CHECK] Checking if email exists:', email)
    
    const supabase = createClient()
    
    // Query users table for matching email
    const { data, error } = await supabase
      .from('users')
      .select('id, email, user_type')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error) {
      // 406 means no rows found (not an error in this context)
      if (error.code === 'PGRST116') {
        console.log('✅ [EMAIL CHECK] Email does not exist')
        return { exists: false }
      }
      
      console.warn('⚠️ [EMAIL CHECK] Database error:', error.message)
      throw error
    }
    
    if (data) {
      console.log('⚠️ [EMAIL CHECK] Email already exists:', email, 'Type:', data.user_type)
      return {
        exists: true,
        userType: data.user_type as 'landlord' | 'tenant' | 'admin'
      }
    }
    
    return { exists: false }
    
  } catch (error: any) {
    console.error('❌ [EMAIL CHECK] Error checking email:', error)
    return {
      exists: false,
      error: error.message || 'Failed to check email'
    }
  }
}

/**
 * Get user's full existence info (for role confirmation)
 */
export async function getUserByEmail(email: string) {
  try {
    const supabase = createClient()
    
    const { data, error } = await supabase
      .from('users')
      .select('id, email, user_type, full_name, created_at')
      .eq('email', email.toLowerCase())
      .single()
    
    if (error?.code === 'PGRST116') {
      return null
    }
    
    return data
  } catch (error) {
    console.error('❌ [GET USER] Error fetching user:', error)
    return null
  }
}
