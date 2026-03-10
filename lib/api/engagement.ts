/**
 * Engagement API Client
 * Handles all engagement-related API calls for both tenants and landlords
 */

import apiClient from './client';
import { toast } from 'sonner';

// ============================================================================
// TYPES
// ============================================================================

export interface EngagementMetrics {
  user_id: string;
  user_type: 'tenant' | 'landlord';
  engagement_score: number;
  trust_score: number;
  engagement_level: 'Low' | 'Medium' | 'High';
  metrics: {
    // Tenant Metrics
    favorites_count?: number;
    viewing_requests_count?: number;
    confirmed_viewings_count?: number;
    properties_viewed_count?: number;
    
    // Landlord Metrics
    properties_listed?: number;
    viewing_responses_count?: number;
    profile_completion_score?: number;
    avg_response_time_hours?: number;
    
    // Common Metrics
    messages_sent_count?: number;
    login_frequency?: number;
    profile_views?: number;
  };
  last_updated: string;
}

export interface EngagementActivity {
  user_id: string;
  activity_type: 'favorite_added' | 'viewing_requested' | 'viewing_confirmed' | 
                 'message_sent' | 'property_listed' | 'viewing_responded' | 
                 'property_viewed' | 'login';
  metadata?: Record<string, any>;
}

export interface EngagementHistory {
  id: string;
  user_id: string;
  engagement_score: number;
  trust_score: number;
  engagement_level: string;
  change_reason: string;
  created_at: string;
}

export interface EngagementUpdate {
  trust_score: number;
  engagement_score: number;
  engagement_level: string;
  engagement_bonus?: number;
}

export interface LeaderboardUser {
  id: string;
  full_name: string;
  user_type: 'tenant' | 'landlord';
  engagement_score: number;
  trust_score: number;
  engagement_level: string;
  avatar_url?: string;
  rank: number;
  engagement_level_color: string;
}

export interface EngagementStats {
  total_users: number;
  total_tenants: number;
  total_landlords: number;
  average_engagement_score: number;
  average_trust_score: number;
  engagement_distribution: {
    high: number;
    medium: number;
    low: number;
  };
  generated_at: string;
}

// ============================================================================
// API CLIENT
// ============================================================================

export const engagementAPI = {
  // Get user engagement metrics
  async getEngagementMetrics(userId: string): Promise<EngagementMetrics> {
    try {
      const response = await apiClient.get(`/api/v1/engagement/${userId}`, {
        timeout: 60000 // 60 seconds - slow endpoint
      });
      return response.data;
    } catch (error) {
      console.error('Failed to fetch engagement metrics:', error);
      throw error;
    }
  },

  // Update user engagement score
  async updateEngagementScore(userId: string): Promise<EngagementUpdate> {
    try {
      const response = await apiClient.post(`/api/v1/engagement/update/${userId}`);
      return response.data;
    } catch (error) {
      console.error('Failed to update engagement score:', error);
      throw error;
    }
  },

  // Track engagement activity
  async trackActivity(activity: EngagementActivity): Promise<{ success: boolean; message: string }> {
    try {
      const response = await apiClient.post('/api/v1/engagement/track', activity);
      return response.data;
    } catch (error) {
      console.error('Failed to track engagement activity:', error);
      throw error;
    }
  },

  // Get engagement history
  async getEngagementHistory(userId: string, limit: number = 50): Promise<EngagementHistory[]> {
    try {
      const response = await apiClient.get(`/api/v1/engagement/history/${userId}?limit=${limit}`);
      return response.data.history || [];
    } catch (error) {
      console.error('Failed to fetch engagement history:', error);
      throw error;
    }
  },

  // Get engagement leaderboard
  async getLeaderboard(userType?: 'tenant' | 'landlord', limit: number = 20): Promise<LeaderboardUser[]> {
    try {
      const params = new URLSearchParams();
      if (userType) params.append('user_type', userType);
      params.append('limit', limit.toString());
      
      const response = await apiClient.get(`/api/v1/engagement/leaderboard?${params}`);
      return response.data.leaderboard || [];
    } catch (error) {
      console.error('Failed to fetch engagement leaderboard:', error);
      throw error;
    }
  },

  // Get platform engagement stats (admin only)
  async getEngagementStats(): Promise<EngagementStats> {
    try {
      const response = await apiClient.get('/api/v1/engagement/stats/summary');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch engagement stats:', error);
      throw error;
    }
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

export const getEngagementLevelColor = (level: string): string => {
  switch (level) {
    case 'High':
      return 'green';
    case 'Medium':
      return 'orange';
    case 'Low':
    default:
      return 'blue';
  }
};

export const getEngagementLevelTextColor = (level: string): string => {
  switch (level) {
    case 'High':
      return 'text-green-700';
    case 'Medium':
      return 'text-orange-700';
    case 'Low':
    default:
      return 'text-blue-700';
  }
};

export const getEngagementLevelBgColor = (level: string): string => {
  switch (level) {
    case 'High':
      return 'bg-green-100';
    case 'Medium':
      return 'bg-orange-100';
    case 'Low':
    default:
      return 'bg-blue-100';
  }
};

export const getTrustScoreColor = (score: number): string => {
  if (score >= 80) return 'green';
  if (score >= 60) return 'orange';
  if (score >= 40) return 'yellow';
  return 'red';
};

export const getTrustScoreTextColor = (score: number): string => {
  if (score >= 80) return 'text-green-700';
  if (score >= 60) return 'text-orange-700';
  if (score >= 40) return 'text-yellow-700';
  return 'text-red-700';
};

export const getTrustScoreBgColor = (score: number): string => {
  if (score >= 80) return 'bg-green-100';
  if (score >= 60) return 'bg-orange-100';
  if (score >= 40) return 'bg-yellow-100';
  return 'bg-red-100';
};

// ============================================================================
// ACTIVITY TRACKING HELPER
// ============================================================================

export const trackEngagement = async (
  userId: string,
  activityType: EngagementActivity['activity_type'],
  metadata?: Record<string, any>
): Promise<void> => {
  try {
    await engagementAPI.trackActivity({
      user_id: userId,
      activity_type: activityType,
      metadata
    });
  } catch (error) {
    // Don't show toast for tracking errors to avoid spamming users
    console.warn('Failed to track engagement activity:', error);
  }
};

// ============================================================================
// ENGAGEMENT CALCULATION HELPERS
// ============================================================================

export const calculateEngagementProgress = (score: number): number => {
  return Math.min(score, 100);
};

export const getEngagementLevelDescription = (level: string): string => {
  switch (level) {
    case 'High':
      return 'Very active user with excellent platform engagement';
    case 'Medium':
      return 'Moderately active user with good platform usage';
    case 'Low':
    default:
      return 'New or inactive user, room for improvement';
  }
};

export const getTrustScoreDescription = (score: number): string => {
  if (score >= 80) return 'Excellent trust level - highly reliable user';
  if (score >= 60) return 'Good trust level - reliable user';
  if (score >= 40) return 'Moderate trust level - building reliability';
  return 'Low trust level - needs more engagement';
};

export default engagementAPI;
