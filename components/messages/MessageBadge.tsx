"use client";

import React from 'react';
import { messagesAPI } from '@/lib/api/messages';
import { useState, useEffect } from 'react';

interface MessageBadgeProps {
  className?: string;
}

export function MessageBadge({ className = "" }: MessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const count = await messagesAPI.getUnreadCount();
        setUnreadCount(count);
      } catch (error) {
        console.error('Failed to fetch unread count:', error);
      }
    };

    fetchUnreadCount();
    
    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(interval);
  }, []);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-orange-500 rounded-full min-w-[20px] h-5 animate-pulse ${className}`}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
