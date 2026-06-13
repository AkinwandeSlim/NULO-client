/**
 * Payments API Module
 * Handles all payment-related API calls to FastAPI backend
 * Uses the same pattern as applications.ts with apiClient
 */

import apiClient from './client';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export type PaymentStatus = "pending" | "held" | "released" | "refunded" | "failed"

export interface Transaction {
  id: string
  tenant_id: string
  landlord_id: string
  property_id: string
  agreement_id: string | null
  application_id: string | null
  amount: number           // NGN
  currency: string
  status: PaymentStatus
  transaction_type: "rent_payment" | "security_deposit" | "guarantee_contribution"
  payment_gateway: string
  paystack_ref: string
  paystack_access_code: string | null
  held_at: string | null
  released_at: string | null
  refunded_at: string | null
  notes: string | null
  created_at: string
  updated_at: string
  // joined
  property?: {
    id: string
    title: string
    city: string | null
    state: string | null
    images: string[] | null
  }
  tenant?: {
    id: string
    full_name: string
    email: string
    phone_number: string | null
    avatar_url?: string | null
  }
}

export interface InitiatePaymentResponse {
  success: boolean
  authorization_url: string
  reference: string
  transaction_id: string
  amount_ngn: number
  error?: string
}

export interface PaymentStatusResponse {
  success: boolean
  payment: Transaction
  error?: string
}

export interface PaymentsListResponse {
  success: boolean
  payments: Transaction[]
  error?: string
}

// 🔐 Webhook Testing Types (QA Admin Only)
export interface WebhookLog {
  timestamp: string
  signature_header_received: string
  signature_valid: boolean
  event_type: string
  paystack_ref: string
  reason: string
}

export interface WebhookLogsResponse {
  success: boolean
  total_attempts: number
  logs: WebhookLog[]
}

export interface WebhookTestResponse {
  success: boolean
  message: string
  details: {
    signature_header_received: string
    expected: string
    match: boolean
    test_type?: 'valid' | 'invalid'
    event_type?: string
    paystack_ref?: string
  }
}

export interface WebhookClearResponse {
  success: boolean
  message: string
}

// ─────────────────────────────────────────────────────────────────────────────
// API methods
// ─────────────────────────────────────────────────────────────────────────────

export const paymentsAPI = {
  /**
   * Initiate a Paystack payment for a signed agreement.
   * Returns authorization_url — redirect the tenant there immediately.
   * Called from /tenant/payments/new
   */
  initiate: async (agreementId: string): Promise<InitiatePaymentResponse> => {
    const response = await apiClient.post<InitiatePaymentResponse>('/api/v1/payments/initiate', {
      agreement_id: agreementId,
    });
    return response.data;
  },

  /**
   * Poll payment status by Paystack reference.
   * Called from /tenant/payments/callback after Paystack redirects back.
   * status === "released" means webhook has confirmed payment.
   * status === "pending"  means webhook hasn't fired yet — poll again.
   * status === "failed"   means payment failed.
   */
  getStatusByReference: async (reference: string): Promise<PaymentStatusResponse> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/api/v1/payments/status?reference=${encodeURIComponent(reference)}`);
    return response.data;
  },

  /**
   * Tenant's full payment history.
   * Called from /tenant/payments
   */
  getMyPayments: async (): Promise<PaymentsListResponse> => {
    const response = await apiClient.get<PaymentsListResponse>('/api/v1/payments/my-payments');
    return response.data;
  },

  /**
   * Landlord's received payments.
   * Called from /landlord/payments
   */
  getReceivedPayments: async (limit: number = 50): Promise<PaymentsListResponse> => {
    const response = await apiClient.get<PaymentsListResponse>(`/api/v1/payments/received?limit=${limit}`, {
      timeout: 60000, // allow a bit more time for dashboard data fetching
    });
    return response.data;
  },

  /**
   * Single transaction detail by ID.
   * Accessible by the tenant or landlord on the transaction.
   */
  getById: async (transactionId: string): Promise<Transaction> => {
    const response = await apiClient.get<PaymentStatusResponse>(`/api/v1/payments/${transactionId}`);
    return response.data.payment;
  },

  /**
   * Dev only: Manually confirm a payment by triggering webhook simulation.
   * Used for localhost testing since Paystack webhooks can't reach localhost.
   * POST /api/v1/payments/confirm-webhook-manually?reference=NULO-...
   */
  confirmWebhookManually: async (reference: string): Promise<{ success: boolean; message?: string; detail?: string }> => {
    const response = await apiClient.post<{ success: boolean; message?: string; detail?: string }>(
      `/api/v1/payments/confirm-webhook-manually?reference=${encodeURIComponent(reference)}`,
      {}
    );
    return response.data;
  },

  /**
   * Confirm payment immediately for live server callback.
   * Used when tenant clicks "Confirm Payment" button on callback page.
   * Works on both dev and live servers (backend checks auth + user ownership).
   * POST /api/v1/payments/confirm-webhook-manually?reference=NULO-...
   */
  confirmPaymentImmediately: async (reference: string): Promise<PaymentStatusResponse> => {
    const response = await apiClient.post<any>(
      `/api/v1/payments/confirm-webhook-manually?reference=${encodeURIComponent(reference)}`,
      {}
    );
    
    // The backend only returns success/message, so we need to re-fetch the transaction
    if (response.data.success) {
      // Fetch updated transaction status
      const statusResponse = await apiClient.get<PaymentStatusResponse>(
        `/api/v1/payments/status?reference=${encodeURIComponent(reference)}`
      );
      return statusResponse.data;
    }
    
    throw new Error(response.data.message || response.data.detail || 'Failed to confirm payment');
  },

  // ───────────────────────────────────────────────────────────────────────────────
  // 🔐 Webhook Testing (QA Admin Only)
  // ───────────────────────────────────────────────────────────────────────────────

  /**
   * Get recent webhook test attempts with HMAC validation results
   * Admin-only endpoint for QA testing
   * 
   * @returns Array of webhook log entries with signature validation details
   */
  getWebhookLogs: async (): Promise<WebhookLog[]> => {
    console.log('📤 [PAYMENTS API] Fetching webhook test logs...');
    
    try {
      const response = await apiClient.get<WebhookLogsResponse>(
        '/api/v1/payments/webhook-logs'
      );
      
      console.log('✅ [PAYMENTS API] Webhook logs retrieved:', {
        total_attempts: response.data.total_attempts,
        logs_count: response.data.logs.length
      });
      
      return response.data.logs;
    } catch (error: any) {
      console.error('❌ [PAYMENTS API] Error fetching webhook logs:', error);
      
      // Provide better error messages
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Failed to fetch webhook logs'
      );
    }
  },

  /**
   * Test webhook signature validation with invalid signature
   * Sends a test webhook that will be rejected and logged
   * Admin-only endpoint for QA testing
   * 
   * @returns Test result with signature comparison details
   */
  testWebhookSignature: async (
    eventType: string = 'charge.success',
    invalidSignature: string = 'FAKE_INVALID_SIGNATURE_FOR_QA_TESTING'
  ): Promise<WebhookTestResponse> => {
    console.log('📤 [PAYMENTS API] Testing webhook with INVALID signature...');
    
    try {
      const response = await apiClient.post<WebhookTestResponse>(
        '/api/v1/payments/test-webhook?test_type=invalid',
        {
          event: eventType,
          signature: invalidSignature,
        }
      );
      
      console.log('✅ [PAYMENTS API] Invalid signature test completed:', {
        success: response.data.success,
        message: response.data.message,
        match: response.data.details?.match
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [PAYMENTS API] Error testing invalid signature:', error);
      
      // Provide better error messages
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Failed to test webhook signature'
      );
    }
  },

  /**
   * Test webhook signature validation with a VALID signature
   * Backend generates the correct HMAC-SHA512 signature and verifies it
   * Admin-only endpoint for QA testing
   * 
   * @returns Test result confirming valid signature acceptance
   */
  testWebhookValidSignature: async (
    eventType: string = 'charge.success'
  ): Promise<WebhookTestResponse> => {
    console.log('📤 [PAYMENTS API] Testing webhook with VALID signature...');
    
    try {
      const response = await apiClient.post<WebhookTestResponse>(
        '/api/v1/payments/test-webhook?test_type=valid',
        {
          event: eventType,
          data: {
            reference: 'NULO-TEST-VALID-' + Date.now(),
            status: 'success',
            amount: 50000,
          }
        }
      );
      
      console.log('✅ [PAYMENTS API] Valid signature test completed:', {
        success: response.data.success,
        message: response.data.message,
        match: response.data.details?.match
      });
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [PAYMENTS API] Error testing valid signature:', error);
      
      // Provide better error messages
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Failed to test webhook signature'
      );
    }
  },

  /**
   * Clear all webhook test logs
   * Removes all logged webhook attempts from memory
   * Admin-only endpoint for QA testing
   * 
   * @returns Confirmation message
   */
  clearWebhookLogs: async (): Promise<WebhookClearResponse> => {
    console.log('📤 [PAYMENTS API] Clearing webhook test logs...');
    
    try {
      const response = await apiClient.delete<WebhookClearResponse>(
        '/api/v1/payments/webhook-logs'
      );
      
      console.log('✅ [PAYMENTS API] Webhook logs cleared');
      
      return response.data;
    } catch (error: any) {
      console.error('❌ [PAYMENTS API] Error clearing webhook logs:', error);
      
      // Provide better error messages
      if (error.response?.status === 401) {
        throw new Error('Unauthorized. Please log in again.');
      }
      if (error.response?.status === 403) {
        throw new Error('Access denied. Admin privileges required.');
      }
      
      throw new Error(
        error.response?.data?.detail || 
        error.response?.data?.message ||
        'Failed to clear webhook logs'
      );
    }
  },
};