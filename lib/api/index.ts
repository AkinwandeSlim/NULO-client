/**
 * API Module Index
 * Central export for all API modules
 */

export { default as apiClient, storage, getErrorMessage } from './client';
export { default as authAPI } from './auth';
export { default as adminAPI } from './admin';
export { default as adminDashboardAPI } from './adminDashboard';
export { default as propertyVerificationAPI } from './propertyVerification';
export { default as propertiesAPI } from './properties';
export { default as applicationsAPI } from './applications';
export { default as landlordUsersAPI } from './landlordUsers';
export { default as tenantUsersAPI } from './tenantUsers';
export { default as verificationAPI } from './verification';
export { default as dashboardAPI } from './dashboard'


export { favoritesAPI } from './favorites';
export { tenantsAPI } from './tenants';
export { viewingRequestsAPI } from './viewingRequestsLandlord';
export { messagesAPI } from './messages';
export { agreementsAPI } from './agreements';

// Re-export types
export type { RegisterData, LoginData, AuthResponse, User } from './auth';
export type { AdminRegisterData, AdminProfileData, AdminAuthResponse, AdminProfileResponse } from './admin';
export type { AdminDashboardStats } from './adminDashboard';
export type { 
  PropertyStats, 
  PropertyFilters,
  PropertyVerificationAction,
  BulkPropertyAction 
} from './propertyVerification';
// export type { Property, PropertySearchParams } from './properties';
export type { Property,PropertySearchParams, CreatePropertyData, UpdatePropertyData } from '../types/property';
export type { Application, CreateApplicationData } from './applications';
export type { Favorite } from './favorites';
export type { ProfileStatus, TenantProfile, CompleteProfileData } from './tenants';
export type { ViewingRequest,ViewingRequestsResponse, CreateViewingRequestData,LandlordReviewData,UpdateViewingRequestData } from './viewingRequestsLandlord';
export type { Message, Conversation, ConversationDetail, MessagesPagination, ConversationPartner, ConversationProperty, MessageSender } from './messages';
export type { AgreementWithDetails } from './agreements';







// Verification types
export type {
  LandlordVerification,
  VerificationStats,
  VerificationDetail,
  RequestCorrectionPayload,
  ReviewVerificationPayload
} from './verification';



// Landlord Users types
export type {
  LandlordUser,
  LandlordStats,
  LandlordDetail,
  LandlordListParams,
  LandlordListResponse,
  LandlordUpdateData
} from './landlordUsers';


// Landlord Users types
export type {
  TenantUser,
  TenantStats,
  TenantDetail,
  TenantListParams,
  TenantListResponse,
  TenantUpdateData
} from './tenantUsers';


// Add these types
export type {
  DashboardStats,
  LandlordDashboardStats,
  TenantDashboardStats,
  PropertyDashboardStats,
  RecentActivity,
  RecentSignup,
  RecentSignupsResponse,
  ActivityMetrics,
  VerificationMetrics,
  PlatformOverview
} from './dashboard'















