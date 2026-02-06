
// 'use client'

// import React, { createContext, useContext, useEffect, useState } from 'react';
// import { useRouter } from 'next/navigation';
// import { createClient } from '@/utils/supabase/client'
// import { toast } from 'sonner';
// import { 
//   User, 
//   UserProfile, 
//   AuthContextType,
//   TenantProfile,
//   LandlordProfile,
//   Admin 
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
//   const supabase = createClient();

//   // Simple function to get user from database
//   const fetchUser = async (userId: string): Promise<User | null> => {
//     try {
//       const { data, error } = await supabase
//         .from('users')
//         .select('*')
//         .eq('id', userId)
//         .single();

//       if (error || !data) {
//         console.error('❌ [AUTH] Error fetching user:', error);
//         return null;
//       }

//       console.log('✅ [AUTH] User fetched:', data);
//       return data as User;
//     } catch (error) {
//       console.error('❌ [AUTH] Error in fetchUser:', error);
//       return null;
//     }
//   };

//   // Simple function to get profile based on user type
//   const fetchProfile = async (userId: string, userType: string): Promise<UserProfile> => {
//     try {
//       if (userType === 'tenant') {
//         const { data } = await supabase
//           .from('tenant_profiles')
//           .select('*')
//           .eq('user_id', userId)
//           .single();
//         return data as TenantProfile;
//       } else if (userType === 'landlord') {
//         const { data } = await supabase
//           .from('landlord_profiles')
//           .select('*')
//           .eq('user_id', userId)
//           .single();
//         return data as LandlordProfile;
//       } else if (userType === 'admin') {
//         const { data } = await supabase
//           .from('admins')
//           .select('*')
//           .eq('user_id', userId)
//           .single();
//         return data as Admin;
//       }
//       return null;
//     } catch (error) {
//       console.error('❌ [AUTH] Error fetching profile:', error);
//       return null;
//     }
//   };

//   // Admin signup
//   const signUpAdmin = async (fullName: string, email: string, password: string, adminCode: string) => {
//     try {
//       console.log('👤 [AUTH] Starting admin signup...');
      
//       const { data: adminCodeData, error: codeError } = await supabase
//         .from('admin_codes')
//         .select('*')
//         .eq('code', adminCode)
//         .eq('is_used', false)
//         .single();

//       if (codeError || !adminCodeData) {
//         toast.error('Invalid or already used admin code');
//         return { error: { message: 'Invalid admin code' } };
//       }

//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             full_name: fullName,
//             user_type: 'admin'
//           },
//           emailRedirectTo: `${window.location.origin}/auth/callback`
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Admin signup error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       await supabase
//         .from('admin_codes')
//         .update({ is_used: true, used_by: data.user?.id })
//         .eq('code', adminCode);

//       console.log('✅ [AUTH] Admin signup successful');
//       toast.success('Admin account created successfully!');
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Admin signup error:', error);
//       toast.error(error.message || 'Failed to create admin account');
//       return { error };
//     }
//   };

//   // Tenant signup
//   const signUpTenant = async (firstName: string, lastName: string, email: string, password: string) => {
//     try {
//       console.log('👤 [AUTH] Starting tenant signup...');
      
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             first_name: firstName,
//             last_name: lastName,
//             full_name: `${firstName} ${lastName}`,
//             user_type: 'tenant',
//             auth_provider: 'email'
//           },
//           emailRedirectTo: `${window.location.origin}/auth/callback`
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Tenant signup error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Tenant signup successful');
//       toast.success('Account created! Please check your email to verify your account.');
      
//       // Store email for confirmation page
//       if (typeof window !== 'undefined') {
//         localStorage.setItem('signup_email', email);
//       }
      
//       // Redirect to confirmation page
//       router.push('/signup/tenant/confirmation');
      
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Tenant signup error:', error);
//       toast.error(error.message || 'Failed to create account');
//       return { error };
//     }
//   };

//   // Landlord signup
//   const signUpLandlord = async (firstName: string, lastName: string, email: string, password: string) => {
//     try {
//       console.log('🏠 [AUTH] Starting landlord signup...');
      
//       const { data, error } = await supabase.auth.signUp({
//         email,
//         password,
//         options: {
//           data: {
//             first_name: firstName,
//             last_name: lastName,
//             full_name: `${firstName} ${lastName}`,
//             user_type: 'landlord',
//             auth_provider: 'email'
//           },
//           emailRedirectTo: `${window.location.origin}/auth/callback`
//         }
//       });

//       if (error) {
//         console.error('❌ [AUTH] Landlord signup error:', error);
//         toast.error(error.message);
//         return { error };
//       }

//       console.log('✅ [AUTH] Landlord signup successful');
//       toast.success('Account created! Please check your email to verify your account.');
      
//       // Store email for confirmation page
//       if (typeof window !== 'undefined') {
//         localStorage.setItem('signup_email', email);
//       }
      
//       // Redirect to confirmation page
//       router.push('/signup/landlord/confirmation');
      
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Landlord signup error:', error);
//       toast.error(error.message || 'Failed to create account');
//       return { error };
//     }
//   };

//   // Google signup for tenant
//   const signUpTenantWithGoogle = async () => {
//     try {
//       console.log('👤 [AUTH] Starting tenant Google signup...');
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback?user_type=tenant`,
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

//       console.log('✅ [AUTH] Google signup initiated');
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
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback?user_type=landlord`,
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

//       console.log('✅ [AUTH] Google signup initiated');
//       return { data, error: null };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Google signup error:', error);
//       toast.error(error.message || 'Failed to sign up with Google');
//       return { error };
//     }
//   };

//   // Sign in
//   const signIn = async (email: string, password: string) => {
//     try {
//       console.log('🔐 [AUTH] Starting sign in...');
      
//       const { data, error } = await supabase.auth.signInWithPassword({
//         email,
//         password
//       });

//       if (error) {
//         console.error('❌ [AUTH] Sign in error:', error);
//         toast.error(error.message);
//         throw error;
//       }

//       console.log('✅ [AUTH] Sign in successful');
      
//       // Fetch user data
//       const userData = await fetchUser(data.user.id);
      
//       if (!userData) {
//         toast.error('Failed to load user profile');
//         throw new Error('Profile not found');
//       }

//       setUser(userData);
      
//       // Fetch profile
//       const profileData = await fetchProfile(userData.id, userData.user_type);
//       setProfile(profileData);

//       // Determine redirect path
//       let redirectPath = '/';
      
//       if (userData.user_type === 'landlord') {
//         if (!userData.email_verified) {
//           redirectPath = '/signup/landlord/confirmation';
//         } else if (!userData.onboarding_completed) {
//           redirectPath = `/onboarding/landlord/step-${userData.onboarding_step || 1}`;
//         } else {
//           redirectPath = '/landlord';
//         }
//       } else if (userData.user_type === 'tenant') {
//         if (!userData.email_verified) {
//           redirectPath = '/signup/tenant/confirmation';
//         } else {
//           redirectPath = '/properties';
//         }
//       } else if (userData.user_type === 'admin') {
//         redirectPath = '/admin';
//       }

//       toast.success('Welcome back!');
//       return { user: userData, redirectPath };
//     } catch (error: any) {
//       console.error('❌ [AUTH] Sign in error:', error);
//       throw error;
//     }
//   };

//   // Google sign in
//   const signInWithGoogle = async () => {
//     try {
//       console.log('🔐 [AUTH] Starting Google sign in...');
      
//       const { data, error } = await supabase.auth.signInWithOAuth({
//         provider: 'google',
//         options: {
//           redirectTo: `${window.location.origin}/auth/callback`,
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

//       console.log('✅ [AUTH] Google sign in initiated');
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
      
//       const { error } = await supabase.auth.signOut();
      
//       if (error) {
//         console.error('❌ [AUTH] Sign out error:', error);
//         toast.error(error.message);
//         return;
//       }

//       setUser(null);
//       setProfile(null);
      
//       console.log('✅ [AUTH] Sign out successful');
//       toast.success('Signed out successfully');
//       router.push('/');
//     } catch (error: any) {
//       console.error('❌ [AUTH] Sign out error:', error);
//       toast.error(error.message || 'Failed to sign out');
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
//     await completeOnboarding(user.id, user.user_type);
//     const updatedUser = await fetchUser(user.id);
//     if (updatedUser) setUser(updatedUser);
//   };

//   // Initialize auth state - SIMPLIFIED
//   useEffect(() => {
//     if (!isClient) return;
    
//     let mounted = true;
    
//     const initAuth = async () => {
//       try {
//         console.log('🔐 [AUTH] Initializing...');
        
//         const { data: { session } } = await supabase.auth.getSession();
        
//         if (!mounted) return;
        
//         if (session?.user) {
//           console.log('✅ [AUTH] Session found');
          
//           const userData = await fetchUser(session.user.id);
          
//           if (!mounted) return;
          
//           if (userData) {
//             setUser(userData);
//             const profileData = await fetchProfile(userData.id, userData.user_type);
//             setProfile(profileData);
//           }
//         }
        
//         setLoading(false);
//       } catch (error) {
//         console.error('❌ [AUTH] Init error:', error);
//         setLoading(false);
//       }
//     };

//     initAuth();

//     // Listen for auth changes
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
//       if (!mounted) return;
      
//       console.log('🔄 [AUTH] State changed:', event);
      
//       if (event === 'SIGNED_IN' && session?.user) {
//         const userData = await fetchUser(session.user.id);
//         if (userData && mounted) {
//           setUser(userData);
//           const profileData = await fetchProfile(userData.id, userData.user_type);
//           setProfile(profileData);
//         }
//       } else if (event === 'SIGNED_OUT') {
//         setUser(null);
//         setProfile(null);
//       }
//     });

//     return () => {
//       mounted = false;
//       subscription.unsubscribe();
//     };
//   }, []);

//   const value: AuthContextType = {
//     user,
//     userProfile,
//     setUser,
//     setProfile,
//     loading,
//     signUpAdmin,
//     signUpTenant,
//     signUpLandlord,
//     signUpTenantWithGoogle,
//     signUpLandlordWithGoogle,
//     signIn,
//     signInWithGoogle,
//     signOut,
//     resetPassword,
//     updateUserProfile,
//     completePhase1Profile: wrappedCompletePhase1Profile,
//     completePhase2Profile: wrappedCompletePhase2Profile,
//     updateEmailVerification: wrappedUpdateEmailVerification,
//     updatePhoneVerification: wrappedUpdatePhoneVerification,
//     completeOnboarding: wrappedCompleteOnboarding,
//   };

//   return (
//     <AuthContext.Provider value={value}>
//       {children}
//     </AuthContext.Provider>
//   );
// }