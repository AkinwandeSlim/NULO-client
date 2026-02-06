/**
 * API Client for FastAPI Backend
 * Base configuration for all API requests
 * Updated for Supabase Auth integration
 * 🔧 FIXED: Added sensible default timeout to prevent infinite hangs
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createClient, cleanupSupabaseClient } from '@/utils/supabase/client';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// 🔧 FIX: Add default timeout of 30s for property fetches
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds default timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Supabase auth token with aggressive caching
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // 🔥 NEW: Try localStorage first to bypass Supabase client locks
      const cachedToken = localStorage.getItem('sb-access-token');
      const cachedRefreshToken = localStorage.getItem('sb-refresh-token');
      
      if (cachedToken && config.headers) {
        // Validate token format (basic check)
        if (cachedToken.startsWith('eyJ') && cachedToken.length > 100) {
          config.headers.Authorization = `Bearer ${cachedToken}`;
          
          // Also set token for middleware access (backup)
          if (typeof document !== 'undefined') {
            document.cookie = `access_token=${cachedToken}; path=/; max-age=3600; SameSite=Lax`;
          }
          
          console.log('🔐 [API CLIENT] Using cached token (bypass):', {
            url: config.url,
            hasToken: !!cachedToken,
            tokenLength: cachedToken.length
          });
          return config;
        }
      }
      
      // Only try Supabase client if no cached token available
      console.log('🔍 [API CLIENT] No cached token, trying Supabase client...');
      const supabase = createClient();
      let session = null;
      let retryCount = 0;
      const maxRetries = 1; // Single attempt only
      
      try {
        // Try once with a short timeout
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Session retrieval timeout')), 5000)
        );
        const sessionPromise = supabase.auth.getSession();
        const result = await Promise.race([sessionPromise, timeoutPromise]);
        session = result.data?.session;
      } catch (error: any) {
        // If Supabase fails, continue without token - public endpoints don't need it
        console.warn('⚠️ [API CLIENT] Could not get session, proceeding without token:', error.message);
      }
      
      if (session?.access_token && config.headers) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
        
        // Cache the token for future requests
        if (typeof document !== 'undefined') {
          localStorage.setItem('sb-access-token', session.access_token);
          if (session.refresh_token) {
            localStorage.setItem('sb-refresh-token', session.refresh_token);
          }
          document.cookie = `access_token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
        }
        
        console.log('🔐 [API CLIENT] Token attached from Supabase:', {
          url: config.url,
          hasToken: !!session.access_token,
          userId: session.user?.id
        });
      } else {
        console.warn('⚠️ [API CLIENT] No session token available after all attempts');
      }
    } catch (error) {
      console.error('❌ [API CLIENT] Error getting Supabase session:', error);
    }
    
    return config;
  },
  (error) => {
    console.error('❌ [API CLIENT] Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Prevent infinite loops
    if (originalRequest._retry) {
      return Promise.reject(error);
    }
    
    // Handle 401 errors (token expired/invalid)
    if (error.response?.status === 401) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh session using improved client with retry logic
        const supabase = createClient();
        let session = null;
        let retryCount = 0;
        const maxRetries = 2;
        
        while (retryCount < maxRetries) {
          try {
            const result = await supabase.auth.refreshSession();
            session = result.data.session;
            break;
          } catch (refreshError: any) {
            retryCount++;
            console.warn(`⚠️ [API CLIENT] Refresh attempt ${retryCount} failed:`, refreshError.message);
            
            if (refreshError.message?.includes('AbortError') || refreshError.message?.includes('signal is aborted')) {
              if (retryCount < maxRetries) {
                // Wait before retry with exponential backoff
                await new Promise(resolve => setTimeout(resolve, 200 * Math.pow(2, retryCount)));
              }
            } else {
              // For non-AbortError, don't retry
              throw refreshError;
            }
          }
        }
        
        if (!session?.access_token) {
          // If refresh fails, clear tokens and redirect to login
          localStorage.removeItem('sb-access-token');
          localStorage.removeItem('sb-refresh-token');
          localStorage.removeItem('access_token');
          localStorage.removeItem('user');
          window.location.href = '/signin';
          return Promise.reject(error);
        }
        
        // Update token and retry request
        originalRequest.headers.Authorization = `Bearer ${session.access_token}`;
        
        // 🔥 IMPORTANT: Save refreshed tokens to localStorage
        if (typeof document !== 'undefined') {
          localStorage.setItem('sb-access-token', session.access_token);
          if (session.refresh_token) {
            localStorage.setItem('sb-refresh-token', session.refresh_token);
          }
          document.cookie = `access_token=${session.access_token}; path=/; max-age=3600; SameSite=Lax`;
          console.log('💾 [API CLIENT] Refreshed tokens saved to localStorage');
        }
        
        return apiClient(originalRequest);
        
      } catch (refreshError) {
        // Refresh failed completely
        localStorage.removeItem('sb-access-token');
        localStorage.removeItem('sb-refresh-token');
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/signin';
        return Promise.reject(error);
      }
    }
    
    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.error('Access forbidden:', error.response.data);
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      console.error('Server error:', error.response.data);
    }
    
    return Promise.reject(error);
  }
);

// Helper function to get error message
export const getErrorMessage = (error: any): string => {
  // Check for FastAPI error format
  if (error.response?.data?.detail) {
    // FastAPI error format
    if (typeof error.response.data.detail === 'string') {
      return error.response.data.detail;
    }
    if (Array.isArray(error.response.data.detail)) {
      return error.response.data.detail[0]?.msg || 'An error occurred';
    }
  }
  
  // Check for other error message formats
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  
  // Handle empty response body with status code
  if (error.response?.status) {
    const statusMessages: Record<number, string> = {
      400: 'Bad request. Please check your input.',
      401: 'Invalid email or password.',
      403: 'Access forbidden. Your account may be disabled.',
      404: 'Resource not found.',
      422: 'Validation error. Please check your input.',
      500: 'Server error. Please try again later.',
      502: 'Bad gateway. Server is temporarily unavailable.',
      503: 'Service unavailable. Please try again later.',
    };
    
    return statusMessages[error.response.status] || `Error ${error.response.status}: ${error.message}`;
  }
  
  // Network errors
  if (error.message) {
    if (error.message.includes('Network Error')) {
      return 'Unable to connect to server. Please check your internet connection.';
    }
    if (error.message.includes('timeout')) {
      return 'Request timed out. Please try again.';
    }
    return error.message;
  }
  
  return 'An unexpected error occurred';
};

// Storage helpers
export const storage = {
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
      // Also set as cookie for middleware
      document.cookie = `access_token=${token}; path=/; max-age=3600; SameSite=Lax`;
    }
  },
  
  getToken: (): string | null => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('access_token');
    }
    return null;
  },
  
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      // Also remove cookie
      document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
    }
  },
  
  setUser: (user: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('user', JSON.stringify(user));
    }
  },
  
  getUser: (): any | null => {
    if (typeof window !== 'undefined') {
      const user = localStorage.getItem('user');
      return user ? JSON.parse(user) : null;
    }
    return null;
  },
  
  removeUser: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
    }
  },
  
  clear: () => {
    if (typeof window !== 'undefined') {
      console.log('🧹 [STORAGE] Clearing all authentication data...');
      localStorage.removeItem('access_token');
      localStorage.removeItem('sb-access-token');  
      localStorage.removeItem('sb-refresh-token'); 
      localStorage.removeItem('user');
      // Also remove cookies
      document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
      console.log('✅ [STORAGE] Authentication data cleared');
      
      // 🔧 CLEANUP: Reset Supabase client instance
      cleanupSupabaseClient();
    }
  },
};

export default apiClient;