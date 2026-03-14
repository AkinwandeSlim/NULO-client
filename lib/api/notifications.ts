/**
 * Notifications API Module
 * Handles all notification-related API calls to FastAPI backend
 */

import apiClient from './client';
import type { AppNotification } from '@/types/auth';
export interface NotificationResponse {
  success: boolean;
  notifications: AppNotification[];
  unread_count: number;
  total_count: number;
  limit: number;
  offset: number;
}

// Notifications API
export const notificationsAPI = {
  /**
   * Get notifications for current user with better error handling
   */
  getNotifications: async (options: {
    unread_only?: boolean;
    limit?: number;
    offset?: number;
  } = {}): Promise<NotificationResponse> => {
    console.log('🔔 [NOTIFICATIONS API] Fetching notifications...', options);
    
    try {
      const params = new URLSearchParams();
      if (options.unread_only) params.append('unread_only', 'true');
      if (options.limit) params.append('limit', options.limit.toString());
      if (options.offset) params.append('offset', options.offset.toString());
      
      const response = await apiClient.get<NotificationResponse>(
        `/api/v1/notifications/?${params.toString()}`,
        { timeout: 30000 } // 30 seconds - let backend respond fully
      );
      
      console.log('✅ [NOTIFICATIONS API] Fetched notifications:', response.data);
      return response.data;
    } catch (error: any) {
      // Production-ready error handling - minimize console spam
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        if (!isProduction) console.log('🔔 [NOTIFICATIONS API] Unauthorized - token may be expired');
        throw error;
      }
      
      // Handle 500 Server errors gracefully
      if (error.response?.status === 500) {
        if (!isProduction) console.log('🔔 [NOTIFICATIONS API] Server error - using existing notifications');
        return { success: false, notifications: [], unread_count: 0, total_count: 0, limit: 20, offset: 0 };
      }
      
      // Silently handle timeouts
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return { success: false, notifications: [], unread_count: 0, total_count: 0, limit: 20, offset: 0 };
      }
      
      // Silently handle network issues
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error') || !navigator.onLine) {
        return { success: false, notifications: [], unread_count: 0, total_count: 0, limit: 20, offset: 0 };
      }
      
      // For other errors, only log in development
      if (!isProduction) {
        console.log('🔔 [NOTIFICATIONS API] Service unavailable - using existing notifications');
      }
      return { success: false, notifications: [], unread_count: 0, total_count: 0, limit: 20, offset: 0 };
    }
  },

  /**
   * Get unread count for current user
   */
  getUnreadCount: async (): Promise<{ success: boolean; unread_count: number }> => {
    console.log('🔢 [NOTIFICATIONS API] Getting unread count...');
    
    try {
      const response = await apiClient.get<{ success: boolean; unread_count: number }>(
        '/api/v1/notifications/unread-count',
        { timeout: 5000 } // 5 second timeout
      );
      
      console.log('✅ [NOTIFICATIONS API] Unread count:', response.data);
      return response.data;
    } catch (error: any) {
      const isProduction = process.env.NODE_ENV === 'production';
      
      // Handle 401 Unauthorized specifically
      if (error.response?.status === 401) {
        if (!isProduction) console.log('🔔 [NOTIFICATIONS API] Unauthorized for unread count');
        throw error;
      }
      
      // Handle 500 Server errors gracefully
      if (error.response?.status === 500) {
        if (!isProduction) console.log('🔔 [NOTIFICATIONS API] Server error for unread count');
        return { success: false, unread_count: 0 };
      }
      
      // For timeout or network errors, return 0 silently
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        return { success: false, unread_count: 0 };
      }
      
      // For network errors, return 0 silently
      if (error.code === 'ECONNRESET' || error.code === 'ENOTFOUND' || error.message?.includes('Network Error') || !navigator.onLine) {
        return { success: false, unread_count: 0 };
      }
      
      // For other errors, only log in development
      if (!isProduction) {
        console.log('🔔 [NOTIFICATIONS API] Unread count failed - returning 0');
      }
      return { success: false, unread_count: 0 };
    }
  },

  /**
   * Mark a notification as read
   */
  markAsRead: async (notificationId: string): Promise<{ success: boolean; message: string }> => {
    console.log('📖 [NOTIFICATIONS API] Marking notification as read:', notificationId);
    
    try {
      const response = await apiClient.patch<{ success: boolean; message: string }>(
        `/api/v1/notifications/${notificationId}/read`,
        {},
        { timeout: 5000 } // 5 second timeout
      );
      
      console.log('✅ [NOTIFICATIONS API] Marked as read:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS API] Failed to mark as read:', error);
      
      // For timeout or network errors, return success anyway (optimistic UI)
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('🔔 [NOTIFICATIONS API] Mark as read request timed out - returning success');
        return { success: true, message: 'Marked as read (offline)' };
      }
      
      throw error;
    }
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async (): Promise<{ success: boolean; message: string; updated_count?: number }> => {
    console.log('📖 [NOTIFICATIONS API] Marking all notifications as read...');
    
    try {
      const response = await apiClient.patch<{ success: boolean; message: string; updated_count?: number }>(
        '/api/v1/notifications/mark-all-read',
        {},
        { timeout: 30000 } // 30 second timeout
      );
      
      console.log('✅ [NOTIFICATIONS API] Marked all as read:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('❌ [NOTIFICATIONS API] Failed to mark all as read:', error);
      
      // For timeout or network errors, return success anyway (optimistic UI)
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        console.log('🔔 [NOTIFICATIONS API] Mark all as read request timed out - returning success');
        return { success: true, message: 'Marked all as read (offline)', updated_count: 0 };
      }
      
      throw error;
    }
  },
};

export default notificationsAPI;
