// 'use client'

// import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
// import { useRouter} from 'next/navigation'
// import { notificationsAPI} from "@/lib/api/notifications"
// import { createClient } from '@/utils/supabase/client';
// import { toast } from 'sonner';
// import { 
//   User, 
//   UserProfile, 
//   AuthContextType,
//   TenantProfile,
//   LandlordProfile,
//   Admin,
//   AppNotification
// } from '@/types/auth';

// import {
//   completePhase1Profile,
//   completePhase2Profile,
//   updateEmailVerification,
//   updatePhoneVerification,
//   completeOnboarding,
//   updateVerificationStatus
// } from '@/lib/profile-updates';
// import {
//   getLandlordProfile,
//   completeLandlordPhase1Profile,
//   completeLandlordPhase2Profile,
//   completeLandlordPhase3Profile,
//   completeLandlordOnboarding,
//   updateLandlordVerificationStatus
// } from '@/lib/profile-updates-landlord';

// const isClient = typeof window !== 'undefined';

// const syncUserWithBackend = async (
//   userId: string,
//   email: string,
//   firstName: string,
//   lastName: string,
//   userType: 'tenant' | 'landlord' | 'admin'
// ) => {
//   try {
//     console.log('🔄 [AUTH] Syncing user with FastAPI backend...');
//     console.log('📦 [AUTH] Sync payload:', { userId, email, userType });
    
//     const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
//     const syncUrl = `${apiUrl}/api/v1/auth/sync-user-profile`;
    
//     console.log(`🌐 [AUTH] Calling: ${syncUrl}`);
    
//     const response = await fetch(syncUrl, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//       },
//       body: JSON.stringify({
//         user_id: userId,
//         email: email,
//         first_name: firstName,
//         last_name: lastName,
//         full_name: `${firstName} ${lastName}`,
//         user_type: userType,
//         auth_provider: 'email'
//       })
//     });

//     console.log(`📊 [AUTH] Response status: ${response.status}`);

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`❌ [AUTH] Sync failed with status ${response.status}`);
//       console.error(`❌ [AUTH] Response body: ${errorText}`);
      
//       try {
//         const error = JSON.parse(errorText);
//         console.error('❌ [AUTH] Error details:', error);
//         throw new Error(error.detail || `HTTP ${response.status}`);
//       } catch {
//         throw new Error(`HTTP ${response.status}: ${errorText}`);
//       }
//     }

//     const data = await response.json();
//     console.log('✅ [AUTH] User synced with backend:', data);
//     return data;
    
//   } catch (error: any) {
//     console.error('❌ [AUTH] Error syncing with backend:', error.message);
//     console.error('❌ [AUTH] Full error:', error);
//     // Don't throw - we don't want to fail signup if backend sync fails
//     // User is already created in Supabase
//     return null;
//   }
// };


// const AuthContext = createContext<AuthContextType | undefined>(undefined);





// export function useAuth() {
//   const context = useContext(AuthContext);
//   if (context === undefined) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// }

// export function AuthProvider({ children }: { children: React.ReactNode }) {
//   const router = useRouter();
//   const [user, setUser] = useState<User | null>(null);
//   const [userProfile, setProfile] = useState<UserProfile>(null);
//   const [loading, setLoading] = useState(true);
//   const [authInitialized, setAuthInitialized] = useState(false);
//   const [notifications, setNotifications] = useState<AppNotification[]>([]);
//   const [unreadCount, setUnreadCount] = useState(0);
//   const supabase = createClient();

//   // 🚀 PERFORMANCE: Smart token cache
//   const tokenCache = useRef({
//     accessToken: null as string | null,
//     refreshToken: null as string | null,
//     expiresAt: null as number | null,
//     isValid: false
//   });

//   // 🚀 PERFORMANCE: User data cache
//   const userCache = useRef<Map<string, User>>(new Map());

//   // 🚀 PERFORMANCE: Fast token validation
//   const isTokenValid = useCallback(() => {
//     const cache = tokenCache.current;
//     if (!cache.accessToken || !cache.expiresAt) return false;
//     return Date.now() < cache.expiresAt - 300000; // 5min buffer
//   }, []);

//   // 🚀 PERFORMANCE: Background token refresh
//   const refreshTokenIfNeeded = useCallback(async () => {
//     if (!isTokenValid() && tokenCache.current.refreshToken) {
//       try {
//         const { data, error } = await supabase.auth.refreshSession({
//           refresh_token: tokenCache.current.refreshToken
//         });
        
//         if (!error && data.session) {
//           tokenCache.current = {
//             accessToken: data.session.access_token,
//             refreshToken: data.session.refresh_token,
//             expiresAt: data.session.expires_at ? new Date(data.session.expires_at).getTime() : null,
//             isValid: true
//           };
          
//           // Update localStorage
//           localStorage.setItem('sb-access-token', data.session.access_token);
//           if (data.session.refresh_token) {
//             localStorage.setItem('sb-refresh-token', data.session.refresh_token);
//           }
//         }
//       } catch (error) {
//         console.log('⚠️ [AUTH] Token refresh failed:', error);
//       }
//     }
//   }, [isTokenValid]);

//   // 🚀 PERFORMANCE: Cached user fetch with TTL
//   const fetchUser = async (userId: string): Promise<User | null> => {
//     // Check cache first (5-minute TTL)
//     const cached = userCache.current.get(userId);
//     if (cached && cached.updated_at) {
//       const cacheAge = Date.now() - new Date(cached.updated_at).getTime();
//       if (cacheAge < 300000) { // 5 minutes
//         console.log('💾 [AUTH] Using cached user data');
//         return cached;
//       }
//     }

//     try {
//       console.log('🔍 [AUTH] Fetching fresh user data');
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();
      
//       if (error) {
//         if (error.code === 'PGRST116') {
//           console.log('ℹ️ [AUTH] User not found in database, using session fallback');
//           return null;
//         }
//         throw error;
//       }
      
//       // Cache the result
//       if (data) {
//         userCache.current.set(userId, data);
//         console.log('💾 [AUTH] Cached user data');
//       }
      
//       return data as User;
//     } catch (error: any) {
//       if (error?.name === 'AbortError' || error?.message?.includes('signal is aborted')) {
//         console.log('ℹ️ [AUTH] AbortError in fetchUser, using fallback');
//         return null;
//       }
//       console.error('❌ [AUTH] Unexpected error in fetchUser:', error);
//       return null;
//     }
//   };

//   // Simple function to get profile based on user type
//   const fetchProfile = async (userId: string, userType: string): Promise<UserProfile> => {
//     try {
//       if (!userType) {
//         console.warn('⚠️ [AUTH] No user type provided to fetchProfile');
//         return null;
//       }

//       if (userType === 'tenant') {
//         const { data, error } = await supabase
//           .from('tenant_profiles')
//           .select('*')
//           .eq('id', userId)
//           .single();
        
//         if (error) {
//           // Handle AbortError gracefully
//           if (error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) {
//             console.log('ℹ️ [AUTH] Supabase lock timeout in tenant profile fetch (expected)');
//             return null;
//           }
//           console.warn('⚠️ [AUTH] Tenant profile not found:', error.message);
//           return null;
//         }
//         return data as TenantProfile;
//       } else if (userType === 'landlord') {
//         const { data, error } = await supabase
//           .from('landlord_profiles')
//           .select('*')
//           .eq('id', userId)
//           .single();
        
//         if (error) {
//           // Handle AbortError gracefully
//           if (error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) {
//             console.log('ℹ️ [AUTH] Supabase lock timeout in landlord profile fetch (expected)');
//             return null;
//           }
//           console.warn('⚠️ [AUTH] Landlord profile not found:', error.message);
//           return null;
//         }
//         return data as LandlordProfile;
//       } else if (userType === 'admin') {
//         const { data, error } = await supabase
//           .from('admins')
//           .select('*')
//           .eq('id', userId)
//           .single();
        
//         if (error) {
//           // Handle AbortError gracefully
//           if (error.message?.includes('AbortError') || error.message?.includes('signal is aborted')) {
//             console.log('ℹ️ [AUTH] Supabase lock timeout in admin profile fetch (expected)');
//             return null;
//           }
//           console.warn('⚠️ [AUTH] Admin profile not found:', error.message);
//           return null;
//         }
//         return data as Admin;
//       }
      
//       console.warn(`⚠️ [AUTH] Unknown user type: ${userType}`);
//       return null;
//     } catch (error: any) {
//       // Handle AbortError
//       if (error?.name === 'AbortError' || error?.message?.includes('signal is aborted')) {
//         console.log('ℹ️ [AUTH] Supabase lock timeout in fetchProfile (expected)');
//         return null;
//       }
//       console.error('❌ [AUTH] Exception in fetchProfile:', error);
//       return null;
//     }
//   };

//   // Admin signup
//   const signUpAdmin = async (fullName: string, email: string, password: string, adminCode: string) => {
//     try {
//       console.log('👤 [AUTH] Starting admin signup...');
//       console.log('🔍 [AUTH] Verifying admin code:', adminCode);
      
//       // Verify admin code from database
//       const { data: adminCodeData, error: codeError } = await supabase
//         .from('admin_codes')
//         .select('*')
//         .eq('code', adminCode)
//         .eq('is_active', true)
//         .single();

//       if (codeError) {
//         console.error('❌ [AUTH] Error querying admin codes:', codeError);
//         toast.error('Invalid or inactive admin code');
//         return { error: { message: 'Invalid admin code' } };
//       }

//       if (!adminCodeData) {
//         toast.error('Admin code not found');
//         return { error: { message: 'Admin code not found' } };
//       }

//       // Check if code has expired
//       if (adminCodeData.expires_at && new Date(adminCodeData.expires_at) < new Date()) {
//         toast.error('Admin code has expired');
//         return { error: { message: 'Admin code expired' } };
//       }

//       // Check if code has reached max uses
//       if (adminCodeData.max_uses && adminCodeData.current_uses >= adminCodeData.max_uses) {
//         toast.error('Admin code has reached maximum uses');
//         return { error: { message: 'Admin code max uses reached' } };
//       }

//       console.log('✅ [AUTH] Admin code validated, proceeding with signup...');

//       // Create the admin user
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             full_name: fullName,
//             user_type: 'admin',
//             auth_provider: 'email'
//           },
//           emailRedirectTo: `${window.location.origin}/auth/callback`
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Admin signup error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Admin user created:', data.user?.id);

//       // Increment current_uses for the admin code
//       try {
//         const newUseCount = (adminCodeData.current_uses || 0) + 1;
//         await supabase
//           .from('admin_codes')
//           .update({ 
//             current_uses: newUseCount,
//             updated_at: new Date().toISOString()
//           })
//           .eq('id', adminCodeData.id);
//         console.log(`✅ [AUTH] Admin code usage incremented to ${newUseCount}`);
//       } catch (updateError) {
//         console.error('⚠️ [AUTH] Could not update admin code usage:', updateError);
//         // Non-critical error, continue
//       }

//       console.log('✅ [AUTH] Admin signup successful');
//       toast.success('Admin account created successfully!');
      
//       // Check if email confirmation is required
//       if (data.user && !data.session) {
//         console.log('📧 [AUTH] Email confirmation required');
//         // Store email for confirmation page
//         if (typeof window !== 'undefined') {
//           localStorage.setItem('signup_email', email);
//         }
//         return { data, error: null, needsEmailConfirmation: true };
//       }
      
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Admin signup error:', error);
//       toast.error(error.message || 'Failed to create admin account');
//       return { error };
//     }
//   };

//   // Tenant signup


// const signUpTenant = async (firstName: string, lastName: string, email: string, password: string) => {
//   try {
//     console.log('👤 [AUTH] Starting tenant signup...');
    
//     // Get callback URL from localStorage if it exists (set by signup page)
//     const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
//     console.log('🔗 [AUTH] Callback URL:', callbackUrl);
    
//     // Step 1: Create auth user in Supabase
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           first_name: firstName,
//           last_name: lastName,
//           full_name: `${firstName} ${lastName}`,
//           user_type: 'tenant',
//           auth_provider: 'email'
//         },
//         // ✅ Keep emailRedirectTo - callback route now handles missing user_type correctly
//         emailRedirectTo: `${window.location.origin}/auth/callback?user_type=tenant${callbackUrl ? '&redirect_to=' + encodeURIComponent(callbackUrl) : ''}`
//       }
//     });

//     if (error) {
//       console.error('❌ [AUTH] Tenant signup error:', error);
//       toast.error(error.message);
//       return { error };
//     }

//     console.log('✅ [AUTH] Supabase auth user created');
//     console.log('📊 [AUTH] User ID from Supabase:', data.user?.id);
//     console.log('📊 [AUTH] User Email from Supabase:', data.user?.email);

//     // Step 2: 🔥 IMMEDIATELY sync with FastAPI backend
//     if (data.user) {
//       console.log('⏳ [AUTH] Waiting for backend sync...');
      
//       const syncResult = await syncUserWithBackend(
//         data.user.id,
//         email,
//         firstName,
//         lastName,
//         'tenant'
//       );
      
//       console.log('✅ [AUTH] Backend sync complete:', syncResult);
//     } else {
//       console.error('❌ [AUTH] No user ID returned from Supabase!');
//     }

//     console.log('✅ [AUTH] Tenant signup successful');
//     toast.success('Account created! Please check your email to verify your account.');
    
//     // Store email for confirmation page
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('signup_email', email);
//     }
    
//     // Redirect to confirmation page
//     router.push('/signup/tenant/confirmation');
    
//     return { data, error: null };
    
//   } catch (error: any) {
//     console.error('❌ [AUTH] Tenant signup error:', error);
//     toast.error(error.message || 'Failed to create account');
//     return { error };
//   }
// };


//   // const signUpTenant = async (firstName: string, lastName: string, email: string, password: string) => {
//   //   try {
//   //     console.log('👤 [AUTH] Starting tenant signup...');
      
//   //     const { data, error } = await supabase.auth.signUp({
//   //       email,
//   //       password,
//   //       options: {
//   //         data: {
//   //           first_name: firstName,
//   //           last_name: lastName,
//   //           full_name: `${firstName} ${lastName}`,
//   //           user_type: 'tenant',
//   //           auth_provider: 'email'
//   //         },
//   //         emailRedirectTo: `${window.location.origin}/auth/callback`
//   //       }
//   //     });

//   //     if (error) {
//   //       console.error('❌ [AUTH] Tenant signup error:', error);
//   //       toast.error(error.message);
//   //       return { error };
//   //     }

//   //     console.log('✅ [AUTH] Tenant signup successful');
//   //     toast.success('Account created! Please check your email to verify your account.');
      
//   //     // Store email for confirmation page
//   //     if (typeof window !== 'undefined') {
//   //       localStorage.setItem('signup_email', email);
//   //     }
      
//   //     // Redirect to confirmation page
//   //     router.push('/signup/tenant/confirmation');
      
//   //     return { data, error: null };
//   //   } catch (error: any) {
//   //     console.error('❌ [AUTH] Tenant signup error:', error);
//   //     toast.error(error.message || 'Failed to create account');
//   //     return { error };
//   //   }
//   // };

//   // Landlord signup

// const signUpLandlord = async (firstName: string, lastName: string, email: string, password: string) => {
//   try {
//     console.log('🏠 [AUTH] Starting landlord signup...');
//     console.log('🔍 [AUTH] SENDING TO SUPABASE:', {
//       user_type: 'landlord',
//       first_name: firstName
//     });

//     // Get callback URL from localStorage if it exists (set by signup page)
//     const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
//     console.log('🔗 [AUTH] Callback URL:', callbackUrl);

//     // Step 1: Create auth user in Supabase
//     const { data, error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         data: {
//           first_name: firstName,
//           last_name: lastName,
//           full_name: `${firstName} ${lastName}`,
//           user_type: 'landlord',
//           auth_provider: 'email'
//         },
//         // ✅ Keep emailRedirectTo - callback route now handles missing user_type correctly
//         emailRedirectTo: `${window.location.origin}/auth/callback?user_type=landlord${callbackUrl ? '&redirect_to=' + encodeURIComponent(callbackUrl) : ''}`
//       }
//     });

//     if (error) {
//       console.error('❌ [AUTH] Landlord signup error:', error);
//       toast.error(error.message);
//       return { error };
//     }

//     console.log('✅ [AUTH] Supabase auth user created');

//     // Step 2: 🔥 IMMEDIATELY sync with FastAPI backend
//     // This ensures user_type is set correctly in public.users
//     if (data.user) {
//       console.log('📊 [AUTH] User ID from Supabase:', data.user.id);
//       console.log('📊 [AUTH] User Email from Supabase:', data.user.email);
//       console.log('⏳ [AUTH] Waiting for backend sync...');
      
//       const syncResult = await syncUserWithBackend(
//         data.user.id,
//         email,
//         firstName,
//         lastName,
//         'landlord'
//       );
      
//       console.log('✅ [AUTH] Backend sync complete:', syncResult);
//     } else {
//       console.error('❌ [AUTH] No user ID returned from Supabase!');
//     }

//     console.log('✅ [AUTH] Landlord signup successful');
//     toast.success('Account created! Please check your email to verify your account.');
    
//     // Store email for confirmation page
//     if (typeof window !== 'undefined') {
//       localStorage.setItem('signup_email', email);
//     }
    
//     // Redirect to confirmation page
//     router.push('/signup/landlord/confirmation');
    
//     return { data, error: null };
    
//   } catch (error: any) {
//     console.error('❌ [AUTH] Landlord signup error:', error);
//     toast.error(error.message || 'Failed to create account');
//     return { error };
//   }
// };





//   // const signUpLandlord = async (firstName: string, lastName: string, email: string, password: string) => {
//   //   try {
//   //     console.log('🏠 [AUTH] Starting landlord signup...');
//   //     console.log('🔍 [AUTH] SENDING TO SUPABASE:', {
//   //       user_type: 'landlord',  // Should print 'landlord'
//   //       first_name: firstName
//   //     });

//   //     const { data, error } = await supabase.auth.signUp({
//   //       email,
//   //       password,
//   //       options: {
//   //         data: {
//   //           first_name: firstName,
//   //           last_name: lastName,
//   //           full_name: `${firstName} ${lastName}`,
//   //           user_type: 'landlord',
//   //           auth_provider: 'email'
//   //         },
//   //         emailRedirectTo: `${window.location.origin}/auth/callback`
//   //       }
//   //     });

      
//   //     if (error) {
//   //       console.error('❌ [AUTH] Landlord signup error:', error);
//   //       toast.error(error.message);
//   //       return { error };
//   //     }

//   //     console.log('✅ [AUTH] Landlord signup successful');
//   //     toast.success('Account created! Please check your email to verify your account.');
      
//   //     // Store email for confirmation page
//   //     if (typeof window !== 'undefined') {
//   //       localStorage.setItem('signup_email', email);
//   //     }
      
//   //     // Redirect to confirmation page
//   //     router.push('/signup/landlord/confirmation');
      
//   //     return { data, error: null };
//   //   } catch (error: any) {
//   //     console.error('❌ [AUTH] Landlord signup error:', error);
//   //     toast.error(error.message || 'Failed to create account');
//   //     return { error };
//   //   }
//   // };

//   // Google signup for tenant
//   const signUpTenantWithGoogle = async () => {
//     try {
//       console.log('👤 [AUTH] Starting tenant Google signup...');
      
//       // ✅ CRITICAL: Get redirect URL from localStorage BEFORE OAuth
//       const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
//       console.log('📍 [AUTH] Redirect URL from localStorage:', callbackUrl);
      
//       // ✅ CRITICAL: Store in cookie BEFORE redirecting to Google
//       // This cookie will be read by the server-side callback handler
//       if (callbackUrl && typeof window !== 'undefined') {
//         const expirationDate = new Date();
//         expirationDate.setHours(expirationDate.getHours() + 1);
//         // Simple cookie without encoding - server will parse it
//         document.cookie = `nulo_redirect_path=${callbackUrl}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;
//         console.log('🍪 [AUTH] Stored redirect path in cookie:', callbackUrl);
//       }
      
//       // ✅ CRITICAL: Use simple redirectTo WITHOUT query params
//       // Supabase will add its own query params (?code=..., etc.)
//       // We rely on the cookie to preserve the redirect path
//       const baseCallbackUrl = `${window.location.origin}/auth/callback`;
//       console.log('🔀 [AUTH] Base callback URL (Supabase will add code):', baseCallbackUrl);
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: baseCallbackUrl,
//           queryParams: {
//             access_type: 'offline',
//             prompt: 'consent',
//           }
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Google signup error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Tenant Google signup initiated, will use cookie for redirect');
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Google signup error:', error);
//       toast.error(error.message || 'Failed to sign up with Google');
//       return { error };
//     }
//   };

//   // Google signup for landlord
//   const signUpLandlordWithGoogle = async () => {
//     try {
//       console.log('🏠 [AUTH] Starting landlord Google signup...');
      
//       // ✅ CRITICAL: Get redirect URL from localStorage BEFORE OAuth
//       const callbackUrl = typeof window !== 'undefined' ? localStorage.getItem('signup_callback_url') : null;
//       console.log('📍 [AUTH] Redirect URL from localStorage:', callbackUrl);
      
//       // ✅ CRITICAL: Store in cookie BEFORE redirecting to Google
//       // This cookie will be read by the server-side callback handler
//       if (callbackUrl && typeof window !== 'undefined') {
//         const expirationDate = new Date();
//         expirationDate.setHours(expirationDate.getHours() + 1);
//         // Simple cookie without encoding - server will parse it
//         document.cookie = `nulo_redirect_path=${callbackUrl}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;
//         console.log('🍪 [AUTH] Stored redirect path in cookie:', callbackUrl);
//       }
      
//       // ✅ CRITICAL: Use simple redirectTo WITHOUT query params
//       // Supabase will add its own query params (?code=..., etc.)
//       // We rely on the cookie to preserve the redirect path
//       const baseCallbackUrl = `${window.location.origin}/auth/callback`;
//       console.log('🔀 [AUTH] Base callback URL (Supabase will add code):', baseCallbackUrl);
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: baseCallbackUrl,
//           queryParams: {
//             access_type: 'offline',
//             prompt: 'consent',
//           }
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Google signup error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Landlord Google signup initiated, will use cookie for redirect');
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Google signup error:', error);
//       toast.error(error.message || 'Failed to sign up with Google');
//       return { error };
//     }
//   };

//   // Sign in
//   // Helper function to wait for user record to be created with exponential backoff
//   const waitForUserRecord = async (userId: string, maxAttempts = 8): Promise<User | null> => {
//     console.log(`🔍 [AUTH] Starting user record polling for ${userId} (max ${maxAttempts} attempts)`);
    
//     for (let i = 0; i < maxAttempts; i++) {
//       try {
//         // Create a new client instance to avoid lock conflicts
//         const freshClient = createClient();
        
//         // Add a small random delay to prevent thundering herd
//         if (i > 0) {
//           const randomDelay = Math.random() * 200 + 100; // 100-300ms random delay
//           await new Promise(resolve => setTimeout(resolve, randomDelay));
//         }
        
//         const { data, error } = await freshClient
//           .from('users')
//           .select('*')
//           .eq('id', userId)
//           .single();
        
//         if (data && !error) {
//           console.log(`✅ [AUTH] User record found on attempt ${i + 1}:`, {
//             id: data.id,
//             email: data.email,
//             user_type: data.user_type
//           });
//           return data as User;
//         }
        
//         // Handle specific errors gracefully
//         if (error?.code === 'PGRST116') {
//           console.log(`⏳ [AUTH] User record not yet available, attempt ${i + 1}/${maxAttempts}`);
//         } else if (error?.message?.includes('AbortError') || error?.message?.includes('signal is aborted')) {
//           console.log(`⏳ [AUTH] Lock timeout on attempt ${i + 1}/${maxAttempts}, retrying...`);
//         } else {
//           console.warn(`⚠️ [AUTH] Unexpected error on attempt ${i + 1}:`, error);
//         }
        
//         // Exponential backoff: 500ms, 1s, 2s, 4s
//         const delay = Math.min(500 * Math.pow(2, i), 4000);
//         console.log(`⏳ [AUTH] Waiting ${delay}ms before retry...`);
//         await new Promise(resolve => setTimeout(resolve, delay));
        
//       } catch (err: any) {
//         console.warn(`⚠️ [AUTH] Exception on attempt ${i + 1}:`, err);
//         // Continue trying even if there's an exception
//         if (i < maxAttempts - 1) {
//           await new Promise(resolve => setTimeout(resolve, 1000));
//         }
//       }
//     }
    
//     console.warn('⚠️ [AUTH] User record not found after all attempts - this might indicate a database issue');
//     return null;
//   };

//   const signIn = async (email: string, password: string, callbackUrl?: string) => {
//     try {
//       console.log('🔐 [AUTH] Starting sign in...');
      
//       // Use the session from signInWithPassword directly - no additional auth.getUser() call
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password
//       });

//       if (error) {
//         console.error('❌ [AUTH] Sign in error:', error.message);
//         toast.error(error.message);
//         throw error;
//       }

//       if (!data.user || !data.session) {
//         console.error('❌ [AUTH] No user/session returned from sign in');
//         toast.error('Sign in failed');
//         throw new Error('No user/session returned');
//       }

//       console.log('✅ [AUTH] Sign in successful for:', data.user.email);

//       // 🔥 IMPORTANT: Save tokens to localStorage immediately for API client
//       if (typeof window !== 'undefined' && data.session) {
//         localStorage.setItem('sb-access-token', data.session.access_token);
//         if (data.session.refresh_token) {
//           localStorage.setItem('sb-refresh-token', data.session.refresh_token);
//         }
//         console.log('💾 [AUTH] Tokens saved to localStorage for API client');
//       }

//       // Get callbackUrl from localStorage if not passed as parameter
//       if (!callbackUrl && typeof window !== 'undefined') {
//         callbackUrl = localStorage.getItem('signup_callback_url') || undefined;
//       }
      
//       // Build user object DIRECTLY from signIn response - no additional database queries
//       const firstName = data.user.user_metadata?.first_name || 'User';
//       const lastName = data.user.user_metadata?.last_name || 'Name';
//       const userType = data.user.user_metadata?.user_type || 'tenant';
      
//       const userData: User = {
//         id: data.user.id,
//         email: data.user.email || '',
//         first_name: firstName,
//         last_name: lastName,
//         full_name: data.user.user_metadata?.full_name || `${firstName} ${lastName}`,
//         user_type: userType as 'admin' | 'landlord' | 'tenant',
//         email_verified: data.user.email_confirmed_at ? true : false,
//         onboarding_completed: data.user.user_metadata?.onboarding_completed || false,
//         onboarding_step: data.user.user_metadata?.onboarding_step || 1,
//         verification_status: data.user.user_metadata?.verification_status || 'pending',
//         trust_score: 50,
//         created_at: data.user.created_at || new Date().toISOString(),
//         auth_provider: 'email',
//         phone_number: null,
//         password_hash: null,
//         avatar_url: null,
//         last_login_at: new Date().toISOString(),
//         updated_at: new Date().toISOString(),
//         deleted_at: null,
//         phone_verified: false,
//         location: null,
//         provider_id: null
//       };
      
//       setUser(userData);
      
//       // Try to fetch profile asynchronously - don't block sign in
//       fetchProfile(userData.id, userData.user_type).then(profileData => {
//         if (profileData) {
//           setProfile(profileData);
//         }
//       }).catch(err => {
//         console.warn('⚠️ [AUTH] Profile fetch failed (non-blocking):', err);
//       });

//       // Determine redirect path
//       let redirectPath = callbackUrl || '/';
      
//       if (!callbackUrl) {
//         if (userData.user_type === 'admin') {
//           redirectPath = '/admin';
//         } else if (userData.user_type === 'landlord') {
//           redirectPath = userData.email_verified ? '/landlord/overview' : '/signup/landlord/confirmation';
//         } else {
//           redirectPath = userData.email_verified ? '/properties' : '/signup/tenant/confirmation';
//         }
//       }

//       console.log('🔀 [AUTH] Redirecting to:', redirectPath);
      
//       // Clear callback URL from storage
//       if (typeof window !== 'undefined') {
//         localStorage.removeItem('signup_callback_url');
//       }
      
//       // Redirect immediately - no delay needed
//       router.push(redirectPath);
      
//       return { user: userData, redirectPath };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Sign in error:', error);
//       toast.error(error.message || 'Failed to sign in');
//       throw error;
//     }
//   };

// // ...
//   const signInWithGoogle = async (redirectUrl?: string) => {
//     try {
//       console.log('🔐 [AUTH] Starting Google sign in...');
      
//       // ✅ CRITICAL: Store redirect URL in cookie BEFORE OAuth
//       // This is used by the server-side callback handler
//       if (redirectUrl && typeof window !== 'undefined') {
//         const expirationDate = new Date();
//         expirationDate.setHours(expirationDate.getHours() + 1);
//         // Simple cookie without encoding - server will parse it
//         document.cookie = `nulo_redirect_path=${redirectUrl}; path=/; expires=${expirationDate.toUTCString()}; SameSite=Lax`;
//         console.log('🍪 [AUTH] Stored redirect path in cookie for Google signin:', redirectUrl);
//       }
      
//       // ✅ CRITICAL: Use simple redirectTo WITHOUT query params
//       // Supabase will add its own query params (?code=..., etc.)
//       const baseCallbackUrl = `${window.location.origin}/auth/callback`;
//       console.log('🔀 [AUTH] Base callback URL for signin:', baseCallbackUrl);
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: baseCallbackUrl,
//           queryParams: {
//             access_type: 'offline',
//             prompt: 'consent',
//           }
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Google sign in error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Google sign in initiated, will use cookie for redirect');
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Google sign in error:', error);
//       toast.error(error.message || 'Failed to sign in with Google');
//       return { error };
//     }
//   };

//   // Sign out
//   const signOut = async () => {
//     try {
//       console.log('👋 [AUTH] Signing out...');
      
//       // Sign out from Supabase immediately (don't wait to clear storage first)
//       supabase.auth.signOut().catch((error: any) => {
//         console.error('❌ [AUTH] Supabase sign out error:', error);
//       });
      
//       // Clear auth-related storage keys only (preserve other app data)
//       try {
//         const keysToClear = [
//           'sb-access-token',  // 🔥 NEW: Clear cached API token
//           'sb-refresh-token', // 🔥 NEW: Clear cached refresh token
//           'sb-auth-token',
//           'sb-session',
//           'signup_email',
//           'pending_profile_completion'
//         ];
//         keysToClear.forEach(key => {
//           localStorage.removeItem(key);
//           sessionStorage.removeItem(key);
//         });
        
//         // Also clear any Supabase auth keys (they have specific patterns)
//         const allKeys = Object.keys(localStorage);
//         allKeys.forEach(key => {
//           if (key.includes('supabase') || key.includes('auth') || key.includes('session')) {
//             localStorage.removeItem(key);
//           }
//         });
        
//         console.log('🧹 [AUTH] Cleared auth-related storage including cached tokens');
//       } catch (e) {
//         console.error('Error clearing storage:', e);
//       }
      
//       // Clear auth state immediately
//       setUser(null);
//       setProfile(null);
//       setNotifications([]);
//       setUnreadCount(0);
//       console.log('🧹 [AUTH] Cleared auth state');
      
//       console.log('✅ [AUTH] Sign out successful');
//       toast.success('Signed out successfully');
      
//       // Force immediate page redirect - this is synchronous
//       window.location.href = '/';
      
//     } catch (error: any) {
//       console.error('❌ [AUTH] Sign out error:', error);
//       toast.error(error.message || 'Failed to sign out');
      
//       // Force redirect even on error to ensure logout completes
//       window.location.href = '/';
//     }
//   };

//   // Reset password
//   const resetPassword = async (email: string) => {
//     try {
//       console.log('🔒 [AUTH] Sending password reset email...');
      
//       const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
//         redirectTo: `${window.location.origin}/auth/reset-password`
//       });

//       if (error) {
//         console.error('❌ [AUTH] Password reset error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Password reset email sent');
//       toast.success('Password reset email sent! Please check your inbox.');
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Password reset error:', error);
//       toast.error(error.message || 'Failed to send reset email');
//       return { error };
//     }
//   };

//   // Update user profile
//   const updateUserProfile = async (updates: Partial<User>) => {
//     try {
//       if (!user) {
//         throw new Error('No user logged in');
//       }

//       console.log('📝 [AUTH] Updating user profile...');
      
//       const { data, error } = await supabase
//         .from('users')
//         .update({
//           ...updates,
//           updated_at: new Date().toISOString()
//         })
//         .eq('id', user.id)
//         .select()
//         .single();

//       if (error) {
//         console.error('❌ [AUTH] Profile update error:', error);
//         toast.error(error.message);
//         throw error;
//       }

//       console.log('✅ [AUTH] Profile updated successfully');
//       setUser({ ...user, ...data });
//       toast.success('Profile updated successfully');
//     } catch (error: any) {
//       console.error('❌ [AUTH] Profile update error:', error);
//       throw error;
//     }
//   };

//   // Wrapper functions
//   const wrappedCompletePhase1Profile = async (profileData: any): Promise<void> => {
//     if (!user) throw new Error('No user logged in');
//     await completePhase1Profile(user.id, profileData);
//     const updatedUser = await fetchUser(user.id);
//     if (updatedUser) setUser(updatedUser);
//   };

//   const wrappedCompletePhase2Profile = async (documents: any[]): Promise<void> => {
//     if (!user) throw new Error('No user logged in');
//     await completePhase2Profile(user.id, documents);
//     const updatedUser = await fetchUser(user.id);
//     if (updatedUser) setUser(updatedUser);
//   };

//   const wrappedUpdateEmailVerification = async (): Promise<void> => {
//     if (!user) throw new Error('No user logged in');
//     await updateEmailVerification(user.id);
//     const updatedUser = await fetchUser(user.id);
//     if (updatedUser) setUser(updatedUser);
//   };

//   const wrappedUpdatePhoneVerification = async (phoneNumber: string): Promise<void> => {
//     if (!user) throw new Error('No user logged in');
//     await updatePhoneVerification(user.id, phoneNumber);
//     const updatedUser = await fetchUser(user.id);
//     if (updatedUser) setUser(updatedUser);
//   };

//   const wrappedCompleteOnboarding = async (): Promise<void> => {
//     if (!user) throw new Error('No user logged in');
//     if (!user.user_type) throw new Error('User type not set');
//     await completeOnboarding(user.id, user.user_type);
//     const updatedUser = await fetchUser(user.id);
//     if (updatedUser) setUser(updatedUser);
//   };

//   // 🚀 PERFORMANCE: Ultra-fast initialization with smart caching
//   useEffect(() => {
//     if (!isClient) return;
    
//     let mounted = true;
    
//     const initAuth = async () => {
//       try {
//         console.log('🚀 [AUTH] Ultra-fast init...');
        
//         // 🚀 STEP 1: Check localStorage cache first (fastest)
//         const cachedToken = localStorage.getItem('sb-access-token');
//         const cachedRefreshToken = localStorage.getItem('sb-refresh-token');
        
//         if (cachedToken && cachedToken.startsWith('eyJ') && cachedToken.length > 100) {
//           console.log('💾 [AUTH] Using cached tokens');
//           tokenCache.current = {
//             accessToken: cachedToken,
//             refreshToken: cachedRefreshToken,
//             expiresAt: Date.now() + 3600000, // 1 hour default
//             isValid: true
//           };
          
//           // Set loading false immediately
//           setLoading(false);
//           setAuthInitialized(true);
          
//           // 🚀 STEP 2: Validate tokens in background
//           refreshTokenIfNeeded().then(() => {
//             if (mounted) {
//               // Get session with validated tokens
//               supabase.auth.getSession().then(({ data: { session } }) => {
//                 if (session?.user && mounted) {
//                   const quickUser: User = {
//                     id: session.user.id,
//                     email: session.user.email || '',
//                     full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
//                     first_name: session.user.user_metadata?.first_name || '',
//                     last_name: session.user.user_metadata?.last_name || '',
//                     avatar_url: session.user.user_metadata?.avatar_url || null,
//                     user_type: session.user.user_metadata?.user_type || 'tenant',
//                     email_verified: session.user.email_confirmed_at ? true : false,
//                     onboarding_completed: false,
//                     onboarding_step: 1,
//                     created_at: session.user.created_at,
//                     updated_at: new Date().toISOString(),
//                     phone_number: session.user.user_metadata?.phone_number || null,
//                     phone_verified: false,
//                     verification_status: 'pending',
//                     auth_provider: session.user.user_metadata?.auth_provider || 'email'
//                   };
                  
//                   setUser(quickUser);
                  
//                   // 🚀 STEP 3: Fetch detailed data in background (non-blocking) - ONLY fetch one, not both
//                   // Profile will be fetched on-demand when component needs it
//                   fetchUser(session.user.id).then(detailedUser => {
//                     if (detailedUser && mounted) {
//                       setUser(detailedUser);
//                     }
//                   });
//                 }
//               });
//             }
//           });
//         } else {
//           // No cached tokens, do normal flow
//           const { data: { session } } = await supabase.auth.getSession();
          
//           if (!mounted) return;
          
//           if (session?.user) {
//             console.log('✅ [AUTH] Session found, setting user quickly');
            
//             const quickUser: User = {
//               id: session.user.id,
//               email: session.user.email || '',
//               full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
//               first_name: session.user.user_metadata?.first_name || '',
//               last_name: session.user.user_metadata?.last_name || '',
//               avatar_url: session.user.user_metadata?.avatar_url || null,
//               user_type: session.user.user_metadata?.user_type || 'tenant',
//               email_verified: session.user.email_confirmed_at ? true : false,
//               onboarding_completed: false,
//               onboarding_step: 1,
//               created_at: session.user.created_at,
//               updated_at: new Date().toISOString(),
//               phone_number: session.user.user_metadata?.phone_number || null,
//               phone_verified: false,
//               verification_status: 'pending',
//               auth_provider: session.user.user_metadata?.auth_provider || 'email'
//             };
            
//             setUser(quickUser);
            
//             // Cache tokens
//             tokenCache.current = {
//               accessToken: session.access_token,
//               refreshToken: session.refresh_token,
//               expiresAt: session.expires_at ? new Date(session.expires_at).getTime() : null,
//               isValid: true
//             };
            
//             localStorage.setItem('sb-access-token', session.access_token);
//             if (session.refresh_token) {
//               localStorage.setItem('sb-refresh-token', session.refresh_token);
//             }
            
//             // Fetch detailed data in background - ONLY fetch one, not both
//             // Profile will be fetched on-demand when component needs it
//             fetchUser(session.user.id).then(detailedUser => {
//               if (detailedUser && mounted) {
//                 setUser(detailedUser);
//               }
//             });
//           }
          
//           setLoading(false);
//           setAuthInitialized(true);
//         }
        
//       } catch (error: any) {
//         console.error('❌ [AUTH] Ultra-fast init error:', error);
//         setLoading(false);
//         setAuthInitialized(true);
//       }
//     };

//     initAuth();

//     return () => {
//       mounted = false;
//     // No refresh interval to clear (disabled for stability)
//     // clearInterval(refreshInterval);
//     };
//   }, []);

//   // Listen for auth changes - SIMPLIFIED
//   useEffect(() => {
//     let mounted = true;
    
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
//       if (!mounted) return;
      
//       try {
//         console.log('🔄 [AUTH] State changed:', event);
        
//         if (event === 'SIGNED_IN' && session?.user) {
//           console.log('✅ [AUTH] Fast sign-in detected');
          
//           // Set user from session immediately (fast path)
//           const quickUser: User = {
//             id: session.user.id,
//             email: session.user.email || '',
//             full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || 'User',
//             first_name: session.user.user_metadata?.first_name || '',
//             last_name: session.user.user_metadata?.last_name || '',
//             avatar_url: session.user.user_metadata?.avatar_url || null,
//             user_type: session.user.user_metadata?.user_type || 'tenant',
//             email_verified: session.user.email_confirmed_at ? true : false,
//             onboarding_completed: false,
//             onboarding_step: 1,
//             created_at: session.user.created_at,
//             updated_at: new Date().toISOString(),
//             phone_number: session.user.user_metadata?.phone_number || null,
//             phone_verified: false,
//             verification_status: 'pending',
//             auth_provider: session.user.user_metadata?.auth_provider || 'email'
//           };
          
//           if (mounted) {
//             setUser(quickUser);
            
//             // Fetch detailed data in background (non-blocking)
//             fetchUser(session.user.id).then(detailedUser => {
//               if (detailedUser && mounted) {
//                 setUser(detailedUser);
//               }
//             }).catch(() => {
//               console.log('ℹ️ [AUTH] Background fetch failed, using session data');
//             });
            
//             // Fetch profile in background (non-blocking)
//             fetchProfile(quickUser.id, quickUser.user_type).then(profileData => {
//               if (profileData && mounted) {
//                 setProfile(profileData);
//               }
//             }).catch(() => {
//               console.log('ℹ️ [AUTH] Profile fetch failed (new user)');
//             });
//           }
//         } else if (event === 'SIGNED_OUT') {
//           console.log('👋 [AUTH] User signed out');
//           if (mounted) {
//             setUser(null);
//             setProfile(null);
//             setNotifications([]);
//             setUnreadCount(0);
//           }
//         }
//       } catch (error: any) {
//         console.error('❌ [AUTH] Error in auth state change:', error);
//       }
//     });

//     return () => {
//       mounted = false;
//       subscription.unsubscribe();
//     };
//   }, []);

// // Notification functions
// const fetchNotifications = async () => {
//   try {
//     // Check if user is properly authenticated
//     if (!user) {
//       console.log('🔔 [AUTH] No user found - skipping notifications');
//       return;
//     }
    
//     console.log('🔔 [AUTH] Fetching notifications...');
//     const data = await notificationsAPI.getNotifications();
//     setNotifications(data.notifications || []);
//     setUnreadCount(data.notifications?.filter((n: AppNotification) => !n.read).length || 0);
//     console.log('✅ [AUTH] Fetched notifications:', data.notifications?.length || 0);
//   } catch (error: any) {
//     console.error('❌ [AUTH] Error fetching notifications:', error);
//     // Don't fail the app - just set empty notifications
//     setNotifications([]);
//     setUnreadCount(0);
    
//     // If it's a 404, disable further attempts
//     if (error.response?.status === 404) {
//       console.log('🔔 [AUTH] Notifications not available - feature disabled');
//     }
//   }
// };

// const markAsRead = async (notificationId: string) => {
//   try {
//     await notificationsAPI.markAsRead(notificationId);
//     setNotifications(prev => 
//       prev.map(n => n.id === notificationId ? { ...n, read: true, read_at: new Date().toISOString() } : n)
//     );
//     setUnreadCount(prev => Math.max(0, prev - 1));
//     console.log('✅ [AUTH] Marked as read:', notificationId);
//   } catch (error) {
//     console.error('❌ [AUTH] Error marking notification as read:', error);
//   }
// };

// const markAllAsRead = async () => {
//   try {
//     await notificationsAPI.markAllAsRead();
//     setNotifications(prev => 
//       prev.map(n => ({ ...n, read: true, read_at: new Date().toISOString() }))
//     );
//     setUnreadCount(0);
//     console.log('✅ [AUTH] Marked all as read');
//   } catch (error) {
//     console.error('❌ [AUTH] Error marking all notifications as read:', error);
//   }
// };

// // Real-time notifications subscription - DISABLED FOR STABILITY
// // useEffect(() => {
// //   if (!user || !user?.id) return;

// //   const channel = supabase
// //     .channel('notifications')
// //     .on(
// //       'postgres_changes' as const, 
// //       { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
// //       (payload: Record<string, any>) => {
// //         console.log(' [NOTIFICATIONS] Real-time notification received:', payload);
// //         const newNotification = payload.new as AppNotification;
// //         setNotifications(prev => [newNotification, ...prev]);
// //         setUnreadCount(prev => prev + 1);
// //       }
// //     )
// //     .subscribe();

// //   return () => {
// //     supabase.removeChannel(channel);
// //   };
// // }, [user?.id]); // Only re-run when user.id changes, not entire user object

// const value: AuthContextType = {
//   user,
//   userProfile,
//   setUser,
//   setProfile,
//   loading,
//   authInitialized, // ✅ NEW: Pass initialized flag
//   signUpAdmin,
//   signUpTenant,
//   signUpLandlord,
//   signUpTenantWithGoogle,
//   signUpLandlordWithGoogle,
//   signIn,
//   signInWithGoogle,
//   signOut,
//   resetPassword,
//   updateUserProfile,
//   completePhase1Profile: wrappedCompletePhase1Profile,
//   completePhase2Profile: wrappedCompletePhase2Profile,
//   updateEmailVerification: wrappedUpdateEmailVerification,
//   updatePhoneVerification: wrappedUpdatePhoneVerification,
//   completeOnboarding: wrappedCompleteOnboarding,
//   notifications, 
//   unreadCount,
//   fetchNotifications,
//   markAsRead,
//   markAllAsRead,
// };

// return (
//   <AuthContext.Provider value={value}>
//     {children}
//   </AuthContext.Provider>
// );
// }
