/**
 * Unified Admin Dashboard API Client
 * Single endpoint for all admin dashboard data
 * Aligned with backend /admin/dashboard/stats endpoint
 */

import apiClient from './client';

// ============================================================================
// UNIFIED TYPES - Matching Backend Response Structure EXACTLY
// ============================================================================

export interface AdminDashboardStats {
  // Landlord Statistics
  landlords: {
    total: number;
    pending_verification: number;
    verified: number;
    rejected: number;
    pending_onboarding: number;
  };
  
  // Tenant Statistics  
  tenants: {
    total: number;
    pending_verification: number;
    verified: number;
    rejected: number;
    with_applications?: number;
  };
  
  // Property Statistics
  properties: {
    total: number;
    pending_verification: number;
    verified: number;
    rejected: number;
    under_review: number;
    available: number;
    rented: number;
  };
  
  // Onboarding Statistics
  onboarding: {
    completed_submissions: number;
    pending_admin_review: number;
    in_review: number;
    approved: number;
  };
  
  // Recent Activity
  recent_activity: {
    new_landlord_signups_today: number;
    new_tenant_signups_today: number;
    new_properties_today: number;
    pending_landlord_verifications: number;
    pending_tenant_verifications: number;
    pending_property_verifications: number;
  };
}

export interface RecentActivityResponse {
  recent_tenant_signups: Array<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    verification_status: string;
  }>;
  recent_landlord_signups: Array<{
    id: string;
    email: string;
    full_name: string;
    created_at: string;
    verification_status: string;
  }>;
  recent_property_submissions: Array<{
    id: string;
    title: string;
    created_at: string;
    status: string;
    verification_status: string;
    landlord_id: string;
  }>;
  recent_onboarding_submissions: Array<{
    id: string;
    landlord_id: string;
    onboarding_completed_at: string;
    admin_review_status: string;
  }>;
  period_days: number;
}

export interface RecentSignup {
  id: string;
  email: string;
  full_name: string;
  user_type: 'landlord' | 'tenant';
  verification_status: string;
  created_at: string;
  account_type?: 'individual' | 'company';
  company_name?: string;
  onboarding_completed_at?: string;
}

// ============================================================================
// UNIFIED API CLIENT - Using correct backend endpoints
// ============================================================================

class AdminDashboardAPI {
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Get comprehensive admin dashboard statistics
   * Uses backend endpoint: /api/v1/admin/dashboard/stats
   */
  async getDashboardStats(): Promise<AdminDashboardStats> {
    const cacheKey = 'dashboard-stats';
    
    // Return existing promise if request is in progress
    if (this.pendingRequests.has(cacheKey)) {
      console.log('⏳ [ADMIN DASHBOARD] Stats request already in progress, waiting...');
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        console.log('📤 [ADMIN DASHBOARD] Fetching unified dashboard stats...');
        
        const response = await apiClient.get('/api/v1/admin/dashboard/stats');
        
        console.log('✅ [ADMIN DASHBOARD] Dashboard stats retrieved successfully');
        return response.data;
      } catch (error: any) {
        console.error('❌ [ADMIN DASHBOARD] Failed to fetch dashboard stats:', error);
        throw new Error(error.response?.data?.detail || 'Failed to fetch dashboard statistics');
      } finally {
        // Clean up the completed request
        this.pendingRequests.delete(cacheKey);
      }
    })();

    // Store the promise and return it
    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  /**
   * Get recent activity (last N days)
   * Uses backend endpoint: /api/v1/admin/dashboard/recent-activity
   */
  async getRecentActivity(days: number = 7): Promise<RecentActivityResponse> {
    const cacheKey = `recent-activity-${days}`;
    
    // Return existing promise if request is in progress
    if (this.pendingRequests.has(cacheKey)) {
      console.log(`⏳ [ADMIN DASHBOARD] Recent activity request already in progress, waiting...`);
      return this.pendingRequests.get(cacheKey);
    }

    const requestPromise = (async () => {
      try {
        console.log(`📤 [ADMIN DASHBOARD] Fetching recent activity (${days} days)...`);
        
        const response = await apiClient.get(`/api/v1/admin/dashboard/recent-activity?days=${days}`);
        
        console.log('✅ [ADMIN DASHBOARD] Recent activity retrieved successfully');
        return response.data;
      } catch (error: any) {
        console.error('❌ [ADMIN DASHBOARD] Failed to fetch recent activity:', error);
        throw new Error(error.response?.data?.detail || 'Failed to fetch recent activity');
      } finally {
        // Clean up the completed request
        this.pendingRequests.delete(cacheKey);
      }
    })();

    // Store the promise and return it
    this.pendingRequests.set(cacheKey, requestPromise);
    return requestPromise;
  }

  // ============================================================================
  // HELPER METHODS - For backward compatibility
  // ============================================================================

  /**
   * Get recent signups (backward compatibility)
   * Maps to recent activity endpoint
   */
  async getRecentSignups(days: number = 7): Promise<{ recent_signups: any[] }> {
    try {
      const activity = await this.getRecentActivity(days);
      
      // Combine landlord and tenant signups
      const recentSignups = [
        ...activity.recent_landlord_signups.map(signup => ({
          ...signup,
          user_type: 'landlord' as const
        })),
        ...activity.recent_tenant_signups.map(signup => ({
          ...signup,
          user_type: 'tenant' as const
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      return { recent_signups: recentSignups };
    } catch (error: any) {
      console.error('❌ [ADMIN DASHBOARD] Failed to fetch recent signups:', error);
      throw new Error(error.response?.data?.detail || 'Failed to fetch recent signups');
    }
  }

  /**
   * Get dashboard activity summary
   */
  async getActivitySummary(): Promise<string> {
    try {
      const stats = await this.getDashboardStats();
      
      const pendingTotal = stats.landlords.pending_verification + 
                          stats.tenants.pending_verification + 
                          stats.properties.pending_verification;
      const newUsersToday = stats.recent_activity.new_landlord_signups_today + 
                          stats.recent_activity.new_tenant_signups_today;
      const newPropertiesToday = stats.recent_activity.new_properties_today;
      
      if (pendingTotal > 0) {
        return `${pendingTotal} pending reviews • ${newUsersToday} new users today • ${newPropertiesToday} new properties`;
      } else {
        return `${newUsersToday} new users today • ${newPropertiesToday} new properties • All caught up!`;
      }
    } catch (error) {
      return 'Loading activity summary...';
    }
  }

  /**
   * Get priority level based on pending items
   */
  async getPriorityLevel(): Promise<'urgent' | 'high' | 'low'> {
    try {
      const stats = await this.getDashboardStats();
      const pendingTotal = stats.landlords.pending_verification + 
                          stats.tenants.pending_verification + 
                          stats.properties.pending_verification;
      
      if (pendingTotal > 20) return 'urgent';
      if (pendingTotal > 5) return 'high';
      return 'low';
    } catch (error) {
      return 'low';
    }
  }

  // ============================================================================
  // LEGACY COMPATIBILITY METHODS
  // ============================================================================

  getTotalPendingVerifications(stats: AdminDashboardStats): number {
    return stats.landlords.pending_verification + 
           stats.tenants.pending_verification + 
           stats.properties.pending_verification;
  }

  getTotalVerifiedUsers(stats: AdminDashboardStats): number {
    return stats.landlords.verified + stats.tenants.verified;
  }

  getActivitySummaryFromStats(stats: AdminDashboardStats): string {
    const pendingTotal = this.getTotalPendingVerifications(stats);
    const newUsersToday = stats.recent_activity.new_landlord_signups_today + 
                        stats.recent_activity.new_tenant_signups_today;
    const newPropertiesToday = stats.recent_activity.new_properties_today;
    
    if (pendingTotal > 0) {
      return `${pendingTotal} pending reviews • ${newUsersToday} new users today • ${newPropertiesToday} new properties`;
    } else {
      return `${newUsersToday} new users today • ${newPropertiesToday} new properties • All caught up!`;
    }
  }

  getPriorityLevelFromStats(stats: AdminDashboardStats): 'urgent' | 'high' | 'low' {
    const pendingTotal = this.getTotalPendingVerifications(stats);
    
    if (pendingTotal > 20) return 'urgent';
    if (pendingTotal > 5) return 'high';
    return 'low';
  }
}

// ============================================================================
// EXPORT SINGLETON INSTANCE
// ============================================================================

export const adminDashboardAPI = new AdminDashboardAPI();
export default adminDashboardAPI;
