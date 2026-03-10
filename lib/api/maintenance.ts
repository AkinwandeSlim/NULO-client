/**
 * Maintenance API - Track property maintenance for rented properties
 * Matches backend routes in server/app/routes/maintenance.py
 */

import apiClient from './client';

// Types - Match backend Pydantic models
export interface MaintenanceRequest {
  id: string;
  property_id: string;
  tenant_id: string;
  landlord_id: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'HVAC' | 'PEST_CONTROL' | 'SECURITY' | 'STRUCTURAL' | 'OTHER';
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  status: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  preferred_date?: string;
  scheduled_date?: string;
  landlord_response?: string;
  resolution_notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  tenant_rating?: number;
  tenant_feedback?: string;
  photos?: string[];
  created_at: string;
  updated_at: string;
  property?: {
    id: string;
    title: string;
    address: string;
    city: string;
    state: string;
  };
  tenant?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
  landlord?: {
    id: string;
    full_name: string;
    email: string;
    phone: string;
  };
}

export interface CreateMaintenanceData {
  property_id: string;
  category: 'PLUMBING' | 'ELECTRICAL' | 'APPLIANCE' | 'HVAC' | 'PEST_CONTROL' | 'SECURITY' | 'STRUCTURAL' | 'OTHER';
  title: string;
  description: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH' | 'EMERGENCY';
  preferred_date?: string;
  photos?: File[];
}

export interface UpdateMaintenanceData {
  status?: 'PENDING' | 'ACKNOWLEDGED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  landlord_response?: string;
  resolution_notes?: string;
  estimated_cost?: number;
  actual_cost?: number;
  scheduled_date?: string;
  tenant_rating?: number;
  tenant_feedback?: string;
}

export interface MaintenanceFilters {
  status?: string;
  urgency?: string;
  property_id?: string;
}

export interface MaintenanceStats {
  total_requests: number;
  pending_requests: number;
  in_progress_requests: number;
  resolved_requests: number;
  emergency_requests: number;
  average_resolution_time_days: number;
  total_cost: number;
  by_category: Record<string, number>;
  by_urgency: Record<string, number>;
}

// Maintenance API - Matches backend routes
export const maintenanceAPI = {
  /**
   * Create new maintenance request (Tenant only)
   * POST /maintenance
   */
  create: async (data: CreateMaintenanceData, photos?: File[]): Promise<MaintenanceRequest> => {
    try {
      const formData = new FormData();
      
      // Add maintenance data
      formData.append('maintenance_data', JSON.stringify(data));
      
      // Add photos if provided
      if (photos && photos.length > 0) {
        photos.forEach((photo, index) => {
          formData.append(`photos`, photo);
        });
      }

      const response = await apiClient.post('/api/v1/maintenance', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to create maintenance request:', error);
      throw new Error(error.response?.data?.detail || 'Failed to create maintenance request');
    }
  },

  /**
   * Get all maintenance requests for current user
   * GET /maintenance
   */
  getAll: async (filters: MaintenanceFilters = {}): Promise<MaintenanceRequest[]> => {
    try {
      const params: any = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.urgency) params.urgency = filters.urgency;
      if (filters.property_id) params.property_id = filters.property_id;

      const response = await apiClient.get('/api/v1/maintenance', { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch maintenance requests:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch maintenance requests');
    }
  },

  /**
   * Get maintenance request by ID
   * GET /maintenance/{request_id}
   */
  getById: async (requestId: string): Promise<MaintenanceRequest> => {
    try {
      const response = await apiClient.get(`/api/v1/maintenance/${requestId}`);
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch maintenance request:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch maintenance request');
    }
  },

  /**
   * Update maintenance request
   * PATCH /maintenance/{request_id}
   */
  update: async (requestId: string, data: UpdateMaintenanceData): Promise<MaintenanceRequest> => {
    try {
      const response = await apiClient.patch(`/api/v1/maintenance/${requestId}`, data);
      return response.data;
    } catch (error: any) {
      console.error('Failed to update maintenance request:', error);
      throw new Error(error.response?.data?.detail || 'Failed to update maintenance request');
    }
  },

  /**
   * Get maintenance requests for a specific property
   * GET /maintenance/property/{property_id}
   */
  getByProperty: async (propertyId: string, filters: MaintenanceFilters = {}): Promise<MaintenanceRequest[]> => {
    try {
      const params: any = {};
      
      if (filters.status) params.status = filters.status;
      if (filters.urgency) params.urgency = filters.urgency;

      const response = await apiClient.get(`/api/v1/maintenance/property/${propertyId}`, { params });
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch property maintenance requests:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch property maintenance requests');
    }
  },

  /**
   * Upload maintenance photos
   * POST /maintenance/{request_id}/photos
   */
  uploadPhotos: async (requestId: string, photos: File[]): Promise<string[]> => {
    try {
      const formData = new FormData();
      
      photos.forEach((photo) => {
        formData.append('photos', photo);
      });

      const response = await apiClient.post(`/api/v1/maintenance/${requestId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Failed to upload maintenance photos:', error);
      throw new Error(error.response?.data?.detail || 'Failed to upload maintenance photos');
    }
  },

  /**
   * Get maintenance statistics
   * GET /maintenance/stats/summary
   */
  getStats: async (): Promise<MaintenanceStats> => {
    try {
      const response = await apiClient.get('/api/v1/maintenance/stats/summary');
      return response.data;
    } catch (error: any) {
      console.error('Failed to fetch maintenance stats:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch maintenance stats');
    }
  }
};

export default maintenanceAPI;
