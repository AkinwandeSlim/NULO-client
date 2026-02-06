/**
 * Notifications API Module
 * Handles all notification-related API calls to FastAPI backend
 */

import apiClient from './client';
import type { AppNotification } from '@/types/auth';
export interface NotificationResponse {
  notifications: AppNotification[];
  unread_count?: number;
}

// Notifications API
export const notificationsAPI = {
  /**
   * Get notifications for current user
   */
  getNotifications: async (options: {
    unread_only?: boolean;
    limit?: number;
  } = {}): Promise<NotificationResponse> => {
    console.log('🔔 [NOTIFICATIONS API] Fetching notifications...', options);
    console.log('🔔 [NOTIFICATIONS API] Current user:', JSON.parse(localStorage.getItem('user') || '{}'));
    
    try {
      const params = new URLSearchParams();
      if (options.unread_only) params.append('unread_only', 'true');
      if (options.limit) params.append('limit', options.limit.toString());
      
      const response = await apiClient.get<NotificationResponse>(
        `/api/v1/notifications/?${params.toString()}`
      );
      
      console.log('✅ [NOTIFICATIONS API] Fetched notifications:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS API] Failed to fetch notifications:', error);
      
      if (error.response) {
        console.error('❌ [NOTIFICATIONS API] Response status:', error.response.status);
        console.error('❌ [NOTIFICATIONS API] Response data:', error.response.data);
        
        // If it's a 404, return empty result instead of throwing
        if (error.response.status === 404) {
          console.log('🔔 [NOTIFICATIONS API] Notifications endpoint not found - returning empty result');
          return { notifications: [] };
        }
      }
      
      throw error;
    }
  },

  /**
   * Get unread count for current user
   */
  getUnreadCount: async (): Promise<{ count: number }> => {
    console.log('🔢 [NOTIFICATIONS API] Getting unread count...');
    
    try {
      const response = await apiClient.get<{ count: number }>(
        '/api/v1/notifications/unread-count'
      );
      
      console.log('✅ [NOTIFICATIONS API] Unread count:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS API] Failed to get unread count:', error);
      throw error;
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    console.log('📖 [NOTIFICATIONS API] Marking notification as read:', notificationId);
    
    try {
      const response = await apiClient.put<{ success: boolean; message: string }>(
        `/api/v1/notifications/${notificationId}/read`
      );
      
      console.log('✅ [NOTIFICATIONS API] Marked as read:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS API] Failed to mark as read:', error);
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; message: string }> => {
    console.log('📖 [NOTIFICATIONS API] Marking all notifications as read...');
    
    try {
      const response = await apiClient.put<{ success: boolean; message: string }>(
        '/api/v1/notifications/mark-all-read'
      );
      
      console.log('✅ [NOTIFICATIONS API] Marked all as read:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS API] Failed to mark all as read:', error);
      throw error;
    }
  },
};

export default notificationsAPI;
