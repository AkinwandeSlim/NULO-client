/**
 * PropFlow API Client
 * Interfaces with the PropFlow AI agent backend endpoints.
 *
 * Updated for the 4-interrupt flow:
 *   POST /api/v1/propflow/chat                – Start conversation
 *   POST /api/v1/propflow/select/{id}         – Tenant picks a property
 *   POST /api/v1/propflow/resume/{id}         – Resume after interrupt
 *   GET  /api/v1/propflow/status/{id}         – Get workflow state
 *   POST /api/v1/propflow/simulate-payment/{id} – Simulate payment (demo)
 */

import apiClient from './client'

// ─── Types matching current backend ───────────────────────────────────────────

export interface PropertyMatch {
  id: string
  title: string
  location: string
  price: number
  beds: number
  baths?: number
  images?: string[]
  landlord_id?: string
  property_type?: string
}

export interface ExtractedIntent {
  property_type: string | null
  location: string | null
  bedrooms: number | null
  budget_monthly: number | null
  budget_annual: number | null
  move_in_date: string | null
  payment_frequency: string | null
  special_requests: string | null
  confidence: number
}

// ─── Response types (1:1 with backend) ────────────────────────────────────────

export interface ChatResponse {
  success: boolean
  workflow_id: string
  current_stage: string
  response_message: string
  extracted_intent?: ExtractedIntent | null
  matched_properties?: PropertyMatch[] | null
  application_id?: string | null
  error_message?: string | null
}

export interface SelectResponse {
  success: boolean
  workflow_id: string
  current_stage: string
  response_message: string
  application_id?: string | null
  error_message?: string | null
}

export interface ResumeResponse {
  success: boolean
  workflow_id: string
  current_stage: string
  response_message: string
  agreement_id?: string | null
  virtual_account_number?: string | null
  error_message?: string | null
}

export interface StatusResponse {
  success: boolean
  workflow_id: string
  current_stage: string
  tenant_id: string
  created_at: string
  last_updated: string
  extracted_intent?: ExtractedIntent | null
  selected_property_id?: string | null
  application_id?: string | null
  landlord_briefing?: string | null
  error_log?: string[]
}

export interface SimulatePaymentResponse {
  success: boolean
  message?: string
  agreement_id?: string | null
  virtual_account?: string | null
  amount?: number | null
  error?: string | null
}

export type ResumeDecision = 'approved' | 'rejected' | 'signed' | 'confirm_payment'

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Send a tenant inquiry to PropFlow.
 * On first call, creates a new thread. Expects workflow_id in response.
 */
export async function propflowChat(params: {
  message: string
  use_memory?: boolean
  mock_mode?: boolean
}): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(
    '/api/v1/propflow/chat',
    params,
    { timeout: 60_000 },
  )
  return data
}

/**
 * Guest (unauthenticated) search-only PropFlow conversation.
 * Returns matched properties, but stops before application creation —
 * selecting a property still requires login (auth-gated /select).
 * The client axios sends no auth header when no token exists, so this
 * genuinely works while signed out.
 */
export async function propflowGuestChat(params: {
  message: string
}): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(
    '/api/v1/propflow/chat/guest',
    params,
    { timeout: 60_000 },
  )
  return data
}

/**
 * Tenant selects a property from matched results.
 * Resumes the workflow past INTERRUPT #1.
 */
export async function propflowSelect(
  workflow_id: string,
  property_index: number,
): Promise<SelectResponse> {
  const { data } = await apiClient.post<SelectResponse>(
    `/api/v1/propflow/select/${workflow_id}`,
    { property_index },
    { timeout: 60_000 },
  )
  return data
}

/**
 * Resume a paused workflow thread.
 * Handles: landlord approve/reject, tenant/landlord sign, landlord confirm_payment.
 */
export async function propflowResume(
  workflow_id: string,
  decision: ResumeDecision,
  rejection_reason?: string,
): Promise<ResumeResponse> {
  const { data } = await apiClient.post<ResumeResponse>(
    `/api/v1/propflow/resume/${workflow_id}`,
    { decision, rejection_reason },
    { timeout: 60_000 },
  )
  return data
}

/**
 * Get current workflow state for a thread from MemorySaver.
 */
export async function propflowStatus(workflow_id: string): Promise<StatusResponse> {
  const { data } = await apiClient.get<StatusResponse>(
    `/api/v1/propflow/status/${workflow_id}`,
  )
  return data
}

/**
 * Simulate a tenant payment for demo purposes.
 * Only available after DVA is provisioned and workflow is at payment gate.
 */
export async function propflowSimulatePayment(
  workflow_id: string,
): Promise<SimulatePaymentResponse> {
  const { data } = await apiClient.post<SimulatePaymentResponse>(
    `/api/v1/propflow/simulate-payment/${workflow_id}`,
  )
  return data
}
