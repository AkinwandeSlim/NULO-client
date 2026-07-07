/**
 * API Client for FastAPI Backend
 * Base configuration for all API requests
 * Updated for Supabase Auth integration
 * 🔧 FIXED: Added sensible default timeout to prevent infinite hangs
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { createClient, cleanupSupabaseClient } from '@/utils/supabase/client';

// API Base URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

// 🔧 TIMEOUT STRATEGY: 
// - Default: 30s (for most endpoints)
// - Dashboard: 15s (show error quickly, let user retry)
// - Heavy operations: 60s max (with early error feedback)
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds default
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add Supabase auth token with aggressive caching
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      // Log the full URL being called
      console.log(`📍 [API CLIENT] Request: ${config.method?.toUpperCase()} ${config.baseURL}${config.url}`);
      
      // If we're sending FormData, delete the default Content-Type header so browser can set it with boundary
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type'];
      }
      
      // ── NEW: Try localStorage first to bypass Supabase client locks ──
      let token = localStorage.getItem("sb-access-token");
      let validToken = null;
      
      if (token) {
        // Validate token format and expiration
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1]));
            // Check if token has required claims and is not expired
            if (payload.exp && payload.exp > Date.now() / 1000) {
              validToken = token;
              console.log('✅ [API CLIENT] Using valid cached token');
            } else {
              console.warn('⚠️ [API CLIENT] Cached token is expired, clearing...');
              localStorage.removeItem('sb-access-token');
              localStorage.removeItem('sb-refresh-token');
              token = null;
            }
          }
        } catch (tokenError) {
          console.warn('⚠️ [API CLIENT] Invalid cached token, clearing...');
          localStorage.removeItem('sb-access-token');
          localStorage.removeItem('sb-refresh-token');
          token = null;
        }
      }
      
      // If no valid cached token, try Supabase client
      if (!validToken) {
        console.log('🔍 [API CLIENT] No valid cached token, trying Supabase client...');
        const supabase = createClient();
        let session = null;
        
        try {
          // Try once with a short timeout
          const timeoutPromise = new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Session retrieval timeout')), 5000)
          );
          const sessionPromise = supabase.auth.getSession();
          const result = await Promise.race([sessionPromise, timeoutPromise]);
          session = result.data?.session;
          
          if (session?.access_token) {
            validToken = session.access_token;
            // Cache the new token
            localStorage.setItem('sb-access-token', session.access_token);
            if (session.refresh_token) {
              localStorage.setItem('sb-refresh-token', session.refresh_token);
            }
          }
        } catch (error: any) {
          // If Supabase fails, continue without token - public endpoints don't need it
          console.warn('⚠️ [API CLIENT] Could not get session, proceeding without token:', error.message);
        }
      }
      
      if (validToken && config.headers) {
        config.headers.Authorization = `Bearer ${validToken}`;
        
        // Also set token for middleware access (backup)
        if (typeof document !== 'undefined') {
          document.cookie = `access_token=${validToken}; path=/; max-age=3600; SameSite=Lax`;
        }
        
        console.log('🔐 [API CLIENT] Token attached to request');
      } else {
        console.warn('⚠️ [API CLIENT] No valid token available, proceeding without auth header');
      }
    } catch (error) {
      console.error('❌ [API CLIENT] Error in request interceptor:', error);
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
    
    // Handle 403 Forbidden - Check if it's a license error
    if (error.response?.status === 403) {
      const data = error.response.data as any
      
      // Log full response for debugging
      console.warn('⚠️ [API CLIENT] Got 403 Forbidden response:', {
        statusCode: error.response.status,
        statusText: error.response.statusText,
        data: data,
        dataKeys: data ? Object.keys(data) : 'no data',
        errorField: data?.error,
        messageField: data?.message,
        detailField: data?.detail,
      })
      
      // Check if it's a license error (try multiple field patterns)
      const isLicenseError = 
        data?.error === 'LICENSE_EXPIRED' ||
        data?.message === 'LICENSE_EXPIRED' ||
        data?.detail?.includes('license') ||
        data?.message?.includes('license') ||
        data?.message?.includes('License') ||
        data?.error?.includes('license')
      
      if (isLicenseError) {
        console.error('🔒 [API CLIENT] LICENSE EXPIRED - Dispatching event for hook to handle');
        
        // Dispatch custom event that the hook can listen to
        const licenseEvent = new CustomEvent('licenseExpired', {
          detail: {
            error: data?.error || 'LICENSE_EXPIRED',
            message: data?.message || 'License expired',
            detail: data?.detail || 'The application license has expired. Please contact support to renew your license.',
            support: data?.support || process.env.NEXT_PUBLIC_SUPPORT_EMAIL || 'support@nuloafrica.com',
          }
        })
        window.dispatchEvent(licenseEvent)
        console.log('✅ [API CLIENT] License expired event dispatched')
      } else {
        console.error('❌ [API CLIENT] Access forbidden (non-license):', error.response.data);
      }
    }
    
    // Handle 500 Server Error
    if (error.response?.status === 500) {
      const data = error.response.data;
      const hasContent = data && typeof data === 'object' && Object.keys(data).length > 0;
      console.error('Server error (500):', {
        url: error.config?.url,
        method: error.config?.method?.toUpperCase(),
        status: error.response.status,
        statusText: error.response.statusText,
        data: hasContent ? data : '(empty body)',
        message: hasContent ? null : `Empty 500 response from ${error.config?.url} - check server logs for stack trace`,
      });
    }

    // ── Auto-retry on transient network errors / 502 / 503 ──────────────────
    // Only retries safe GET requests (never mutations). Up to 2 retries with
    // exponential backoff (800ms → 1600ms). Handles backend briefly restarting.
    const method = (error.config?.method ?? '').toUpperCase()
    const retryCount: number = (error.config as any)?._retryCount ?? 0
    const isNetworkError = !error.response && error.code !== 'ECONNABORTED'
    const isRetryableStatus = error.response?.status === 503 || error.response?.status === 502
    const isRetryableMethod = method === 'GET'

    if (isRetryableMethod && (isNetworkError || isRetryableStatus) && retryCount < 2) {
      const delay = 800 * Math.pow(2, retryCount) // 800ms then 1600ms
      console.warn(`⚠️ [API CLIENT] Transient error on GET ${error.config?.url} — retry ${retryCount + 1}/2 in ${delay}ms`)
      await new Promise(resolve => setTimeout(resolve, delay))
      ;(error.config as any)._retryCount = retryCount + 1
      return apiClient(error.config!)
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