/**
 * Authentication utilities for development and testing
 */

import { createClient } from '@/utils/supabase/client';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Create an admin client with service role key
 */
function createAdminClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Check if user exists in Supabase
 * Uses password recovery method to check existence without requiring admin API
 */
export async function checkUserExists(email: string): Promise<boolean> {
  try {
    console.log('🔍 [AUTH UTILS] Checking if user exists:', email);
    
    // Use password recovery to check if user exists (safer than signInWithPassword)
    const supabase = createClient();
    
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });
    
    if (error) {
      // If error mentions "email not registered", user doesn't exist
      if (error.message?.includes('Unable to find user') || 
          error.message?.includes('email not registered') ||
          error.message?.includes('User not found')) {
        console.log('✅ [AUTH UTILS] User does not exist:', email);
        return false;
      }
      
      // If error mentions "rate limit" or other issues, assume user might exist
      if (error.message?.includes('rate limit') || 
          error.message?.includes('too many requests')) {
        console.log('⚠️ [AUTH UTILS] Rate limited, assuming user exists:', email);
        return true;
      }
      
      console.log('❌ [AUTH UTILS] Error checking user existence:', error);
      return false;
    }
    
    // If password recovery initiated successfully, user exists
    console.log('⚠️ [AUTH UTILS] User already exists:', email);
    return true;
    
  } catch (error) {
    console.error('❌ [AUTH UTILS] Error checking user existence:', error);
    // Default to assuming user doesn't exist on error
    return false;
  }
}

/**
 * Fallback user existence check using service role key (if available)
 */
export async function checkUserExistsWithAdmin(email: string): Promise<boolean> {
  try {
    // Check if service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.log('⚠️ [AUTH UTILS] No service role key, using fallback check');
      return await checkUserExists(email);
    }
    
    console.log('🔑 [AUTH UTILS] Using admin API to check user existence');
    
    // Create admin client with service role key
    const supabaseAdmin = createAdminClient();
    
    // List all users and check if email exists
    const { data: users, error } = await supabaseAdmin.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ [AUTH UTILS] Admin API error:', error);
      return false;
    }
    
    const userExists = users?.users?.some(user => user.email === email);
    
    console.log('🔍 [AUTH UTILS] User exists result (admin):', userExists);
    return userExists || false;
    
  } catch (error: any) {
    console.error('❌ [AUTH UTILS] Error checking user existence (admin):', error);
    return false;
  }
}

/**
 * Clear user from Supabase auth and custom tables (for development)
 * Uses secure server-side API endpoint
 */
export async function clearUserForTesting(email: string): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`🧹 Starting cleanup for user: ${email}`);
    
    // Call secure server-side endpoint
    const response = await fetch('/api/admin/delete-user', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      console.error('❌ [AUTH UTILS] Server error:', result.message);
      return {
        success: false,
        message: result.message || 'Failed to delete user from server'
      };
    }
    
    console.log('✅ [AUTH UTILS] User deleted successfully via server API');
    return result;
    
  } catch (error: any) {
    console.error('❌ [AUTH UTILS] Error calling delete API:', error);
    return {
      success: false,
      message: `Failed to delete user: ${error.message}`
    };
  }
}

/**
 * Development helper: Clear user and retry signup
 */
export async function clearAndRetrySignup(
  email: string, 
  password: string, 
  metadata: any
): Promise<{ success: boolean; message: string; data?: any }> {
  try {
    console.log(`🔄 Clear and retry for: ${email}`);
    
    // First, try to clear the user
    const clearResult = await clearUserForTesting(email);
    
    if (clearResult.success) {
      console.log('✅ User cleared, waiting 2 seconds before retry...');
      
      // Wait a moment for Supabase to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Now try signup again
      const supabase = createClient();
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      
      if (error) {
        return {
          success: false,
          message: `Signup failed after cleanup: ${error.message}`
        };
      }
      
      return {
        success: true,
        message: 'User cleared and signup successful!',
        data
      };
    }
    
    return {
      success: false,
      message: clearResult.message
    };
    
  } catch (error: any) {
    return {
      success: false,
      message: `Clear and retry failed: ${error.message}`
    };
  }
}

/**
 * Delete a user (for development/testing only)
 */
export async function deleteUserForTesting(email: string): Promise<boolean> {
  try {
    const supabase = createClient();
    
    // Delete from custom users table
    const { error: profileError } = await supabase
      .from('users')
      .delete()
      .eq('email', email);
    
    if (profileError) {
      console.error('Error deleting user profile:', profileError);
    }
    
    // Note: We can't easily delete from auth.users without admin API key
    // In development, you might need to use Supabase dashboard
    
    console.log(`⚠️  User ${email} deleted from custom table. Delete from auth.users in Supabase dashboard if needed.`);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    return false;
  }
}

/**
 * Get user-friendly error message for auth errors
 */
export function getAuthErrorMessage(error: any): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error?.message) {
    const message = error.message;
    
    // Supabase specific errors
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Click "Clear & Retry" to delete and try again.';
    }
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Please confirm your email address before signing in.';
    }
    if (message.includes('Password should be')) {
      return 'Password does not meet requirements.';
    }
    
    return message;
  }
  
  return 'An unexpected error occurred. Please try again.';
}
