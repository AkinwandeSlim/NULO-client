/**
 * Agreements API Client
 * Aligned to server/app/routes/agreements.py (fixed version)
 *
 * Backend routes:
 *   POST  /api/v1/agreements/                        create()
 *   GET   /api/v1/agreements/                        getMyAgreements()
 *   GET   /api/v1/agreements/property/{id}           getByProperty()
 *   GET   /api/v1/agreements/application/{id}        getByApplication()
 *   GET   /api/v1/agreements/{id}                    getById()
 *   PATCH /api/v1/agreements/{id}/sign               sign()
 *   POST  /api/v1/agreements/{id}/generate-pdf       generatePdf()
 *   POST  /api/v1/agreements/{id}/receipt            generateReceipt()
 *
 * Changes from original:
 *   - Removed update() — no PATCH /{id} endpoint exists in the backend
 *   - Removed delete() — no DELETE endpoint exists in the backend
 *   - Added getByApplication() — missing; the flow bridge from application_id to agreement
 *   - Added getByProperty() — was missing, maps to GET /property/{id}
 *   - Added generatePdf() — was missing, maps to POST /{id}/generate-pdf
 *   - Added generateReceipt() — was missing, maps to POST /{id}/receipt
 *   - Added status_filter param to getMyAgreements()
 *   - Added landlord field to AgreementWithDetails (backend returns all three)
 *   - Added count to response interfaces
 */

import apiClient from './client';

// ─────────────────────────────────────────────────────────────────────────────
// DB-aligned types
// ─────────────────────────────────────────────────────────────────────────────

export interface Agreement {
  id: string
  application_id: string
  property_id: string
  tenant_id: string
  landlord_id: string
  /**
   * Valid status values from agreements_status_check constraint.
   * Check DB for exact allowed values — commonly DRAFT, PENDING_TENANT,
   * PENDING_LANDLORD, SIGNED, ACTIVE, EXPIRED, TERMINATED.
   */
  status: 'DRAFT' | 'PENDING_TENANT' | 'PENDING_LANDLORD' | 'SIGNED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
  terms: string
  rent_amount: number
  deposit_amount: number
  platform_fee: number
  service_charge: number | null
  lease_start_date: string   // YYYY-MM-DD
  lease_end_date: string     // YYYY-MM-DD
  lease_duration: number     // months
  /** Payment frequency used for pricing (MONTHLY/QUARTERLY/SEMI_ANNUAL/ANNUAL). */
  payment_frequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | null
  tenant_signature_ip?: string | null
  landlord_signature_ip?: string | null
  tenant_signed_at?: string | null
  landlord_signed_at?: string | null
  document_url?: string | null
  created_at: string
  updated_at: string
  // Nomba payment fields
  virtual_account_number?: string | null
  virtual_account_name?: string | null
  expected_payment_amount?: number | null
  total_received_amount?: number | null
  reconciliation_status?: 'FULL_PAYMENT' | 'UNDERPAYMENT' | 'OVERPAYMENT' | 'NO_PAYMENT' | null
  disbursement_status?: 'pending' | 'released' | 'failed' | null
  disbursement_amount?: number | null
  disbursement_merchant_tx_ref?: string | null
  /** PropFlow workflow thread id — present when the agreement was created via PropFlow. */
  propflow_thread_id?: string | null
}

/** Agreement enriched with participant and property data — returned by all read endpoints */
export interface AgreementWithDetails extends Agreement {
  tenant?: {
    id: string
    full_name: string | null
    email: string
    phone_number: string | null
    avatar_url: string | null
  } | null
  landlord?: {
    id: string
    full_name: string | null
    email: string
    phone_number: string | null
    avatar_url: string | null
  } | null
  property?: {
    id: string
    title: string
    location: string | null
    city: string | null
    state: string | null
    address: string | null
    full_address: string | null
    price: number
    images: string[] | null
  } | null
  // Generation source tracking:
  //  - "groq_llama"            legacy AI-generated terms (pre-fix agreements)
  //  - "manual_template"       legacy manual template
  //  - "deterministic_template" current deterministic legal template (no LLM)
  agreement_source?: "groq_llama" | "manual_template" | "deterministic_template"
  generation_metadata?: {
    compliance_score?: number
    model_used?: string
    tokens_used?: number
    cost_usd?: number
    generated_at?: string
    template_version?: string
    security_deposit_amount?: number
    security_deposit_percent?: number | null
    regenerated_at?: string
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Request models
// ─────────────────────────────────────────────────────────────────────────────

export interface AgreementCreateData {
  application_id: string
  lease_start_date: string   // YYYY-MM-DD
  lease_end_date: string     // YYYY-MM-DD
  lease_duration: number     // months
}

export interface AgreementSignData {
  /** Client IP address — used for signature audit trail */
  ip_address?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Response shapes (aligned to backend return values)
// ─────────────────────────────────────────────────────────────────────────────

export interface AgreementResponse {
  success: boolean
  agreement?: AgreementWithDetails
  message?: string
  error?: string
}

export interface AgreementsListResponse {
  success: boolean
  agreements?: AgreementWithDetails[]
  count?: number
  /** Present on getByProperty() responses */
  property?: { id: string; title: string } | null
  error?: string
}

export interface PdfResponse {
  success: boolean
  document_url?: string
  message?: string
  error?: string
}

export interface TenantBriefResponse {
  success: boolean
  /** Plain-English AI summary of the agreement's key clauses (Qwen-powered). */
  brief?: string
  /** True when the brief was served from the server-side cache. */
  cached?: boolean
  agreement_id?: string
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// API client
// ─────────────────────────────────────────────────────────────────────────────

export const agreementsAPI = {

  /**
   * Create a new rental agreement from an approved application.
   * Tenants only.
   * POST /api/v1/agreements/
   */
  create: async (data: AgreementCreateData): Promise<AgreementResponse> => {
    const response = await apiClient.post<AgreementResponse>('/api/v1/agreements/', data);
    return response.data;
  },

  /**
   * Get all agreements for the current user.
   * Tenants see their own; landlords see all for their properties.
   * GET /api/v1/agreements/?status_filter=SIGNED
   */
  getMyAgreements: async (statusFilter?: string): Promise<AgreementsListResponse> => {
    const params = statusFilter ? { status_filter: statusFilter } : undefined;
    const response = await apiClient.get<AgreementsListResponse>('/api/v1/agreements/', {
      params,
      timeout: 60000 // 60 seconds - slow endpoint
    });
    return response.data;
  },

  /**
   * Get all agreements for a specific property.
   * Landlord only — verifies ownership server-side.
   * GET /api/v1/agreements/property/{propertyId}
   */
  getByProperty: async (propertyId: string, statusFilter?: string): Promise<AgreementsListResponse> => {
    const params = statusFilter ? { status_filter: statusFilter } : undefined;
    const response = await apiClient.get<AgreementsListResponse>(
      `/api/v1/agreements/property/${propertyId}`,
      { params }
    );
    return response.data;
  },

  /**
   * Get the agreement linked to a specific application.
   * This is the key bridge in the rental flow:
   *   application approved → agreement auto-generated → show on application detail page
   * Both tenant and landlord can call this using the application_id they already have.
   * GET /api/v1/agreements/application/{applicationId}
   */
  getByApplication: async (applicationId: string): Promise<AgreementResponse> => {
    const response = await apiClient.get<AgreementResponse>(
      `/api/v1/agreements/application/${applicationId}`
    );
    return response.data;
  },

  /**
   * Get a specific agreement by ID.
   * Accessible by the tenant or landlord who are party to the agreement.
   * Returns full enrichment: tenant, landlord, and property details.
   * GET /api/v1/agreements/{id}
   */
  getById: async (agreementId: string): Promise<AgreementResponse> => {
    const response = await apiClient.get<AgreementResponse>(`/api/v1/agreements/${agreementId}`);
    return response.data;
  },

  /**
   * Sign the agreement as the current user (tenant or landlord).
   * Records signature timestamp + IP for audit trail.
   * When both parties sign, status transitions to SIGNED.
   * PATCH /api/v1/agreements/{id}/sign
   */
  sign: async (agreementId: string, data: AgreementSignData = {}): Promise<AgreementResponse> => {
    const response = await apiClient.patch<AgreementResponse>(
      `/api/v1/agreements/${agreementId}/sign`,
      data,
      { timeout: 60000 } // Signing involves DB writes + enrichment; allow 60s headroom
    );
    return response.data;
  },

  /**
   * Generate a PDF of a fully signed agreement.
   * Requires status === 'SIGNED'. Returns a document_url.
   * POST /api/v1/agreements/{id}/generate-pdf
   */
  generatePdf: async (agreementId: string): Promise<PdfResponse> => {
    const response = await apiClient.post<PdfResponse>(
      `/api/v1/agreements/${agreementId}/generate-pdf`,
      {}
    );
    return response.data;
  },

  /**
   * Generate a payment receipt PDF for a completed payment.
   * Requires reconciliation_status === 'FULL_PAYMENT'. Returns a document_url.
   * POST /api/v1/agreements/{id}/receipt
   */
  generateReceipt: async (agreementId: string): Promise<PdfResponse> => {
    const response = await apiClient.post<PdfResponse>(
      `/api/v1/agreements/${agreementId}/receipt`,
      {}
    );
    return response.data;
  },

  /**
   * Get the plain-English AI brief of the agreement for the tenant.
   * Qwen-powered clause summary shown BEFORE signing so the tenant
   * understands what they are agreeing to. Tenant-only; cached server-side.
   * GET /api/v1/agreements/{id}/tenant-brief
   */
  getTenantBrief: async (agreementId: string): Promise<TenantBriefResponse> => {
    const response = await apiClient.get<TenantBriefResponse>(
      `/api/v1/agreements/${agreementId}/tenant-brief`,
      { timeout: 90000 } // LLM generation can be slow on first call
    );
    return response.data;
  },

  /**
   * Regenerate the agreement terms using the CURRENT pricing model
   * (property payment_frequency, waived deposit/fees).
   * Only allowed while NEITHER party has signed.
   * POST /api/v1/agreements/{id}/regenerate
   */
  regenerate: async (agreementId: string): Promise<AgreementResponse> => {
    const response = await apiClient.post<AgreementResponse>(
      `/api/v1/agreements/${agreementId}/regenerate`,
      {},
      { timeout: 120000 } // AI regeneration can be slow
    );
    return response.data;
  },

};

export default agreementsAPI;
























// /**
//  * Agreements API Client
//  * Interfaces with the agreements backend endpoints
//  * Updated to use apiClient like other API modules
//  */

// import apiClient from './client';

// export interface Agreement {
//   id: string
//   application_id: string
//   property_id: string
//   tenant_id: string
//   landlord_id: string
//   status: 'DRAFT' | 'PENDING_TENANT' | 'PENDING_LANDLORD' | 'SIGNED' | 'ACTIVE' | 'EXPIRED' | 'TERMINATED'
//   terms: string
//   rent_amount: number
//   deposit_amount: number
//   platform_fee: number
//   service_charge: number
//   lease_start_date: string
//   lease_end_date: string
//   lease_duration: number
//   tenant_signature_ip?: string
//   landlord_signature_ip?: string
//   tenant_signed_at?: string
//   landlord_signed_at?: string
//   document_url?: string
//   created_at: string
//   updated_at: string
// }

// export interface AgreementWithDetails extends Agreement {
//   property?: any
//   tenant?: any
// }

// export interface AgreementCreateData {
//   application_id: string
//   lease_start_date: string // YYYY-MM-DD format
//   lease_end_date: string   // YYYY-MM-DD format
//   lease_duration: number   // in months
// }

// export interface AgreementSignData {
//   ip_address?: string
// }

// export interface AgreementUpdateData {
//   status?: string
// }

// export interface AgreementsResponse {
//   success: boolean
//   agreements?: Agreement[]
//   agreement?: Agreement
//   error?: string
//   message?: string
// }

// // Agreements API
// export const agreementsAPI = {
//   /**
//    * Create a new rental agreement from an approved application
//    * POST /api/v1/agreements/
//    */
//   create: async (data: AgreementCreateData): Promise<AgreementsResponse> => {
//     const response = await apiClient.post<AgreementsResponse>('/api/v1/agreements/', data);
//     return response.data;
//   },

//   /**
//    * Get a specific agreement by ID
//    * GET /api/v1/agreements/{id}
//    */
//   getById: async (agreementId: string): Promise<AgreementsResponse> => {
//     const response = await apiClient.get<AgreementsResponse>(`/api/v1/agreements/${agreementId}`);
//     return response.data;
//   },

//   /**
//    * Get all agreements for the current user
//    * GET /api/v1/agreements/
//    */
//   getMyAgreements: async (): Promise<AgreementsResponse> => {
//     const response = await apiClient.get<AgreementsResponse>('/api/v1/agreements/');
//     return response.data;
//   },

//   /**
//    * Update agreement status or other fields
//    * PATCH /api/v1/agreements/{id}
//    */
//   update: async (
//     agreementId: string, 
//     data: AgreementUpdateData, 
//     endpoint?: string
//   ): Promise<AgreementsResponse> => {
//     const url = endpoint ? `/api/v1/agreements/${agreementId}${endpoint}` : `/api/v1/agreements/${agreementId}`;
//     const response = await apiClient.patch<AgreementsResponse>(url, data);
//     return response.data;
//   },

//   /**
//    * Sign agreement (with IP tracking)
//    * PATCH /api/v1/agreements/{id}/sign
//    */
//   sign: async (agreementId: string, data: AgreementSignData): Promise<AgreementsResponse> => {
//     const response = await apiClient.patch<AgreementsResponse>(`/api/v1/agreements/${agreementId}/sign`, data);
//     return response.data;
//   },

//   /**
//    * Delete/cancel an agreement
//    * DELETE /api/v1/agreements/{id}
//    */
//   delete: async (agreementId: string): Promise<AgreementsResponse> => {
//     const response = await apiClient.delete<AgreementsResponse>(`/api/v1/agreements/${agreementId}`);
//     return response.data;
//   },
// };

// export default agreementsAPI;
