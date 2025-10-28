/**
 * Messages/Chat API Module
 * Handles all messaging and conversation-related API calls to FastAPI backend
 */

import apiClient from './client';

// Types
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  property_id?: string;
  message_type: 'text' | 'image' | 'file' | 'system';
  read: boolean;
  read_at?: string;
  timestamp: string;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

export interface Conversation {
  id: string;
  property: {
    id: string;
    title: string;
    price: string;
    images: string[];
  };
  partner: {
    id: string;
    name: string;
    avatar_url?: string;
    verified: boolean;
  };
  last_message: string;
  last_message_at: string;
  unread_count: number;
  status: 'active' | 'archived' | 'blocked';
}

export interface ConversationsResponse {
  success: boolean;
  conversations: Conversation[];
}

export interface MessagesResponse {
  success: boolean;
  messages: Message[];
}

export interface MessageResponse {
  success: boolean;
  message: Message;
}

export interface ConversationResponse {
  success: boolean;
  conversation_id: string;
  message?: Message;
}

export interface CreateConversationData {
  property_id: string;
  landlord_id: string;
  initial_message: string;
}

export interface SendMessageData {
  content: string;
}

// Messages API
export const messagesAPI = {
  /**
   * Create a new conversation and send initial message
   */
  createConversation: async (
    data: CreateConversationData
  ): Promise<ConversationResponse> => {
    const response = await apiClient.post<ConversationResponse>(
      '/api/v1/messages/conversations',
      data
    );
    return response.data;
  },

  /**
   * Get all conversations for current user
   */
  getConversations: async (): Promise<ConversationsResponse> => {
    const response = await apiClient.get<ConversationsResponse>(
      '/api/v1/messages/conversations'
    );
    return response.data;
  },

  /**
   * Get messages in a specific conversation
   */
  getMessages: async (conversationId: string): Promise<MessagesResponse> => {
    const response = await apiClient.get<MessagesResponse>(
      `/api/v1/messages/conversation/${conversationId}`
    );
    return response.data;
  },

  /**
   * Send a message in a conversation
   */
  sendMessage: async (
    conversationId: string,
    data: SendMessageData
  ): Promise<MessageResponse> => {
    const response = await apiClient.post<MessageResponse>(
      `/api/v1/messages/conversation/${conversationId}`,
      data
    );
    return response.data;
  },

  /**
   * Mark conversation messages as read
   */
  markAsRead: async (conversationId: string): Promise<void> => {
    // This is handled automatically by getMessages endpoint
    await messagesAPI.getMessages(conversationId);
  },
};

export default messagesAPI;
