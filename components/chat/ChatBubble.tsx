import { cn } from "@/lib/utils"
import { Check, CheckCheck } from "lucide-react"

interface ChatBubbleProps {
  message: string
  timestamp: string
  isOwn: boolean
  senderName?: string
  senderAvatar?: string
  isRead?: boolean
}

export function ChatBubble({ 
  message, 
  timestamp, 
  isOwn, 
  senderName,
  senderAvatar,
  isRead = false 
}: ChatBubbleProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  return (
    <div className={cn(
      "flex gap-3 mb-4",
      isOwn ? "flex-row-reverse" : "flex-row"
    )}>
      {/* Avatar */}
      {!isOwn && (
        <div className="flex-shrink-0">
          {senderAvatar ? (
            <img 
              src={senderAvatar} 
              alt={senderName || 'User'} 
              className="w-8 h-8 rounded-full object-cover"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-sm font-semibold">
              {senderName?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
        </div>
      )}

      {/* Message Content */}
      <div className={cn(
        "flex flex-col max-w-[70%]",
        isOwn ? "items-end" : "items-start"
      )}>
        {/* Sender Name (only for received messages) */}
        {!isOwn && senderName && (
          <span className="text-xs text-slate-500 mb-1 px-1">{senderName}</span>
        )}

        {/* Message Bubble */}
        <div className={cn(
          "rounded-2xl px-4 py-2.5 shadow-sm",
          isOwn 
            ? "bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-br-sm" 
            : "bg-white border border-slate-200 text-slate-900 rounded-bl-sm"
        )}>
          <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
            {message}
          </p>
        </div>

        {/* Timestamp & Read Status */}
        <div className={cn(
          "flex items-center gap-1 mt-1 px-1",
          isOwn ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-xs text-slate-400">
            {formatTime(timestamp)}
          </span>
          {isOwn && (
            <div className="text-slate-400">
              {isRead ? (
                <CheckCheck className="h-3 w-3" />
              ) : (
                <Check className="h-3 w-3" />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
