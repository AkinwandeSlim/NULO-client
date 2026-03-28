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
  getReceivedPayments: async (): Promise<PaymentsListResponse> => {
    const response = await apiClient.get<PaymentsListResponse>('/api/v1/payments/received');
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
};