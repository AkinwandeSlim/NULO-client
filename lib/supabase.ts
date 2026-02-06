import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Browser client with cookie-based PKCE storage (prevents cross-tab/browser issues)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce', // Proof Key for Code Exchange
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-' + supabaseUrl.split('.')[0].split('//')[1] + '-auth-token',
  },
})

// Admin client (server-side only)
export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)

// Helper function to get current user with profile
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return { user: null, profile: null, error }
  }

  // Get user profile from public.users
  const { data: profile, error: profileError } = await supabase
    .from('users')
    .select('*')
    .eq('id', user.id)
    .single()

  return { 
    user, 
    profile: profileError ? null : profile, 
    error: profileError 
  }
}

// Helper function to get user profile by type
export async function getUserProfile(userId: string, userType: string) {
  const profileTable = userType === 'admin' ? 'admins' : 
                     userType === 'tenant' ? 'tenant_profiles' : 
                     'landlord_profiles'

  const { data, error } = await supabase
    .from(profileTable)
    .select('*')
    .eq('id', userId)
    .single()

  return { data, error }
}

// Helper function to check if email exists
export async function checkUserExists(email: string) {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('email')
    .eq('email', email)
    .single()

  return { exists: !error && !!data, error }
}

export default supabase
