"use client"

import { useState, useEffect, useRef } from "react"
import { Bell, Check, X, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useAuth } from "@/contexts/AuthContext"
import { formatDistanceToNow } from "date-fns"
import type { AppNotification } from "@/types/auth"

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link?: string
  data?: any
  read: boolean
  read_at?: string
  created_at: string
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false)
  const [hasTriedOnce, setHasTriedOnce] = useState(false)
  const { user, notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useAuth()
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Only try once and only if user exists
    if (user && !hasTriedOnce) {
      setHasTriedOnce(true)
      
      const timer = setTimeout(() => {
        fetchNotifications().catch((error) => {
          console.log('🔔 [NOTIFICATION BELL] Notifications not available - disabling further attempts');
          // Don't retry - just silently fail
        });
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [user, hasTriedOnce, fetchNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: AppNotification) => {
    // Mark as read
    await markAsRead(notification.id)
    
    // Navigate if link exists
    if (notification.link) {
      window.location.href = notification.link
    }
    
    setIsOpen(false)
  }

  const handleMarkAllAsRead = async () => {
    await markAllAsRead()
    setIsOpen(false)
  }

  const formatTime = (dateString: string) => {
    try {
      const date = new Date(dateString)
      return formatDistanceToNow(date, { addSuffix: true })
    } catch {
      return 'Just now'
    }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button with Badge */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 hidden sm:flex items-center justify-center"
      >
        <Bell className="h-5 w-5 text-slate-700" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Dropdown */}
      {isOpen && (
        <Card className="absolute right-0 top-12 w-96 bg-white shadow-lg border border-slate-200 z-50">
          <div className="p-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Notifications</h3>
              {unreadCount > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllAsRead}
                  className="text-xs"
                >
                  Mark all as read
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className="h-80">
            {notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No notifications yet</p>
                <p className="text-sm text-slate-500 mt-2">
                  We'll notify you when there are new updates
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex items-start gap-3">
                      {/* Status Icon */}
                      <div className="mt-1">
                        {notification.read ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <div className="h-2 w-2 bg-blue-500 rounded-full" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-slate-900 text-sm truncate">
                            {notification.title}
                          </p>
                          {!notification.read && (
                            <Badge variant="secondary" className="text-xs">
                              New
                            </Badge>
                          )}
                        </div>
                        <p className="text-slate-600 text-sm line-clamp-2">
                          {notification.message}
                        </p>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-xs text-slate-500">
                            {formatTime(notification.created_at)}
                          </span>
                          {notification.link && (
                            <ExternalLink className="h-3 w-3 text-slate-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </Card>
      )}
    </div>
  )
}
