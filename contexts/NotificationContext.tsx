"use client";

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { notificationsAPI } from '@/lib/api/notifications';
import { useAuth } from './AuthContext';

// Types - matching actual database schema
export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string; // Backend uses 'visit', 'message', etc.
  read: boolean;
  read_at?: string;
  created_at: string;
  updated_at?: string;
  data?: Record<string, any>;
  link?: string;
  message_id?: string;
  metadata?: Record<string, any>;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
}

type NotificationAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_NOTIFICATIONS'; payload: Notification[] }
  | { type: 'ADD_NOTIFICATION'; payload: Notification }
  | { type: 'MARK_AS_READ'; payload: string }
  | { type: 'REVERT_MARK_AS_READ'; payload: string }
  | { type: 'MARK_ALL_AS_READ' }
  | { type: 'UPDATE_LAST_FETCHED'; payload: string };

// Initial state
const initialState: NotificationState = {
  notifications: [],
  unreadCount: 0,
  loading: false,
  error: null,
  lastFetched: null,
};

// Reducer
function notificationReducer(state: NotificationState, action: NotificationAction): NotificationState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
    
    case 'SET_NOTIFICATIONS':
      const unreadCount = action.payload.filter(n => !n.read).length;
      return {
        ...state,
        notifications: action.payload,
        unreadCount,
        loading: false,
        error: null,
      };
    
    case 'ADD_NOTIFICATION':
      const newNotifications = [action.payload, ...state.notifications];
      const newUnreadCount = newNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: newNotifications,
        unreadCount: newUnreadCount,
      };
    
    case 'MARK_AS_READ':
      const updatedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: true } : n
      );
      const updatedUnreadCount = updatedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: updatedNotifications,
        unreadCount: updatedUnreadCount,
      };
    
    case 'REVERT_MARK_AS_READ':
      const revertedNotifications = state.notifications.map(n =>
        n.id === action.payload ? { ...n, read: false } : n
      );
      const revertedUnreadCount = revertedNotifications.filter(n => !n.read).length;
      return {
        ...state,
        notifications: revertedNotifications,
        unreadCount: revertedUnreadCount,
      };
    
    case 'MARK_ALL_AS_READ':
      const allReadNotifications = state.notifications.map(n => ({ ...n, read: true }));
      return {
        ...state,
        notifications: allReadNotifications,
        unreadCount: 0,
      };
    
    case 'UPDATE_LAST_FETCHED':
      return { ...state, lastFetched: action.payload };
    
    default:
      return state;
  }
}

// Context
interface NotificationContextType {
  state: NotificationState;
  fetchNotifications: () => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Provider
export function NotificationProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(notificationReducer, initialState);
  const { user, userProfile } = useAuth();

  // Fetch notifications from backend
  const fetchNotifications = async () => {
    if (!user || !userProfile) {
      console.log('🔔 [NOTIF] No user or profile, skipping fetch');
      return;
    }

    console.log('🔔 [NOTIF] Fetching notifications for user:', user.id);
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const response = await notificationsAPI.getNotifications();
      
      if (response.success && response.notifications) {
        console.log(`🔔 [NOTIF] Fetched ${response.notifications.length} notifications`);
        
        dispatch({ type: 'SET_NOTIFICATIONS', payload: response.notifications });
        dispatch({ type: 'UPDATE_LAST_FETCHED', payload: new Date().toISOString() });
      } else {
        // Don't clear notifications on API failure - keep existing ones
        console.log('🔔 [NOTIF] API returned success=false, keeping existing notifications');
      }
    } catch (error) {
      console.error('🔔 [NOTIF] Error fetching notifications:', error);
      // Don't clear notifications on network errors - keep existing ones
      console.log('🔔 [NOTIF] Network issue, keeping existing notifications');
    } finally {
      // Always ensure loading is turned off
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    console.log('🔔 [NOTIF] Marking notification as read:', notificationId);
    
    // Optimistic update - update UI immediately
    dispatch({ type: 'MARK_AS_READ', payload: notificationId });
    
    try {
      const response = await notificationsAPI.markAsRead(notificationId);
      
      if (response.success) {
        console.log('🔔 [NOTIF] Successfully marked as read:', notificationId);
      } else {
        // If API fails, revert the optimistic update
        console.log('🔔 [NOTIF] API failed, reverting optimistic update');
        dispatch({ type: 'REVERT_MARK_AS_READ', payload: notificationId });
      }
    } catch (error) {
      console.error('🔔 [NOTIF] Error marking as read:', error);
      // If network fails, revert the optimistic update
      console.log('🔔 [NOTIF] Network error, reverting optimistic update');
      dispatch({ type: 'REVERT_MARK_AS_READ', payload: notificationId });
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    console.log('🔔 [NOTIF] Marking all notifications as read');
    
    // Get current unread count for potential revert
    const currentNotifications = state.notifications;
    
    // Optimistic update - update UI immediately
    dispatch({ type: 'MARK_ALL_AS_READ' });
    
    try {
      const response = await notificationsAPI.markAllAsRead();
      
      if (response.success) {
        console.log('🔔 [NOTIF] Successfully marked all as read');
      } else {
        // If API fails, revert the optimistic update
        console.log('🔔 [NOTIF] API failed, reverting optimistic update');
        dispatch({ type: 'SET_NOTIFICATIONS', payload: currentNotifications });
      }
    } catch (error) {
      console.error('🔔 [NOTIF] Error marking all as read:', error);
      // If network fails, revert the optimistic update
      console.log('🔔 [NOTIF] Network error, reverting optimistic update');
      dispatch({ type: 'SET_NOTIFICATIONS', payload: currentNotifications });
    }
  };

  // Refresh notifications
  const refreshNotifications = async () => {
    console.log('🔔 [NOTIF] Refreshing notifications');
    await fetchNotifications();
  };

  // Auto-fetch notifications when user changes
  useEffect(() => {
    if (user && userProfile) {
      console.log('🔔 [NOTIF] User available, fetching notifications');
      fetchNotifications();
    } else {
      console.log('🔔 [NOTIF] No user or profile, clearing notifications');
      dispatch({ type: 'SET_NOTIFICATIONS', payload: [] });
    }
  }, [user, userProfile]);

  // Poll for new notifications every 60 seconds (reduced from 30s to avoid API overload)
  useEffect(() => {
    if (!user || !userProfile) return;

    const interval = setInterval(() => {
      console.log('🔔 [NOTIF] Polling for new notifications');
      fetchNotifications();
    }, 60000); // 60 seconds instead of 30

    return () => {
      console.log('🔔 [NOTIF] Cleaning up notification polling');
      clearInterval(interval);
    };
  }, [user, userProfile]);

  const value: NotificationContextType = {
    state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    refreshNotifications,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

// Hook
export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

// Debug helper
export function debugNotifications() {
  if (typeof window !== 'undefined') {
    console.log('🔔 [DEBUG] Window notifications available:', 'notifications' in window);
  }
}
