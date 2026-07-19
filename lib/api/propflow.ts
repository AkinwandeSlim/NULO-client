/**
 * PropFlow API Client
 * Interfaces with the PropFlow AI agent backend endpoints.
 *
 * Endpoints:
 *   POST /api/v1/propflow/chat           – Start or continue conversation
 *   POST /api/v1/propflow/resume/:id     – Resume after interrupt
 *   GET  /api/v1/propflow/status/:id     – Get workflow state
 *   GET  /api/v1/propflow/threads        – List tenant threads
 */

import apiClient from './client'

// ─── Types ───────────────────────────────────────────────────────────────────

export interface PropertyMatch {
  id: string
  title: string
  location: string
  price: number
  beds: number
  baths?: number
  images?: string[]
}

export interface ChatResponse {
  success: boolean
  thread_id: string
  stage: string
  message: string
  property_matches?: PropertyMatch[]
  selected_property_id?: string
  application_id?: string
  agreement_id?: string
  virtual_account_number?: string
  extraction_confidence?: number
  error?: string
}

export interface ResumeResponse {
  success: boolean
  thread_id: string
  stage: string
  message: string
  next_action?: string
  virtual_account_number?: string
  expected_payment_amount?: number
  error?: string
}

export interface WorkflowStatus {
  success: boolean
  thread_id: string
  stage: string
  summary: {
    stage: string
    message: string
    next_action?: string
    extraction_confidence?: number
    extracted_intent?: Record<string, unknown>
    property_matches_count: number
    selected_property_id?: string
    application_id?: string
    application_status?: string
    agreement_id?: string
    virtual_account_number?: string
    expected_payment_amount?: number
    error_log: string[]
  }
}

export type ResumeDecision = 'approved' | 'rejected' | 'signed'

// ─── API Calls ────────────────────────────────────────────────────────────────

/**
 * Send a tenant inquiry to PropFlow.
 * On first call, creates a new thread. On subsequent calls with thread_id,
 * continues the existing conversation.
 */
export async function propflowChat(params: {
  message: string
  thread_id?: string
  property_id?: string
}): Promise<ChatResponse> {
  const { data } = await apiClient.post<ChatResponse>(
    '/api/v1/propflow/chat',
    params,
    { timeout: 60_000 }, // Qwen API can take up to 30s
  )
  return data
}

/**
 * Resume a paused workflow thread.
 * Called by landlords (approved/rejected) or tenants (signed).
 */
export async function propflowResume(
  thread_id: string,
  decision: ResumeDecision,
  reason?: string,
): Promise<ResumeResponse> {
  const { data } = await apiClient.post<ResumeResponse>(
    `/api/v1/propflow/resume/${thread_id}`,
    { decision, reason },
    { timeout: 60_000 },
  )
  return data
}

/**
 * Get current workflow state for a thread.
 */
export async function propflowStatus(thread_id: string): Promise<WorkflowStatus> {
  const { data } = await apiClient.get<WorkflowStatus>(
    `/api/v1/propflow/status/${thread_id}`,
  )
  return data
}

/**
 * List all PropFlow threads linked to the current tenant.
 */
export async function propflowThreads(): Promise<{
  success: boolean
  threads: Array<{
    thread_id: string
    application_status: string
    property_id: string
    started_at: string
  }>
  count: number
}> {
  const { data } = await apiClient.get('/api/v1/propflow/threads')
  return data
}
