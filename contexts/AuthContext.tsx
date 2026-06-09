'use client'

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { toast } from 'sonner';
import { 
  User, 
  UserProfile, 
  AuthContextType,
  TenantProfile,
  LandlordProfile,
  Admin
} from '@/types/auth';


/**
 * 🚀 OPTIMIZED USER CACHE STRATEGY
 * 
 * Flow:
 * 1. Check localStorage cache first (instant, no network)
 * 2. Validate cached user is still valid (check timestamp/version)
 * 3. Use cached user while fetching fresh data in background
 * 4. Update cache when fresh data arrives
 * 
 * Benefits:
 * - Instant page loads (no await on verification)
 * - Better UX (cached data shown while validating)
 * - Fewer database calls (reuse valid cache)
 * - Graceful fallback if network fails
 */


import {
  completePhase1Profile,
  completePhase2Profile,
  updateEmailVerification,
  updatePhoneVerification,
  completeOnboarding,
  updateVerificationStatus
} from '@/lib/profile-updates';



// ─── Non-blocking signup notification helper ─────────────────────────────────
// Fires after account creation. Never throws — a broken notification never
// blocks the user from landing on the confirmation page.
const _fireSignupNotification = async (
  userId: string,
  userEmail: string,
  userName: string,
  userType: 'landlord' | 'tenant'
): Promise<void> => {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    await fetch(`${apiUrl}/api/v1/notifications/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': process.env.NEXT_PUBLIC_INTERNAL_SERVICE_KEY || '',
      },
      body: JSON.stringify({
        user_id: userId,
        user_email: userEmail,
        user_name: userName,
        user_type: userType,
      }),
    })
    console.log(`📲 [AUTH] Signup notification fired for ${userType}`)
  } catch (err) {
    // Non-fatal — swallow silently
    console.warn('⚠️ [AUTH] Signup notification failed (non-fatal):', err)
  }
}

const isClient = typeof window !== 'undefined';

const syncUserWithBackend = async (
  userId: string,
  email: string,
  firstName: string,
  lastName: string,
  userType: 'tenant' | 'landlord' | 'admin'
) => {
  try {
    console.log('🔄 [AUTH] Syncing user with FastAPI backend...');
    console.log('📦 [AUTH] Sync payload:', { userId, email, userType });
    
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    const syncUrl = `${apiUrl}/api/v1/auth/sync-user-profile`;
    
    console.log(`🌐 [AUTH] Calling: ${syncUrl}`);
    
    const response = await fetch(syncUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: userId,
        email: email,
        first_name: firstName,
        last_name: lastName,
        full_name: `${firstName} ${lastName}`,
        user_type: userType,
        auth_provider: 'email'
      })
    });

    console.log(`📊 [AUTH] Response status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ [AUTH] Sync failed with status ${response.status}`);
      console.error(`❌ [AUTH] Response body: ${errorText}`);
      
      try {
        const error = JSON.parse(errorText);
        console.error('❌ [AUTH] Error details:', error);
        throw new Error(error.detail || `HTTP ${response.status}`);
      } catch {
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('✅ [AUTH] User synced with backend:', data);
    return data;
    
  } catch (error: any) {
    console.error('❌ [AUTH] Error syncing with backend:', error.message);
    console.error('❌ [AUTH] Full error:', error);
    // Don't throw - we don't want to fail signup if backend sync fails
    // User is already created in Supabase
    return null;
  }
};


// ============================================================================
// LOCAL STORAGE CACHE UTILITIES
// ============================================================================

interface CachedUserData {
  user: User | null
  profile: UserProfile | null
  tokens: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  version: number          // Cache version for migrations
  timestamp: number        // When cached
  expiresIn: number        // TTL in milliseconds
}

const CACHE_KEY = 'auth_cache_v1'
const CACHE_VERSION = 1
const CACHE_TTL = 30 * 60 * 1000  // 30 minutes

class AuthCacheManager {
  private static instance: AuthCacheManager
  
  private constructor() {}
  
  static getInstance(): AuthCacheManager {
    if (!AuthCacheManager.instance) {
      AuthCacheManager.instance = new AuthCacheManager()
    }
    return AuthCacheManager.instance
  }

  /**
   * Save user data to localStorage
   */
  saveUserCache(data: Omit<CachedUserData, 'timestamp' | 'version'>): void {
    try {
      const cached: CachedUserData = {
        ...data,
        version: CACHE_VERSION,
        timestamp: Date.now(),
      }
      localStorage.setItem(CACHE_KEY, JSON.stringify(cached))
      console.log('💾 [AUTH CACHE] Saved user to cache')
    } catch (err) {
      console.warn('⚠️ [AUTH CACHE] Failed to save:', err)
    }
  }

  /**
   * Get cached user data from localStorage
   * Returns null if expired or invalid
   */
  getUserCache(): CachedUserData | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY)
      if (!cached) {
        console.log('📭 [AUTH CACHE] No cache found')
        return null
      }

      const parsed: CachedUserData = JSON.parse(cached)
      
      // Validate version
      if (parsed.version !== CACHE_VERSION) {
        console.log('⚠️ [AUTH CACHE] Cache version mismatch, clearing')
        this.clearCache()
        return null
      }

      // Check if expired
      const cacheAge = Date.now() - parsed.timestamp
      if (cacheAge > parsed.expiresIn) {
        console.log(`⏰ [AUTH CACHE] Cache expired (${Math.round(cacheAge / 1000)}s old)`)
        this.clearCache()
        return null
      }

      console.log(`✅ [AUTH CACHE] Using cached user (${Math.round(cacheAge / 1000)}s old)`)
      return parsed
    } catch (err) {
      console.warn('⚠️ [AUTH CACHE] Failed to parse cache:', err)
      this.clearCache()
      return null
    }
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    try {
      localStorage.removeItem(CACHE_KEY)
      console.log('🧹 [AUTH CACHE] Cleared cache')
    } catch (err) {
      console.warn('⚠️ [AUTH CACHE] Failed to clear cache:', err)
    }
  }
}

// ============================================================================
// AUTH CONTEXT & PROVIDER
// ============================================================================

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}


export function AuthProvider({ children }: { children: React.ReactNode }) {
 
 
  const router = useRouter();
  const supabase = createClient();
  const cacheManager = AuthCacheManager.getInstance();

  // Main auth state
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [authInitialized, setAuthInitialized] = useState(false);
  const [userTypeConfirmed, setUserTypeConfirmed] = useState(false);
    
  // Performance: Token cache
  const tokenCache = useRef({
    accessToken: null as string | null,
    refreshToken: null as string | null,
    expiresAt: null as number | null,
    isValid: false
  });

  // Performance: User data cache with TTL
  const userCache = useRef<Map<string, User>>(new Map());

 

// ============================================================================
  // INITIAL AUTH SETUP WITH LOCALSTORAGE CACHE
  // ============================================================================

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      try {
        // 🚀 PHASE 1: Try localStorage cache first (instant, no network)
        const cachedData = cacheManager.getUserCache();
        if (cachedData?.user) {
          console.log('⚡ [AUTH] FAST: Using cached user, showing immediately')
          if (mounted) {
            setUser(cachedData.user)
            setProfile(cachedData.profile)
            console.log('✅ [AUTH] Using cached user data')
          }
        }

        // 🚀 PHASE 2: Check Supabase session (could be stale if tab inactive)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.warn('⚠️ [AUTH] Session error:', sessionError.message)
        }

        if (!session?.user) {
          console.log('ℹ️ [AUTH] No session found')
          if (mounted) {
            setUser(null)
            setProfile(null)
            setLoading(false)
            setAuthInitialized(true)
          }
          return
        } 

        // 🚀 PHASE 3: Update token cache
        tokenCache.current = {
          accessToken: session.access_token,
          refreshToken: session.refresh_token,
          expiresAt: session.expires_at ? new Date(session.expires_at).getTime() : null,
          isValid: true
        };

        localStorage.setItem('sb-access-token', session.access_token);
        if (session.refresh_token) {
          localStorage.setItem('sb-refresh-token', session.refresh_token);
        }

        // 🚀 PHASE 4: Build quick user from session metadata
        // Note: trust_score defaults to 50 in database schema (CHECK 0-100)
        // Prefer cache (written from DB data) over stale JWT for role fields
        const existingCache = cacheManager.getUserCache()?.user
        const quickUser: User = {
          id: session.user.id,
          email: session.user.email || '',
          first_name: session.user.user_metadata?.first_name || '',
          last_name: session.user.user_metadata?.last_name || '',
          full_name: session.user.user_metadata?.full_name || `${session.user.user_metadata?.first_name || ''} ${session.user.user_metadata?.last_name || ''}`.trim() || 'User',
          phone_number: session.user.user_metadata?.phone_number || null,
          password_hash: null,
          avatar_url: session.user.user_metadata?.avatar_url || null,
          trust_score: existingCache?.trust_score || session.user.user_metadata?.trust_score || 50,
          verification_status: (existingCache?.verification_status || session.user.user_metadata?.verification_status || 'pending') as User['verification_status'],
          user_type: (existingCache?.user_type || session.user.user_metadata?.user_type || 'tenant') as 'admin' | 'landlord' | 'tenant',
          last_login_at: new Date().toISOString(),
          created_at: session.user.created_at,
          updated_at: new Date().toISOString(),
          deleted_at: null,
          phone_verified: false,
          location: null,
          onboarding_completed: existingCache?.onboarding_completed ?? session.user.user_metadata?.onboarding_completed ?? false,
          email_verified: session.user.email_confirmed_at ? true : false,
          onboarding_step: session.user.user_metadata?.onboarding_step || 1,
          auth_provider: session.user.user_metadata?.auth_provider || 'email',
          provider_id: null
        };

        if (mounted) {
          setUser(quickUser)
          setLoading(false)
          setAuthInitialized(true)
          console.log('✅ [AUTH] Initial user set from session')
          
          // PHASE 5: Fetch fresh data in background (non-blocking)
          Promise.all([
            fetchUserFresh(session.user.id),
            fetchProfileFresh(session.user.id, quickUser.user_type)
          ]).then(async ([freshUser, freshProfile]) => {
            if (mounted) {
              if (freshUser) {
                console.log(' [AUTH] Updated user with fresh data')
                console.log(' [AUTH] Fresh data check:', {
                  fresh_user_type: freshUser.user_type,
                  fresh_verification: freshUser.verification_status,
                  current_user_type: quickUser.user_type,
                  current_verification: quickUser.verification_status
                })
                
                // DB is always source of truth — user_type and verification_status 
                // have CHECK constraints so DB values are guaranteed valid.
                // JWT may be stale because auth metadata sync fails with 403.
                if (freshUser.user_type !== quickUser.user_type) {
                  console.log('[AUTH] JWT user_type differs from DB — trusting DB:', {
                    jwt: quickUser.user_type,
                    db: freshUser.user_type,
                  })
                }

                const resolvedUser: User = {
                  ...freshUser,
                  // Only override with session for OAuth identity fields DB may not have:
                  avatar_url:  freshUser.avatar_url  || quickUser.avatar_url,
                  full_name:   freshUser.full_name   || quickUser.full_name,
                  first_name:  freshUser.first_name  || quickUser.first_name,
                  last_name:   freshUser.last_name   || quickUser.last_name,
                  email:       freshUser.email       || quickUser.email,
                }

                // Re-fetch profile with correct type if user_type changed
                // (e.g. was fetching tenant_profiles but user is now landlord)
                const resolvedProfile = (freshUser.user_type !== quickUser.user_type)
                  ? await fetchProfileFresh(session.user.id, freshUser.user_type)
                  : freshProfile

                setUser(resolvedUser)
                if (resolvedProfile) setProfile(resolvedProfile)
                setUserTypeConfirmed(true) // DB has confirmed user type

                cacheManager.saveUserCache({
                  user: resolvedUser,
                  profile: resolvedProfile ?? freshProfile,
                  tokens: {
                    accessToken: tokenCache.current.accessToken!,
                    refreshToken: tokenCache.current.refreshToken!,
                    expiresAt: tokenCache.current.expiresAt!,
                  },
                  expiresIn: CACHE_TTL,
                })
              }
            }
          }).catch(err => {
            console.warn(' [AUTH] Background refresh failed:', err.message)
            // Keep using session data if background fetch fails
          })
        }
        
      } catch (error: any) {
        console.error(' [AUTH] Init error:', error)
        if (mounted) {
          setLoading(false)
          setAuthInitialized(true)
        }
      }
    };

    initAuth();

    return () => {
      mounted = false;
    };
  }, []);

  // ============================================================================
  // TOKEN REFRESH
  // ============================================================================

  const isTokenValid = useCallback(() => {
    const cache = tokenCache.current;
    if (!cache.accessToken || !cache.expiresAt) return false;
    return Date.now() < cache.expiresAt - 300000; // 5min buffer
  }, []);

  const refreshTokenIfNeeded = useCallback(async () => {
    if (!isTokenValid() && tokenCache.current.refreshToken) {
      try {
        const { data, error } = await supabase.auth.refreshSession({
          refresh_token: tokenCache.current.refreshToken
        });
        
        if (!error && data.session) {
          tokenCache.current = {
            accessToken: data.session.access_token,
            refreshToken: data.session.refresh_token,
            expiresAt: data.session.expires_at ? new Date(data.session.expires_at).getTime() : null,
            isValid: true
          };
          
          localStorage.setItem('sb-access-token', data.session.access_token);
          if (data.session.refresh_token) {
            localStorage.setItem('sb-refresh-token', data.session.refresh_token);
          }
        }
      } catch (error) {
        console.log('⚠️ [AUTH] Token refresh failed:', error);
      }
    }
  }, [isTokenValid]);

  // ============================================================================
  // DATA FETCHING WITH CACHE
  // ============================================================================

  /**
   * Fetch fresh user data from Supabase (skips cache)
   */
  const fetchUserFresh = async (userId: string): Promise<User | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [AUTH] User not found in database')
          return null
        }
        throw error
      }
      
      return data as User
    } catch (error: any) {
      console.error('❌ [AUTH] Error fetching user:', error.message)
      return null
    }
  };

  /**
   * Fetch user data with caching (5-minute TTL)
   */
  const fetchUser = async (userId: string): Promise<User | null> => {
    // Check cache first (5-minute TTL)
    const cached = userCache.current.get(userId);
    if (cached && cached.updated_at) {
      const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
      if (cacheAge < 300000) { // 5 minutes
        console.log('💾 [AUTH] Using cached user data');
        return cached;
      }
    }

    try {
      console.log('🔍 [AUTH] Fetching fresh user data');
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') {
          console.log('ℹ️ [AUTH] User not found in database');
          return null;
        }
        throw error;
      }
      
      // Cache the result
      if (data) {
        userCache.current.set(userId, data);
        console.log('💾 [AUTH] Cached user data');
      }
      
      return data as User;
    } catch (error: any) {
      if (error?.name === 'AbortError' || error?.message?.includes('signal is aborted')) {
        console.log('ℹ️ [AUTH] AbortError in fetchUser, using fallback');
        return null;
      }
      console.error('❌ [AUTH] Unexpected error in fetchUser:', error);
      return null;
    }
  };

  /**
   * Fetch fresh profile data from Supabase (skips cache)
   */
  const fetchProfileFresh = async (userId: string, userType: string): Promise<UserProfile> => {
    try {
      if (!userType) return null

      // Admins have no tenant_profiles or landlord_profiles row — skip the
      // fetch entirely to avoid the 406 error on every admin page load.
      if (userType === 'admin') return null

      const table = userType === 'tenant' ? 'tenant_profiles' : 'landlord_profiles'
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .eq('id', userId)
        .single()
      
      if (error) {
        console.warn(`⚠️ [AUTH] ${userType} profile not found:`, error.message)
        return null
      }
      
      return data
    } catch (error: any) {
      console.error(`❌ [AUTH] Error fetching ${userType} profile:`, error.message)
      return null
    }
  };



  // ============================================================================
  // AUTH METHODS (sign up, sign in, sign out, etc.)
  // ============================================================================

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      if (user) {
        setUser(null);
        setProfile(null);
        cacheManager.clearCache();
                router.push('/');
      }
    } catch (error: any) {
      console.error('❌ [AUTH] Sign out error:', error);
      toast.error('Failed to sign out');
    }
  };

  // ─── Build Google OAuth URL directly (no Supabase redirect) ──────────────────
  const buildGoogleOAuthUrl = (userType: 'tenant' | 'landlord' | 'signin'): string => {
    const clientId    = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
    const redirectUri = typeof window !== 'undefined'
      ? `${window.location.origin}/auth/google/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/google/callback`

    // Generate a random nonce for CSRF protection
    const nonce = Math.random().toString(36).substring(2, 15)

    console.log('[AUTH] Building Google OAuth URL:')
    console.log('[AUTH]   User type:', userType)
    console.log('[AUTH]   Nonce generated:', nonce)
    console.log('[AUTH]   State will be:', `${userType}:${nonce}`)

    // Store nonce in cookie so the callback can verify it
    // ✅ URL encode the nonce in the cookie to avoid any parsing issues
    const exp = new Date()
    exp.setMinutes(exp.getMinutes() + 15)
    const encodedNonce = encodeURIComponent(nonce)
    document.cookie = `nulo_oauth_nonce=${encodedNonce}; path=/; expires=${exp.toUTCString()}; SameSite=Lax`
    
    console.log('[AUTH]   Cookie set: nulo_oauth_nonce=', encodedNonce)

    // state encodes both userType and nonce: "tenant:abc123"
    const state = `${userType}:${nonce}`

    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope:         'email profile openid',
      state,
      access_type:   'offline',
      prompt:        'consent',
    })

    const finalUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
    console.log('[AUTH]   Final OAuth URL state param:', state)
    
    return finalUrl
  }

  // Admin signup
  const signUpAdmin = async (fullName: string, email: string, password: string, adminCode: string) => {
    try {
      console.log('👤 [AUTH] Starting admin signup...');
      console.log('🔍 [AUTH] Verifying admin code:', adminCode);
      
      // Verify admin code from database
      const { data: adminCodeData, error: codeError } = await supabase
        .from('admin_codes')
        .select('*')
        .eq('code', adminCode)
        .eq('is_active', true)
        .single();

      if (codeError) {
        console.error('❌ [AUTH] Error querying admin codes:', codeError);
        toast.error('Invalid or inactive admin code');
        return { error: { message: 'Invalid admin code' } };
      }

      if (!adminCodeData) {
        toast.error('Admin code not found');
        return { error: { message: 'Admin code not found' } };
      }

      // ✅ IMPROVED: Check if code has expired with helpful message
      if (adminCodeData.expires_at && new Date(adminCodeData.expires_at) < new Date()) {
        const expiryDate = new Date(adminCodeData.expires_at).toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        console.warn('⚠️ [AUTH] Admin code expired on:', expiryDate);
        toast.error(`Admin code expired on ${expiryDate}. Please contact support to request a new code.`);
        return { error: { message: `Admin code expired on ${expiryDate}` } };
      }

      // Check if code has reached max uses
      if (adminCodeData.max_uses && adminCodeData.current_uses >= adminCodeData.max_uses) {
        toast.error('Admin code has reached maximum uses');
        return { error: { message: 'Admin code max uses reached' } };
      }

      console.log('✅ [AUTH] Admin code validated, proceeding with signup...');

      // Create the admin user
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            user_type: 'admin',
            auth_provider: 'email'
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) {
        console.error('❌ [AUTH] Admin signup error:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('✅ [AUTH] Admin user created:', data.user?.id);

      // Increment current_uses for the admin code
      try {
        const newUseCount = (adminCodeData.current_uses || 0) + 1;
        await supabase
          .from('admin_codes')
          .update({ 
            current_uses: newUseCount,
            updated_at: new Date().toISOString()
          })
          .eq('id', adminCodeData.id);
        console.log(`✅ [AUTH] Admin code usage incremented to ${newUseCount}`);
      } catch (updateError) {
        console.error('⚠️ [AUTH] Could not update admin code usage:', updateError);
        // Non-critical error, continue
      }

      console.log('✅ [AUTH] Admin signup successful');
      toast.success('Admin account created successfully!');
      
      // Check if email confirmation is required
      if (data.user && !data.session) {
        console.log('📧 [AUTH] Email confirmation required');
        // Store email for confirmation page
        if (typeof window !== 'undefined') {
          localStorage.setItem('signup_email', email);
        }
        return { data, error: null, needsEmailConfirmation: true };
      }
      
      // Determine redirect path - prioritize user type dashboard over callback URL
      let redirectPath = '/';
      
      if (data.user.user_type === 'admin') {
        redirectPath = '/admin';
      } else if (data.user.user_type === 'landlord') {
        // For landlords, always go to dashboard unless email not verified
        redirectPath = data.user.email_verified ? '/landlord/overview' : '/signup/landlord/confirmation';
      } else if (data.user.user_type === 'tenant') {
        // For tenants: Smart redirection based on user context
        const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
        if (callbackUrl && callbackUrl.startsWith('/properties/') && callbackUrl !== '/properties') {
          // User was viewing a specific property page - return there
          redirectPath = data.user.email_verified ? callbackUrl : '/signup/tenant/confirmation';
          console.log('🏠 [AUTH] Tenant: Returning to specific property page:', callbackUrl);
        } else if (data.user.email_verified) {
          // Check if tenant has applications/viewings to determine if they're returning
          // For now, default to properties for new users, dashboard for returning users
          // TODO: Add API call to check if user has applications/viewings
          redirectPath = '/properties'; // Default to properties for all verified tenants
          console.log('🏠 [AUTH] Tenant: Verified user, going to properties:', redirectPath);
        } else {
          // Email not verified - go to confirmation
          redirectPath = '/signup/tenant/confirmation';
          console.log('🏠 [AUTH] Tenant: Email not verified, going to confirmation');
        }
      }

      console.log('🔀 [AUTH] Redirecting to:', redirectPath);
      
      // Clear callback URL from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('signup_callback_url');
      }
      
      // Redirect immediately - no delay needed
      router.push(redirectPath);
      
      return { user: data.user, redirectPath };
    } catch (error: any) {
      console.error('❌ [AUTH] Admin signup error:', error);
      toast.error(error.message || 'Failed to create admin account');
      return { error };
    }
  };

  // Tenant signup


const signUpTenant = async (firstName: string, lastName: string, email: string, password: string) => {
  try {
    console.log('👤 [AUTH] Starting tenant signup...');
    
    // Get callback URL from localStorage if it exists (set by signup page)
    const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
    console.log('🔗 [AUTH] Callback URL:', callbackUrl);
    
    // 🚨 DEVELOPMENT ONLY: Skip email verification for testing
    const isDevelopment = process.env.NODE_ENV === 'development';
    const shouldSkipEmail = isDevelopment && email.includes('test');
    
    // Step 1: Create auth user in Supabase WITH RETRY LOGIC
    const { data, error } = await signUpWithRetry(() =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            user_type: 'tenant',
            auth_provider: 'email'
          },
          // ✅ Keep emailRedirectTo - callback route now handles missing user_type correctly
          emailRedirectTo: `${window.location.origin}/auth/callback?user_type=tenant${callbackUrl ? '&redirect_to=' + encodeURIComponent(callbackUrl) : ''}`
        }
      })
    );

    if (error) {
      console.error('❌ [AUTH] Tenant signup error:', error);
      toast.error(error.message);
      return { error };
    }

    console.log('🔗 [AUTH TENANT] Email redirect URL constructed:', {
      emailRedirectTo: `${window.location.origin}/auth/callback?user_type=tenant${callbackUrl ? '&redirect_to=' + encodeURIComponent(callbackUrl) : ''}`,
      origin: window.location.origin,
      user_type_param: 'tenant',
      callback_url_param: callbackUrl || '(none)'
    });

    console.log('✅ [AUTH] Supabase auth user created');
    console.log('📊 [AUTH] User ID from Supabase:', data.user?.id);
    console.log('📊 [AUTH] User Email from Supabase:', data.user?.email);

    // Step 2: 🔥 IMMEDIATELY sync with FastAPI backend
    if (data.user) {
      console.log('⏳ [AUTH] Waiting for backend sync...');
      
      const syncResult = await syncUserWithBackend(
        data.user.id,
        email,
        firstName,
        lastName,
        'tenant'
      );
      
      console.log('✅ [AUTH] Backend sync complete:', syncResult);
      
      // 🔔 Fire signup in-app notification (non-blocking)
      _fireSignupNotification(
        data.user.id,
        email,
        `${firstName} ${lastName}`,
        'tenant'
      )
    } else {
      console.error('❌ [AUTH] No user ID returned from Supabase!');
    }

    console.log('✅ [AUTH] Tenant signup successful');
    toast.success('Account created! Please check your email to verify your account.');
    
    // Store email for confirmation page
    if (typeof window !== 'undefined') {
      localStorage.setItem('signup_email', email);
    }
    
    // Redirect to confirmation page
    router.push('/signup/tenant/confirmation');
    
    return { data, error: null };
    
  } catch (error: any) {
    console.error('❌ [AUTH] Tenant signup error:', error);
    toast.error(error.message || 'Failed to create account');
    return { error };
  }
};

// ─── RETRY LOGIC FOR RATE LIMITING ─────────────────────────────────────────
// Handles Supabase rate limit errors (429) with exponential backoff
// Supabase returns errors in {data, error} object, not as thrown exceptions
const signUpWithRetry = async (
  signupFn: () => Promise<{data: any; error: any}>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<{data: any; error: any}> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const result = await signupFn();
    
    // Check if we got a rate limit error
    const isRateLimitError = result.error?.message?.includes('rate limit') || result.error?.status === 429;
    
    if (isRateLimitError && attempt < maxRetries) {
      const delay = initialDelay * Math.pow(2, attempt - 1); // Exponential: 1s, 2s, 4s
      console.log(`⏳ [RETRY] Rate limited. Attempt ${attempt}/${maxRetries}. Retrying in ${delay}ms...`);
      
      // Show user-friendly message
      toast.info(`Server busy. Retrying in ${Math.ceil(delay / 1000)}s...`);
      
      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay));
      continue;
    }
    
    // Return result (success or non-rate-limit error)
    return result;
  }
  
  // This shouldn't happen, but just in case
  return { data: null, error: new Error('Max retries exceeded') };
};


const signUpLandlord = async (firstName: string, lastName: string, email: string, password: string) => {
  try {
    console.log('🏠 [AUTH] Starting landlord signup...');
    console.log('🔍 [AUTH] SENDING TO SUPABASE:', {
      user_type: 'landlord',
      first_name: firstName
    });

    // Get callback URL from localStorage if it exists (set by signup page)
    const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
    console.log('🔗 [AUTH] Callback URL:', callbackUrl);

    // Step 1: Create auth user in Supabase WITH RETRY LOGIC
    const { data, error } = await signUpWithRetry(() =>
      supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            user_type: 'landlord',
            auth_provider: 'email'
          },
          // ✅ Keep emailRedirectTo - callback route now handles missing user_type correctly
          emailRedirectTo: `${window.location.origin}/auth/callback?user_type=landlord${callbackUrl ? '&redirect_to=' + encodeURIComponent(callbackUrl) : ''}`
        }
      })
    );

    console.log('🔗 [AUTH LANDLORD] Email redirect URL constructed:', {
      emailRedirectTo: `${window.location.origin}/auth/callback?user_type=landlord${callbackUrl ? '&redirect_to=' + encodeURIComponent(callbackUrl) : ''}`,
      origin: window.location.origin,
      user_type_param: 'landlord',
      callback_url_param: callbackUrl || '(none)'
    });

    if (error) {
      console.error('❌ [AUTH] Landlord signup error:', error);
      toast.error(error.message);
      return { error };
    }

    console.log('✅ [AUTH] Supabase auth user created');

    // Step 2: 🔥 IMMEDIATELY sync with FastAPI backend
    // This ensures user_type is set correctly in public.users
    if (data.user) {
      console.log('📊 [AUTH] User ID from Supabase:', data.user.id);
      console.log('📊 [AUTH] User Email from Supabase:', data.user.email);
      console.log('⏳ [AUTH] Waiting for backend sync...');
      
      const syncResult = await syncUserWithBackend(
        data.user.id,
        email,
        firstName,
        lastName,
        'landlord'
      );
      
      console.log('✅ [AUTH] Backend sync complete:', syncResult);
      
      // 🔔 Fire signup in-app notification (non-blocking)
      _fireSignupNotification(
        data.user.id,
        email,
        `${firstName} ${lastName}`,
        'landlord'
      )
    } else {
      console.error('❌ [AUTH] No user ID returned from Supabase!');
    }

    console.log('✅ [AUTH] Landlord signup successful');
    toast.success('Account created! Please check your email to verify your account.');
    
    // Store email for confirmation page
    if (typeof window !== 'undefined') {
      localStorage.setItem('signup_email', email);
    }
    
    // Redirect to confirmation page
    router.push('/signup/landlord/confirmation');
    
    return { data, error: null };
    
  } catch (error: any) {
    console.error('❌ [AUTH] Landlord signup error:', error);
    toast.error(error.message || 'Failed to create account');
    return { error };
  }
};



  // Google signup for tenant
  const signUpTenantWithGoogle = async () => {
    try {
      console.log('[AUTH] Starting tenant Google signup (custom OAuth)...')

      const callbackUrl = typeof window !== 'undefined'
        ? localStorage.getItem('signup_callback_url')
        : null

      if (callbackUrl && typeof window !== 'undefined') {
        const exp = new Date()
        exp.setHours(exp.getHours() + 1)
        document.cookie = `nulo_redirect_path=${encodeURIComponent(callbackUrl)}; path=/; expires=${exp.toUTCString()}; SameSite=Lax`
      }

      const googleUrl = buildGoogleOAuthUrl('tenant')
      window.location.href = googleUrl

      return { data: null, error: null }
    } catch (error: any) {
      console.error('[AUTH] Tenant Google signup error:', error)
      toast.error(error.message || 'Failed to sign up with Google')
      return { error }
    }
  };

  // Google signup for landlord
  const signUpLandlordWithGoogle = async () => {
    try {
      console.log('[AUTH] Starting landlord Google signup (custom OAuth)...')

      const googleUrl = buildGoogleOAuthUrl('landlord')
      window.location.href = googleUrl

      return { data: null, error: null }
    } catch (error: any) {
      console.error('[AUTH] Landlord Google signup error:', error)
      toast.error(error.message || 'Failed to sign up with Google')
      return { error }
    }
  };

  // Sign in
  // Helper function to wait for user record to be created with exponential backoff
  const waitForUserRecord = async (userId: string, maxAttempts = 8): Promise<User | null> => {
    console.log(`🔍 [AUTH] Starting user record polling for ${userId} (max ${maxAttempts} attempts)`);
    
    for (let i = 0; i < maxAttempts; i++) {
      try {
        // Create a new client instance to avoid lock conflicts
        const freshClient = createClient();
        
        // Add a small random delay to prevent thundering herd
        if (i > 0) {
          const randomDelay = Math.random() * 200 + 100; // 100-300ms random delay
          await new Promise(resolve => setTimeout(resolve, randomDelay));
        }
        
        const { data, error } = await freshClient
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        
        if (data && !error) {
          console.log(`✅ [AUTH] User record found on attempt ${i + 1}:`, {
            id: data.id,
            email: data.email,
            user_type: data.user_type
          });
          return data as User;
        }
        
        // Handle specific errors gracefully
        if (error?.code === 'PGRST116') {
          console.log(`⏳ [AUTH] User record not yet available, attempt ${i + 1}/${maxAttempts}`);
        } else if (error?.message?.includes('AbortError') || error?.message?.includes('signal is aborted')) {
          console.log(`⏳ [AUTH] Lock timeout on attempt ${i + 1}/${maxAttempts}, retrying...`);
        } else {
          console.warn(`⚠️ [AUTH] Unexpected error on attempt ${i + 1}:`, error);
        }
        
        // Exponential backoff: 500ms, 1s, 2s, 4s
        const delay = Math.min(500 * Math.pow(2, i), 4000);
        console.log(`⏳ [AUTH] Waiting ${delay}ms before retry...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        
      } catch (err: any) {
        console.warn(`⚠️ [AUTH] Exception on attempt ${i + 1}:`, err);
        // Continue trying even if there's an exception
        if (i < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }
    
    console.warn('⚠️ [AUTH] User record not found after all attempts - this might indicate a database issue');
    return null;
  };

  const signIn = async (email: string, password: string, callbackUrl?: string) => {
    try {
      console.log('🔐 [AUTH] Starting sign in...');
      
      // Use the session from signInWithPassword directly - no additional auth.getUser() call
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('❌ [AUTH] Sign in error:', error.message);
        toast.error(error.message);
        throw error;
      }

      if (!data.user || !data.session) {
        console.error('❌ [AUTH] No user/session returned from sign in');
        toast.error('Sign in failed');
        throw new Error('No user/session returned');
      }

      console.log('✅ [AUTH] Sign in successful for:', data.user.email);
      
      // ✅ FIXED: Check if email is verified
      if (!data.user.email_confirmed_at) {
        console.warn('⚠️ [AUTH] User email not verified');
        setUser(null);
        setProfile(null);
        const error = new Error('email_not_confirmed');
        (error as any).code = 'email_not_confirmed';
        throw error;
      }

      // 🔥 IMPORTANT: Save tokens to localStorage immediately for API client
      if (typeof window !== 'undefined' && data.session) {
        localStorage.setItem('sb-access-token', data.session.access_token);
        if (data.session.refresh_token) {
          localStorage.setItem('sb-refresh-token', data.session.refresh_token);
        }
        console.log('💾 [AUTH] Tokens saved to localStorage for API client');
      }

      // Get callbackUrl from localStorage if not passed as parameter
      if (!callbackUrl && typeof window !== 'undefined') {
        callbackUrl = localStorage.getItem('signup_callback_url') || undefined;
      }

      // ✅ CRITICAL: Fetch user_type from DB — metadata can be stale or wrong.
      // This is especially important for OAuth users whose metadata may not have
      // been updated if they signed up via Google and later sign in via email.
      let userType = data.user.user_metadata?.user_type || 'tenant';
      try {
        const { data: dbUser } = await supabase
          .from('users')
          .select('user_type, onboarding_completed, verification_status')
          .eq('id', data.user.id)
          .single();
        if (dbUser?.user_type) {
          userType = dbUser.user_type;
          console.log('✅ [AUTH] user_type resolved from DB:', userType);
        }
      } catch (dbErr) {
        console.warn('⚠️ [AUTH] Could not fetch user_type from DB, using metadata:', userType);
      }

      // Build user object DIRECTLY from signIn response
      const firstName = data.user.user_metadata?.first_name || 'User';
      const lastName = data.user.user_metadata?.last_name || 'Name';
      
      const userData: User = {
        id: data.user.id,
        email: data.user.email || '',
        first_name: firstName,
        last_name: lastName,
        full_name: data.user.user_metadata?.full_name || `${firstName} ${lastName}`,
        user_type: userType as 'admin' | 'landlord' | 'tenant',
        email_verified: data.user.email_confirmed_at ? true : false,
        onboarding_completed: data.user.user_metadata?.onboarding_completed || false,
        onboarding_step: data.user.user_metadata?.onboarding_step || 1,
        verification_status: data.user.user_metadata?.verification_status || 'pending',
        trust_score: data.user.user_metadata?.trust_score || 50, // DB default from schema
        created_at: data.user.created_at || new Date().toISOString(),
        auth_provider: 'email',
        phone_number: null,
        password_hash: null,
        avatar_url: null,
        last_login_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
        phone_verified: false,
        location: null,
        provider_id: null
      };
      
      setUser(userData);
      
      // Try to fetch profile asynchronously - don't block sign in
      fetchProfileFresh(userData.id, userData.user_type).then(profileData => {
        if (profileData) {
          setProfile(profileData);
        }
      }).catch(err => {
        console.warn('⚠️ [AUTH] Profile fetch failed (non-blocking):', err);
      });

      // Determine redirect path - prioritize user type dashboard over callback URL
      let redirectPath = '/';
      
      if (userData.user_type === 'admin') {
        redirectPath = '/admin';
      } else if (userData.user_type === 'landlord') {
        // For landlords, always go to dashboard unless email not verified
        redirectPath = userData.email_verified ? '/landlord/overview' : '/signup/landlord/confirmation';
      } else if (userData.user_type === 'tenant') {
        // For tenants: Smart redirection based on user activity
        if (callbackUrl && callbackUrl.startsWith('/properties/') && callbackUrl !== '/properties') {
          // User was viewing a specific property page - return there
          redirectPath = userData.email_verified ? callbackUrl : '/signup/tenant/confirmation';
          console.log('🏠 [AUTH] Tenant: Returning to specific property page:', callbackUrl);
        } else if (userData.email_verified) {
          // Check if tenant has applications/viewings to determine if they're returning
          console.log('🏠 [AUTH] Tenant: Checking user activity for redirection...');
          
          try {
            // Check for applications and viewing requests in parallel
            const [applicationsResponse, viewingsResponse] = await Promise.allSettled([
              import('@/lib/api/applications').then(({ applicationsAPI }) => applicationsAPI.getMyApplicationsFast()),
              import('@/lib/api/viewingRequestsTenant').then(({ viewingRequestsAPI }) => viewingRequestsAPI.getMyRequests())
            ]);

            const hasApplications = applicationsResponse.status === 'fulfilled' && 
                                  applicationsResponse.value.success && 
                                  applicationsResponse.value.applications.length > 0;
            
            const hasViewings = viewingsResponse.status === 'fulfilled' && 
                               viewingsResponse.value.success && 
                               viewingsResponse.value.data.length > 0;

            if (hasApplications || hasViewings) {
              redirectPath = '/tenant';
              console.log('🏠 [AUTH] Tenant: Returning user with activity, going to dashboard', {
                hasApplications,
                hasViewings
              });
            } else {
              redirectPath = '/properties';
              console.log('🏠 [AUTH] Tenant: New user (no activity), going to properties');
            }
          } catch (error) {
            console.warn('⚠️ [AUTH] Failed to check tenant activity, defaulting to properties:', error);
            redirectPath = '/properties';
          }
        } else {
          // Email not verified - go to confirmation
          redirectPath = '/signup/tenant/confirmation';
          console.log('🏠 [AUTH] Tenant: Email not verified, going to confirmation');
        }
      }

      console.log('🔀 [AUTH] Redirecting to:', redirectPath);
      
      // Clear callback URL from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('signup_callback_url');
      }
      
      // Redirect immediately - no delay needed
      router.push(redirectPath);
      
      return { user: userData, redirectPath };
    } catch (error: any) {
      console.error('❌ [AUTH] Sign in error:', error);
      toast.error(error.message || 'Failed to sign in');
      throw error;
    }
  };

  const signInWithGoogle = async (redirectUrl?: string) => {
    try {
      console.log('[AUTH] Starting Google sign in (custom OAuth)...')

      // Store redirect path in cookie if provided
      if (redirectUrl && typeof window !== 'undefined') {
        const exp = new Date()
        exp.setHours(exp.getHours() + 1)
        document.cookie = `nulo_redirect_path=${encodeURIComponent(redirectUrl)}; path=/; expires=${exp.toUTCString()}; SameSite=Lax`
      }

      const googleUrl = buildGoogleOAuthUrl('signin')
      window.location.href = googleUrl

      // Return null — page is navigating away, no need to return data
      return { data: null, error: null }
    } catch (error: any) {
      console.error('[AUTH] Google sign in error:', error)
      toast.error(error.message || 'Failed to sign in with Google')
      return { error }
    }
  };

  // Reset password
  const resetPassword = async (email: string) => {
    try {
      console.log('🔒 [AUTH] Sending password reset email...');
      
      const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      });

      if (error) {
        console.error('❌ [AUTH] Password reset error:', error);
        toast.error(error.message);
        return { error };
      }

      console.log('✅ [AUTH] Password reset email sent');
      toast.success('Password reset email sent! Please check your inbox.');
      return { data, error: null };
    } catch (error: any) {
      console.error('❌ [AUTH] Password reset error:', error);
      toast.error(error.message || 'Failed to send reset email');
      return { error };
    }
  };

  // Update user profile
  const updateUserProfile = async (updates: Partial<User>) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      console.log('📝 [AUTH] Updating user profile...');
      
      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (error) {
        console.error('❌ [AUTH] Profile update error:', error);
        toast.error(error.message);
        throw error;
      }

      console.log('✅ [AUTH] Profile updated successfully');
      setUser({ ...user, ...data });
      toast.success('Profile updated successfully');
    } catch (error: any) {
      console.error('❌ [AUTH] Profile update error:', error);
      throw error;
    }
  };

  // Wrapper functions
  const wrappedCompletePhase1Profile = async (profileData: any): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    await completePhase1Profile(user.id, profileData);
    const updatedUser = await fetchUser(user.id);
    if (updatedUser) setUser(updatedUser);
  };

  const wrappedCompletePhase2Profile = async (documents: any[]): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    await completePhase2Profile(user.id, documents);
    const updatedUser = await fetchUser(user.id);
    if (updatedUser) setUser(updatedUser);
  };

  const wrappedUpdateEmailVerification = async (): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    await updateEmailVerification(user.id);
    const updatedUser = await fetchUser(user.id);
    if (updatedUser) setUser(updatedUser);
  };

  const wrappedUpdatePhoneVerification = async (phoneNumber: string): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    await updatePhoneVerification(user.id, phoneNumber);
    const updatedUser = await fetchUser(user.id);
    if (updatedUser) setUser(updatedUser);
  };

  const wrappedCompleteOnboarding = async (): Promise<void> => {
    if (!user) throw new Error('No user logged in');
    if (!user.user_type) throw new Error('User type not set');
    await completeOnboarding(user.id, user.user_type);
    const updatedUser = await fetchUser(user.id);
    if (updatedUser) setUser(updatedUser);
  };

  // ─── Force refresh user data (useful after admin actions) ─────────────────────
  const refreshUserData = useCallback(async () => {
    if (!user?.id) return;
    
    console.log('🔄 [AUTH] Force refreshing user data...');
    
    try {
      const freshUser = await fetchUserFresh(user.id);
      const freshProfile = await fetchProfileFresh(user.id, user.user_type);
      
      if (freshUser) {
        console.log('✅ [AUTH] User data refreshed successfully');
        setUser(freshUser);
        
        // Update cache with fresh data
        cacheManager.saveUserCache({
          user: freshUser,
          profile: freshProfile,
          tokens: {
            accessToken: tokenCache.current.accessToken!,
            refreshToken: tokenCache.current.refreshToken!,
            expiresAt: tokenCache.current.expiresAt!
          },
          expiresIn: CACHE_TTL
        });
      }
      
      if (freshProfile) {
        console.log('✅ [AUTH] Profile data refreshed successfully');
        setProfile(freshProfile);
      }
    } catch (error) {
      console.error('❌ [AUTH] Failed to refresh user data:', error);
    }
  }, [user?.id, user?.user_type]);

const value: AuthContextType = {
  user,
  userProfile,
  setUser,
  setProfile,
  loading,
  authInitialized, // ✅ NEW: Pass initialized flag
  userTypeConfirmed,
  signUpAdmin,
  signUpTenant,
  signUpLandlord,
  signUpTenantWithGoogle,
  signUpLandlordWithGoogle,
  signIn,
  signInWithGoogle,
  signOut,
  resetPassword,
  updateUserProfile,
  completePhase1Profile: wrappedCompletePhase1Profile,
  completePhase2Profile: wrappedCompletePhase2Profile,
  updateEmailVerification: wrappedUpdateEmailVerification,
  updatePhoneVerification: wrappedUpdatePhoneVerification,
  completeOnboarding: wrappedCompleteOnboarding,
  refreshUserData,
};

return (
  <AuthContext.Provider value={value}>
    {children}
  </AuthContext.Provider>
);
}