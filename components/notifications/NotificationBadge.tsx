"use client";

import React from 'react';
import { useNotifications } from '@/contexts/NotificationContext';

interface NotificationBadgeProps {
  className?: string;
}

export function NotificationBadge({ className = "" }: NotificationBadgeProps) {
  const { state } = useNotifications();

  if (state.unreadCount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-red-500 rounded-full min-w-[20px] h-5 ${className}`}>
      {state.unreadCount > 9 ? '9+' : state.unreadCount}
    </span>
  );
}
