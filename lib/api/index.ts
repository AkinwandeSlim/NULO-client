/**
 * API Module Index
 * Central export for all API modules
 */

export { default as apiClient, storage, getErrorMessage } from './client';
export { default as authAPI } from './auth';
export { default as propertiesAPI } from './properties';
export { default as applicationsAPI } from './applications';
export { favoritesAPI } from './favorites';
export { tenantsAPI } from './tenants';
export { viewingRequestsAPI } from './viewingRequests';
export { messagesAPI } from './messages';

// Re-export types
export type { RegisterData, LoginData, AuthResponse, User } from './auth';
export type { Property, PropertySearchParams, CreatePropertyData } from './properties';
export type { Application, CreateApplicationData } from './applications';
export type { Favorite } from './favorites';
export type { ProfileStatus, TenantProfile, CompleteProfileData } from './tenants';
export type { ViewingRequest, CreateViewingRequestData } from './viewingRequests';
export type { Message, Conversation, CreateConversationData } from './messages';
