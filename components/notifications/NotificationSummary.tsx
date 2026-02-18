"use client";

import React from 'react';
import Link from 'next/link';
import { Bell, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useNotifications } from '@/contexts/NotificationContext';
import { formatDistanceToNow } from 'date-fns';

export function NotificationSummary() {
  const { state, markAsRead, markAllAsRead } = useNotifications();

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'visit': return '🏠';
      case 'message': return '💬';
      case 'application': return '📄';
      case 'payment': return '💳';
      case 'system': return '⚙️';
      case 'info': return 'ℹ️';
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'error': return '❌';
      default: return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'visit': return 'text-orange-600 bg-orange-50';
      case 'message': return 'text-green-600 bg-green-50';
      case 'application': return 'text-orange-600 bg-orange-50';
      case 'payment': return 'text-orange-600 bg-orange-50';
      case 'system': return 'text-gray-600 bg-gray-50';
      case 'info': return 'text-orange-600 bg-orange-50';
      case 'success': return 'text-green-600 bg-green-50';
      case 'warning': return 'text-orange-600 bg-orange-50';
      case 'error': return 'text-red-600 bg-red-50';
      default: return 'text-orange-600 bg-orange-50';
    }
  };

  const recentNotifications = state.notifications.slice(0, 3);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Bell className="w-5 h-5 text-orange-500" />
          Notifications
          {state.unreadCount > 0 && (
            <span className="bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
              {state.unreadCount}
            </span>
          )}
        </CardTitle>
        <div className="flex gap-2">
          {state.unreadCount > 0 && (
            <Button
              size="sm"
              variant="outline"
              onClick={markAllAsRead}
              className="text-xs"
            >
              Mark All Read
            </Button>
          )}
          <Link href="/tenant/notifications">
            <Button size="sm" variant="outline" className="text-xs">
              View All
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {recentNotifications.length === 0 ? (
          <div className="text-center py-8">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-600 text-sm">No notifications yet</p>
            <p className="text-gray-500 text-xs mt-1">
              You're all caught up!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg border transition-all hover:shadow-sm ${
                  !notification.read
                    ? 'bg-orange-50 border-orange-200'
                    : 'bg-white border-gray-200'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${getNotificationColor(notification.type)}`}>
                    <span className="text-sm">{getNotificationIcon(notification.type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className={`font-medium text-sm ${
                          !notification.read ? 'text-gray-900' : 'text-gray-700'
                        }`}>
                          {notification.title}
                        </p>
                        <p className="text-gray-600 text-xs mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                        <p className="text-gray-500 text-xs mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      {!notification.read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markAsRead(notification.id)}
                          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-100"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
