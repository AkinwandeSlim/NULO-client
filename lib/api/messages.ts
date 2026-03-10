/**
 * lib/api/messages.ts
 *
 * Frontend API client for the NuloAfrica messaging system.
 * Matches the response shapes returned by the rewritten messages.py backend.
 *
 * All methods return plain data (not wrapped in {success, data}) so callers
 * don't have to unwrap -- consistent with the applications.ts client pattern.
 * Errors throw so the caller can catch and show a toast.
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
}

export interface Conversation {
  id: string
  property: ConversationProperty | null
  partner: ConversationPartner
  last_message: string | null
  last_message_at: string | null
  unread_count: number
  status: "active" | "archived"
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
}

export interface ConversationDetail {
  id: string
  tenant_id: string
  landlord_id: string
  property_id: string | null
  status: "active" | "archived"
  last_message: string | null
  last_message_at: string | null
  updated_at: string
  created_at: string
}

export interface MessagesPagination {
  limit: number
  offset: number
  returned: number
}

// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------

export const messagesAPI = {
  /**
   * Get total unread message count for the current user.
   * Used by the notification badge in Navbar and sidebar.
   * Always returns a number -- never throws (non-fatal on backend too).
   */
  getUnreadCount: async (): Promise<number> => {
    try {
      const res = await apiClient.get("/api/v1/messages/unread-count")
      return res.data.unread_count ?? 0
    } catch {
      return 0
    }
  },

  /**
   * Get all conversations for the current user, ordered most-recent-first.
   * Includes property info, partner info, and unread count per conversation.
   */
  getConversations: async (): Promise<Conversation[]> => {
    const res = await apiClient.get("/api/v1/messages/conversations")
    return res.data.conversations ?? []
  },

  /**
   * Look up an existing conversation by property + partner BEFORE creating one.
   *
   * Use this in 'Message about this application' / 'Message this tenant' CTAs:
   *   const existing = await messagesAPI.findConversation(propertyId, partnerId)
   *   if (existing) {
   *     router.push(`/tenant/messages?conversation=${existing.id}`)
   *   } else {
   *     await messagesAPI.createConversation({ property_id, landlord_id, initial_message })
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
   */
  createConversation: async (payload: {
    property_id: string
    landlord_id: string
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
   */
  sendMessage: async (conversation_id: string, content: string): Promise<Message> => {
    const res = await apiClient.post(`/api/v1/messages/conversation/${conversation_id}`, {
      content,
    })
    return res.data.message
  },

  /**
   * Archive a conversation (soft-hide from inbox).
   * Either participant can archive. Archived conversations keep their messages.
   */
  archiveConversation: async (conversation_id: string): Promise<void> => {
    await apiClient.patch(`/api/v1/messages/conversation/${conversation_id}/archive`)
  },
}



