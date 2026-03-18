/**
 * Authentication Types
 * Correctly separates User, TenantProfile, and LandlordProfile based on database schema
 */

// Base User type from users table
export interface User {
  id: string;
  email: string;
  phone_number: string | null;
  password_hash?: string | null;
  full_name: string | null;
  avatar_url: string | null;
  trust_score: number | null;
  verification_status: string | null;
  user_type: 'admin' | 'landlord' | 'tenant';
  last_login_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  phone_verified: boolean | null;
  location: string | null;
  onboarding_completed: boolean | null;
  first_name: string | null;
  last_name: string | null;
  email_verified: boolean | null;
  onboarding_step: number | null;
  auth_provider: string | null;
  provider_id: string | null;
}

// Tenant Profile specific fields
export interface TenantProfile {
  id: string;
  user_id: string;
  full_name?: string | null;
  employment_status?: string | null;
  employment_type?: string | null;
  employer_name?: string | null;
  monthly_income?: number | null;
  employment_duration?: string | null;
  rent_budget?: number | null;
  preferred_move_in_date?: string | null;
  lease_duration_preference?: string | null;
  guarantor_available?: boolean | null;
  guarantor_name?: string | null;
  guarantor_phone?: string | null;
  guarantor_email?: string | null;
  guarantor_relationship?: string | null;
  guarantor_income?: number | null;
  id_document_url?: string | null;
  proof_of_income_url?: string | null;
  employment_letter_url?: string | null;
  rental_history_url?: string | null;
  background_check_consent?: boolean | null;
  credit_check_consent?: boolean | null;
  references_count?: number | null;
  verified_at?: string | null;
  verification_status?: string | null;
  verification_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Landlord Profile specific fields
export interface LandlordProfile {
  id: string;
  full_name?: string | null;
  user_id: string;
  account_type?: string | null;
  date_of_birth?: string | null;
  nin?: string | null;
  bvn?: string | null;
  nin_verified?: boolean | null;
  bvn_verified?: boolean | null;
  company_name?: string | null;
  cac_number?: string | null;
  tax_id?: string | null;
  owns_properties?: boolean | null;
  number_of_properties?: number | null;
  property_addresses?: any | null;
  property_documents?: any | null;
  id_document_url?: string | null;
  selfie_photo_url?: string | null;
  proof_of_address_url?: string | null;
  bank_statement_url?: string | null;
  cac_certificate_url?: string | null;
  tax_clearance_url?: string | null;
  bank_account_number?: string | null;
  bank_name?: string | null;
  account_name?: string | null;
  payment_method_verified?: boolean | null;
  verification_fee_paid?: boolean | null;
  verification_fee_amount?: number | null;
  verification_fee_paid_at?: string | null;
  verification_fee_reference?: string | null;
  verification_submitted_at?: string | null;
  verification_reviewed_at?: string | null;
  reviewed_by?: string | null;
  rejection_reason?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at: string;
}

// Admin Profile
export interface Admin {
  id: string;
  full_name?: string | null;
  user_id: string;
  role_level?: number | null;
  permissions?: any | null;
  last_action_at?: string | null;
  created_at: string;
  admin_code?: string | null;
  updated_at: string;
}

// Union type for any profile type
export type UserProfile = TenantProfile | LandlordProfile | Admin | null;

// Custom notification interface (avoid conflict with browser's Notification)
export interface AppNotification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  data?: any;
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at: string;
}

// Auth Context Type
export interface AuthContextType {
  user: User | null;
  userProfile: UserProfile;
  setUser: (user: User | null) => void;
  setProfile: (profile: UserProfile) => void;
  loading: boolean;
  authInitialized: boolean; // ✅ NEW: True after first auth check completes
    signUpAdmin: (fullName: string, email: string, password: string, adminCode: string) => Promise<any>;
  signUpTenant: (firstName: string, lastName: string, email: string, password: string) => Promise<any>;
  signUpLandlord: (firstName: string, lastName: string, email: string, password: string) => Promise<any>;
  signUpTenantWithGoogle: () => Promise<any>;
  signUpLandlordWithGoogle: () => Promise<any>;
  signIn: (email: string, password: string, callbackUrl?: string) => Promise<{ user: User; redirectPath: string }>;
  signInWithGoogle: (redirectUrl?: string) => Promise<any>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<any>;
  updateUserProfile: (updates: Partial<User>) => Promise<void>;
  completePhase1Profile: (profileData: any) => Promise<void>;
  completePhase2Profile: (documents: any[]) => Promise<void>;
  updateEmailVerification: () => Promise<void>;
  updatePhoneVerification: (phoneNumber: string) => Promise<void>;
  completeOnboarding: () => Promise<void>;

}
