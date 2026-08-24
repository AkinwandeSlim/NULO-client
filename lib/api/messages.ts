/**
 * lib/api/messages.ts
 *
 * Frontend API client for the NuloAfrica messaging system.
 * Matches the response shapes returned by the rewritten messages.py backend.
 *
 * All methods return plain data (not wrapped in {success, data}) so callers
 * don't have to unwrap -- consistent with the applications.ts client pattern.
 * Errors throw so the caller can catch and show a toast.
 *
 * 2026-03-12 type fixes applied (must match messages.py + 0001 migration):
 *   - ConversationPartner.phone renamed to phone_number (matches users.phone_number)
 *   - ConversationPartner.email removed (backend never returns it)
 *   - Conversation: added last_message_sender_id, archived_by_landlord, archived_by_tenant
 *   - ConversationDetail: added last_message_sender_id, archived_by_landlord, archived_by_tenant
 *   - MessagesPagination: added total (FIX-8 -- correct "load more" detection)
 */

import apiClient from "./client"

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ConversationProperty {
  id: string
  title: string
  price: number
  images: string[]
  location: string
}

export interface ConversationPartner {
  id: string
  name: string
  avatar_url: string | null
  verified: boolean
  user_type: "tenant" | "landlord" | "admin" | null
  trust_score: number | null
  /** Renamed from `phone` -- matches users.phone_number column and backend response key */
  phone_number: string | null
  /**
   * email is NOT returned by GET /conversations or GET /conversation/{id}.
   * If you need the partner's email, fetch it separately from the users endpoint.
   */
}

export interface Conversation {
  id: string
  property: ConversationProperty | null
  partner: ConversationPartner
  last_message: string | null
  /**
   * UUID of the user who sent the last message.
   * Use to show "You: ..." vs "Amaka: ..." in the conversation list preview.
   * NULL until migration 0001_messages_improvements.sql has run AND a new
   * message has been sent after the backend was deployed.
   */
  last_message_sender_id: string | null
  last_message_at: string | null
  unread_count: number
  status: "active" | "archived"
  /**
   * Per-user archive flags (added by migration 0001).
   * Use these instead of status === "archived" so each party controls their
   * own inbox independently.
   *
   * Landlord inbox filter:  archived_by_landlord === false
   * Tenant inbox filter:    archived_by_tenant === false
   */
  archived_by_landlord: boolean
  archived_by_tenant: boolean
}

export interface MessageSender {
  id: string
  full_name: string | null
  first_name: string | null
  avatar_url: string | null
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  recipient_id: string
  content: string
  property_id: string | null
  message_type: "text" | "image" | "system"
  read: boolean
  read_at: string | null
  timestamp: string
  sender: MessageSender | null
  /** Soft-delete timestamp -- NULL means the message is visible */
  deleted_at: string | null
}

export interface ConversationDetail {
  id: string
  tenant_id: string
  landlord_id: string
  property_id: string | null
  status: "active" | "archived"
  last_message: string | null
  /** See Conversation.last_message_sender_id */
  last_message_sender_id: string | null
  last_message_at: string | null
  updated_at: string
  created_at: string
  /** See Conversation.archived_by_landlord */
  archived_by_landlord: boolean
  /** See Conversation.archived_by_tenant */
  archived_by_tenant: boolean
}

export interface MessagesPagination {
  limit: number
  offset: number
  returned: number
  /**
   * Total number of messages in this conversation (all pages).
   * Use for correct "load more" detection:
   *
   *   const hasMore = offset + returned < total
   *
   * DO NOT use returned === limit -- that breaks when the message count
   * is an exact multiple of the page size (FIX-8).
   */
  total: number
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const messagesAPI = {
  /**
   * Get total unread message count for the current user.
   * Used by the notification badge in Navbar and sidebar.
   * Always returns a number -- never throws. Session expiry is owned globally
   * by the apiClient response interceptor (single-flight token refresh, then
   * redirect to /signin if the session is truly dead), so this endpoint stays
   * non-fatal: on any failure (401 while the interceptor refreshes/redirects,
   * backend 500, timeout, offline) the badge just shows nothing instead of
   * spamming AxiosError stacks in the console every 30-second poll.
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await apiClient.get("/api/v1/messages/unread-count", { timeout: 5000 })
      return res.data.unread_count ?? 0
    } catch {
      // Non-fatal by design — see doc comment above.
      return 0
    }
  },

  /**
   * Get all conversations for the current user, ordered most-recent-first.
   * Includes property info, partner info, unread count, and per-user archive
   * flags per conversation.
   */
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get("/api/v1/messages/conversations")
    return res.data.conversations ?? []
  },

  /**
   * Fast version for real-time polling - adaptive timeout for Nigeria connectivity
   * Uses shorter timeout for polling but falls back gracefully
   */
  getConversationsFast: async (): Promise<Conversation[]> => {
    try {
      // First try with short timeout (10s) for responsive UX
      const res = await apiClient.get("/api/v1/messages/conversations", { timeout: 10000 })
      return res.data.conversations ?? []
    } catch (error: any) {
      // If it's a timeout, try once more with longer timeout for poor connectivity
      if (error.code === 'ECONNABORTED' || error.message?.includes('timeout')) {
        try {
          const res = await apiClient.get("/api/v1/messages/conversations", { timeout: 25000 })
          return res.data.conversations ?? []
        } catch (retryError: any) {
          try {
            // Final fallback to standard method for dashboard reliability
            const res = await apiClient.get("/api/v1/messages/conversations")
            return res.data.conversations ?? []
          } catch (finalError: any) {
            return [] // Graceful fallback
          }
        }
      }
      // For other errors, try standard method once
      try {
        const res = await apiClient.get("/api/v1/messages/conversations")
        return res.data.conversations ?? []
      } catch (standardError: any) {
        return []
      }
    }
  },

  /**
   * Ultra-fast version for critical dashboard updates - 5 second timeout
   * Used when user just needs to know if there are new messages
   */
  getConversationsUltraFast: async (): Promise<Conversation[]> => {
    try {
      const res = await apiClient.get("/api/v1/messages/conversations", { timeout: 5000 })
      return res.data.conversations ?? []
    } catch (error) {
      // Silent fail for ultra-fast attempts
      return []
    }
  },

  /**
   * Look up an existing conversation by property + partner BEFORE creating one.
   *
   * Use this in 'Message about this application' / 'Message this tenant' CTAs:
   *
   *   const existing = await messagesAPI.findConversation(propertyId, partnerId)
   *   if (existing) {
   *     router.push(`/tenant/messages?conversation=${existing.id}`)
   *   } else {
   *     await messagesAPI.createConversation({ ... })
   *   }
   *
   * Returns the conversation object if found, null if not found.
   */
  findConversation: async (
    property_id: string,
    partner_id: string
  ): Promise<{ id: string; status: string; last_message_at: string | null } | null> => {
    const res = await apiClient.get(
      `/api/v1/messages/conversations/find?property_id=${property_id}&partner_id=${partner_id}`
    )
    return res.data.conversation ?? null
  },

  /**
   * Start a new conversation (or re-open an existing one) for a property
   * and send the opening message.
   *
   * Idempotent: calling twice for the same (tenant, landlord, property) triplet
   * returns the same conversation_id rather than creating a duplicate.
   *
   * Tenant callers:   omit tenant_id
   * Landlord callers: include tenant_id
   */
  createConversation: async (payload: {
    property_id: string
    landlord_id: string
    tenant_id?: string
    initial_message: string
  }): Promise<{ conversation_id: string; message: Message | null }> => {
    const res = await apiClient.post("/api/v1/messages/conversations", payload)
    return res.data
  },

  /**
   * Fetch messages in a conversation with pagination.
   * Messages are ordered oldest-first (chronological for chat display).
   * All messages sent to the current user are automatically marked as read.
   *
   * Use pagination.total for "load more" detection:
   *   const hasMore = offset + pagination.returned < pagination.total
   *
   * @param conversation_id  UUID of the conversation
   * @param limit            Max messages to return (default 50, max 200)
   * @param offset           Pagination offset (default 0)
   */
  getMessages: async (
    conversation_id: string,
    limit = 50,
    offset = 0
  ): Promise<{
    conversation: ConversationDetail
    messages: Message[]
    pagination: MessagesPagination
  }> => {
    const res = await apiClient.get(
      `/api/v1/messages/conversation/${conversation_id}?limit=${limit}&offset=${offset}`
    )
    return {
      conversation: res.data.conversation,
      messages: res.data.messages ?? [],
      pagination: res.data.pagination,
    }
  },

  /**
   * Send a message in an existing conversation.
   * The backend fires a new_message notification to the recipient.
   * Returns the created Message object for optimistic UI updates.
   */
  sendMessage: async (conversation_id: string, content: string): Promise<Message> => {
    const res = await apiClient.post(
      `/api/v1/messages/conversation/${conversation_id}`,
      { content }
    )
    return res.data.message
  },

  /**
   * Archive a conversation (soft-hide from inbox).
   * Either participant can archive. Archived conversations keep their messages.
   *
   * NOTE: Currently writes the shared `status` column.
   * After the per-user archive backend update (Step 3), this will set
   * archived_by_landlord or archived_by_tenant depending on the caller.
   */
  archiveConversation: async (conversation_id: string): Promise<void> => {
    await apiClient.patch(`/api/v1/messages/conversation/${conversation_id}/archive`)
  },

  /**
   * Unarchive a conversation (restore to active inbox).
   * Either participant can unarchive.
   */
  unarchiveConversation: async (conversation_id: string): Promise<void> => {
    await apiClient.patch(`/api/v1/messages/conversation/${conversation_id}/unarchive`)
  },

  /**
   * Delete a conversation permanently.
   * Either participant can delete. Cascades to all messages via FK constraint.
   */
  deleteConversation: async (conversation_id: string): Promise<void> => {
    await apiClient.delete(`/api/v1/messages/conversation/${conversation_id}`)
  },
}