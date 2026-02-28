"use client";

import { useState, useEffect } from "react";
import { useNotifications } from "@/contexts/NotificationContext";
import { Bell, Check, CheckCheck, ExternalLink,ArrowLeft, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link"


export default function NotificationsPage() {
  const { state, markAsRead, markAllAsRead, refreshNotifications } = useNotifications();
  const [loading, setLoading] = useState(false);

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      await markAsRead(notificationId);
      toast.success("Notification marked as read");
    } catch (error) {
      toast.error("Failed to mark notification as read");
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
      toast.success("All notifications marked as read");
    } catch (error) {
      toast.error("Failed to mark all notifications as read");
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await refreshNotifications();
      toast.success("Notifications refreshed");
    } catch (error) {
      toast.error("Failed to refresh notifications");
    } finally {
      setLoading(false);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'visit':
        return '🏠';
      case 'message':
        return '💬';
      case 'application':
        return '📄';
      case 'payment':
        return '💳';
      case 'system':
        return '⚙️';
      case 'info':
        return 'ℹ️';
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'visit':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'message':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'application':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'payment':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'system':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'info':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard/tenant">
          <Button variant="ghost" size="sm" className="mb-4 text-slate-600 hover:text-slate-900">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-orange-700 bg-clip-text text-transparent mb-3 flex items-center gap-3">
              <Bell className="w-8 h-8 text-orange-500" />
              Notifications
            </h1>
            <p className="text-slate-600">
              Stay updated with your rental activity
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {state.unreadCount > 0 && (
              <Button
                onClick={handleMarkAllAsRead}
                variant="outline"
                className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <CheckCheck className="w-4 h-4" />
                Mark All Read
              </Button>
            )}
            
            <Button
              onClick={handleRefresh}
              variant="outline"
              disabled={loading}
              className="flex items-center gap-2 border-orange-200 text-orange-700 hover:bg-orange-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Notifications</p>
                <p className="text-2xl font-bold text-slate-900">{state.notifications.length}</p>
              </div>
              <Bell className="w-8 h-8 text-slate-400" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unread</p>
                <p className="text-2xl font-bold text-orange-600">{state.unreadCount}</p>
              </div>
              <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                <span className="text-orange-600 font-bold text-sm">
                  {state.unreadCount > 0 ? '!' : '✓'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Read</p>
                <p className="text-2xl font-bold text-green-600">
                  {state.notifications.length - state.unreadCount}
                </p>
              </div>
              <CheckCheck className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Card className="border-orange-200 bg-white/80 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Notifications</span>
            <span className="text-sm font-normal text-slate-500">
              {state.notifications.length} notifications
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {state.loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600 mb-4"></div>
              <p className="text-slate-600">Loading notifications...</p>
            </div>
          ) : state.error ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-slate-400 mx-auto mb-4" />
              <p className="text-red-600 mb-4">Error loading notifications</p>
              <Button onClick={handleRefresh} variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
                Try Again
              </Button>
            </div>
          ) : state.notifications.length === 0 ? (
            <div className="text-center py-20 max-w-md mx-auto">
              <div className="h-16 w-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Bell className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-2xl font-bold text-slate-900 mb-3">No notifications yet</h3>
              <p className="text-slate-600 mb-8">
                You're all caught up! We'll notify you when there's new activity.
              </p>
              <Button 
                variant="outline" 
                onClick={() => toast.info('Check your dashboard regularly for updates on your property search!')}
                className="border-orange-200 text-orange-700 hover:bg-orange-50"
              >
                <Bell className="mr-2 h-4 w-4" />
                Notification Tips
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {state.notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 rounded-lg border transition-all hover:shadow-md ${
                    !notification.read
                      ? 'bg-orange-50 border-orange-200'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div className={`p-3 rounded-lg border ${getNotificationColor(notification.type)}`}>
                      <span className="text-xl">{getNotificationIcon(notification.type)}</span>
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <h3 className={`font-semibold text-lg ${
                            !notification.read ? 'text-gray-900' : 'text-gray-700'
                          }`}>
                            {notification.title}
                          </h3>
                          <p className="text-gray-600 mt-1 leading-relaxed">
                            {notification.message}
                          </p>
                          <p className="text-sm text-gray-500 mt-2">
                            {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                          </p>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          {!notification.read && (
                            <Button
                              onClick={() => handleMarkAsRead(notification.id)}
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <Check className="w-4 h-4" />
                              Mark Read
                            </Button>
                          )}
                          
                          {notification.link && (
                            <Button
                              asChild
                              variant="outline"
                              size="sm"
                              className="flex items-center gap-1"
                            >
                              <a href={notification.link} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                                View
                              </a>
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
