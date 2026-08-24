"use client";

import React from 'react';
import { messagesAPI } from '@/lib/api/messages';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface MessageBadgeProps {
  className?: string;
}

export function MessageBadge({ className = "" }: MessageBadgeProps) {
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Don't fire until auth is ready — otherwise the token may not be loaded
    // yet and the request 401s (which the client then treats as a session error).
    if (authLoading || !user) return;

    const fetchUnreadCount = async () => {
      // Never throws — failures (expired session being refreshed/redirected by
      // the apiClient interceptor, backend down, offline) resolve to 0, so the
      // badge hides quietly instead of logging an error on every 30s poll.
      setUnreadCount(await messagesAPI.getUnreadCount());
    };

    fetchUnreadCount();

    // Poll for new messages every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => clearInterval(interval);
  }, [authLoading, user]);

  if (unreadCount === 0) {
    return null;
  }

  return (
    <span className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold text-white bg-orange-500 rounded-full min-w-[20px] h-5 animate-pulse ${className}`}>
      {unreadCount > 9 ? '9+' : unreadCount}
    </span>
  );
}
