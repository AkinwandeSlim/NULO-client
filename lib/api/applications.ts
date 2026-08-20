/**
 * Applications API Module
 * Handles all application-related API calls to FastAPI backend
 * Updated to match new database schema (user_id instead of tenant_id)
 */

import apiClient from './client';

// Reference interface for JSONB references field
export interface ApplicationReference {
  name: string;
  phone: string;
  relationship: string;
}

/**
 * BUG-025: Documents are stored in Supabase Storage as paths.
 * The server's GET /applications/{id} endpoint enriches each path with a
 * short-lived signed URL before returning, producing this shape. Legacy
 * rows may still hold raw URLs, so we keep the union open.
 */
export interface ApplicationDocument {
  path: string;
  url: string | null;
  filename: string;
}

export type ApplicationDocumentEntry = string | ApplicationDocument

// Types - Updated to match backend schema
export interface Application {
  id: string;
  property_id: string;
  user_id: string;  // Updated from tenant_id
  viewing_id?: string;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'rejected' | 'withdrawn';
  message?: string;
  employment_status?: string;
  employer_name?: string;
  monthly_income?: number;
  move_in_date?: string;
  lease_duration?: string;
  number_of_occupants?: number;
  has_pets?: boolean;
  pet_details?: string;
  references?: {
    reference1?: ApplicationReference;
    reference2?: ApplicationReference;
  };
  documents?: ApplicationDocumentEntry[];  // BUG-025: can be raw URL string (legacy) or enriched {path,url,filename} object
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  viewed_by_landlord?: boolean;
  viewed_at?: string;
  rejection_reason?: string;
  propflow_thread_id?: string;  // LangGraph thread ID for PropFlow workflow context
  created_at: string;
  updated_at: string;
  // Joined relationships
  property?: {
    id: string;
    title: string;
    description?: string;
    property_type?: string;
    address?: string;
    full_address?: string;
    location?: string;
    city?: string;
    state?: string;
    price?: number;
    payment_frequency?: string;
    security_deposit?: number;
    beds?: number;
    baths?: number;
    sqft?: number;
    amenities?: string[];
    rules?: string[];
    furnished?: boolean;
    pet_friendly?: boolean;
    images?: string[];
    video_tour_url?: string;
    status?: string;
    verification_status?: string;
    view_count?: number;
    application_count?: number;
  };
  user?: {
    id: string;
    email: string;
    full_name?: string;
    phone_number?: string;
    phone?: string;
    avatar_url?: string;
    user_type?: string;
  };
}

export interface CreateApplicationData {
  property_id: string;
  viewing_id?: string;
  message?: string;
  employment_status?: string;
  employer_name?: string;
  job_title?: string;
  employment_duration?: string;
  monthly_income?: number;
  move_in_date?: string;
  lease_duration?: string;
  number_of_occupants?: number;
  dependents?: number;
  has_pets?: boolean;
  pet_details?: string;
  references?: any;
  documents?: ApplicationDocumentEntry[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
}

export interface ApplicationsResponse {
  success: boolean;
  applications: Application[];
  total?: number;
}

export interface ApplicationStats {
  success: boolean;
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  };
}

// Applications API
export const applicationsAPI = {
  /**
   * Submit new application
   * Updated to use JSON with document URLs instead of FormData
   * Increased timeout to 60s for longer backend processing
   */
  create: async (data: CreateApplicationData): Promise<Application> => {
    const response = await apiClient.post<Application>('/api/v1/applications/', data, {
      timeout: 60000, // 60 seconds for application creation
    });
    return response.data;
  },

  /**
   * BUG-025 FIX: Upload a single application document via the server
   * (which uses the Supabase service-role key, bypassing RLS). Returns
   * the storage path that should be stored in applications.documents[].
   */
  uploadDocument: async (file: File): Promise<{ path: string; filename: string; size: number; content_type?: string }> => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(
      '/api/v1/applications/upload-document',
      formData,
      { 
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000, // 120 seconds (2 minutes) for large file uploads in Nigeria
      },
    )
    return response.data
  },

  /**
   * BUG-025 FIX: Fetch a short-lived signed URL for a single application
   * document. Used by the landlord view as a fallback when a document
   * entry comes back without a usable `url` (e.g. server-side enrichment
   * failed, or the path can't be signed because of permissions).
   */
  getDocumentSignedUrl: async (applicationId: string, path: string): Promise<{ url: string; expires_in: number }> => {
    const response = await apiClient.get<{ success: boolean; url: string; expires_in: number }>(
      `/api/v1/applications/${applicationId}/documents/signed-url`,
      { params: { path } },
    )
    return response.data
  },

  /**
   * Get tenant's own applications
   */
  getMyApplications: async (): Promise<ApplicationsResponse> => {
    const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/my-applications');
    return response.data;
  },

  /**
   * Fast version for dashboard - adaptive timeout for Nigeria connectivity
   */
  getMyApplicationsFast: async (): Promise<ApplicationsResponse> => {
    try {
      // First try with short timeout (10s) for responsive UX
      const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/my-applications', { timeout: 10000 });
      return response.data;
    } catch (error: any) {
      // If it's a timeout, try once more with longer timeout for poor connectivity
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        try {
          const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/my-applications', { timeout: 25000 });
          return response.data;
        } catch (retryError: any) {
          try {
            // Final fallback to standard method for reliability
            const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/my-applications');
            return response.data;
          } catch (finalError: any) {
            return { success: false, applications: [], total: 0 }
          }
        }
      }
      // For other errors, return empty immediately
      return { success: false, applications: [], total: 0 }
    }
  },

  /**
   * Get applications received by landlord
   */
  getReceivedApplications: async (): Promise<ApplicationsResponse> => {
    const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/received', {
      timeout: 60000 // 60 seconds - slow endpoint
    });
    return response.data;
  },

  /**
   * Get application statistics
   */
  getStats: async (): Promise<ApplicationStats> => {
    const response = await apiClient.get<ApplicationStats>('/api/v1/applications/stats');
    return response.data;
  },

  /**
   * Get all applications for current user (tenant or landlord)
   */
  getAll: async (): Promise<ApplicationsResponse> => {
    const response = await apiClient.get<ApplicationsResponse>('/api/v1/applications/');
    return response.data;
  },

  /**
   * Get application by ID
   */
  getById: async (id: string): Promise<Application> => {
    const response = await apiClient.get<{success: boolean, application: Application}>(`/api/v1/applications/${id}`);
    return response.data.application;
  },

  /**
   * Approve application (landlord only)
   */
  approve: async (id: string): Promise<{application: Application; agreement?: any}> => {
    // The PropFlow approve path awaits the full graph run (agreement creation +
    // best-effort OSS upload), which can take ~50s — well past the client's
    // 30s default timeout. Give it a matching long timeout so the client (and
    // the redirect-to-agreement path in the landlord page) doesn't give up
    // before the backend finishes (audit gap G4).
    const response = await apiClient.patch<{success: boolean; application: Application; agreement?: any; message: string}>(`/api/v1/applications/${id}/approve`, undefined, {
      timeout: 120000,
    });
    return {
      application: response.data.application,
      agreement: response.data.agreement
    };
  },

  /**
   * Reject application (landlord only)
   */
  reject: async (id: string, reason: string): Promise<Application> => {
    const response = await apiClient.patch<{success: boolean; application: Application; message: string}>(`/api/v1/applications/${id}/reject`, {
      reason,
      reason_code: 'landlord_rejected'
    });
    return response.data.application;
  },

  /**
   * Withdraw application (tenant only)
   */
  withdraw: async (id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/applications/${id}`);
  },
};

export default applicationsAPI;
