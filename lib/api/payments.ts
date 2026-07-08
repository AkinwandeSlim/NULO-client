/**
 * Payments API Module -- Nomba-backed
 * ====================================
 * Replaces the Paystack-backed module of the same name.
 * All Paystack endpoints are now 410 Gone on the backend (see
 * `server/app/routes/payments.py` shim). This client only exposes
 * the Nomba virtual-account flow + manual landlord release.
 *
 * Backend endpoints used (all under /api/v1):
 *   - GET    /agreements/tenant/my-agreements   (list tenant agreements w/ VA)
 *   - GET    /agreements/{id}                  (agreement detail + VA + history)
 *   - POST   /nomba/provision-nomba            (create a NUBAN for an agreement)
 *   - GET    /nomba/payment_status              (transfer history for one VA)
 *   - POST   /agreements/{id}/disburse         (release funds to landlord)
 *   - GET    /disbursements/{merchant_tx_ref}  (check payout status)
 *   - GET    /landlord/overview                (landlord dashboard data incl. payments)
 */

import apiClient from './client'

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/**
 * AgreementPaymentRow is the unit displayed on the tenant payments list and
 * the landlord received-payments list. It's a JOIN-shaped view of:
 *   agreements  ⟕  virtual_account_transfers  ⟕  transactions (disbursements)
 */
export interface AgreementPaymentRow {
  agreement_id: string
  property_id: string
  property_title: string
  property_city: string | null
  property_state: string | null
  property_image: string | null
  tenant_id: string
  tenant_name: string
  landlord_id: string
  landlord_name: string
  landlord_bank_account_number: string | null
  landlord_bank_name: string | null
  landlord_account_name: string | null
  landlord_bank_code: string | null
  rent_amount: number
  expected_payment_amount: number
  total_received_amount: number
  payment_frequency: "MONTHLY" | "QUARTERLY" | "SEMI_ANNUAL" | "ANNUAL" | null
  status: "DRAFT" | "SIGNED" | "ACTIVE" | "EXPIRED" | "TERMINATED"
  reconciliation_status: "PENDING" | "FULL_PAYMENT" | "UNDERPAYMENT" | "OVERPAYMENT" | "RECONCILED" | null
  // Virtual account details
  virtual_account_number: string | null
  virtual_account_name: string | null
  nomba_account_ref: string | null
  // Disbursement
  disbursement_status: "pending" | "released" | "failed" | "not_started" | null
  disbursement_merchant_tx_ref: string | null
  disbursement_amount: number | null
  // Timestamps
  lease_start_date: string | null
  lease_end_date: string | null
  created_at: string
  updated_at: string
}

export interface TransferHistoryEntry {
  id: string
  account_ref: string
  account_number: string | null
  amount_received: number
  currency: string
  sender_name: string | null
  sender_bank: string | null
  reconciliation_result: "FULL_PAYMENT" | "UNDERPAYMENT" | "OVERPAYMENT" | null
  transaction_type: string | null
  event_type: string | null
  nomba_request_id: string | null
  nomba_transaction_id: string | null
  created_at: string
}

export interface ProvisionResponse {
  success: boolean
  account_number: string
  account_name: string
  account_ref: string
  error?: string
}

export interface DisburseRequest {
  source_transfer_id: string
  force?: boolean
  retry_count?: number
}

export interface DisburseResponse {
  status: "pending" | "released" | "failed"
  merchant_tx_ref: string
  amount_ngn: number
  nomba_status: string
  transaction_id: string
}

export interface DisbursementStatus {
  merchant_tx_ref: string
  status: string
  amount_ngn: number
  nomba_transfer_id: string | null
  source_transfer_id: string | null
  agreement_id: string
  created_at: string | null
  released_at: string | null
  refunded_at: string | null
}

export interface PaymentsListResponse {
  success: boolean
  payments: AgreementPaymentRow[]
  error?: string
}

export interface AgreementDetailResponse {
  success: boolean
  agreement: AgreementPaymentRow
  transfer_history: TransferHistoryEntry[]
  error?: string
}

// ─────────────────────────────────────────────────────────────────────────────
// Tenant API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * List the signed tenant agreements with their NUBAN + payment state.
 * The backend endpoint is /agreements/tenant/my-agreements (no auth scope on
 * the prefix; tenant identity comes from the Supabase JWT).
 */
// ─────────────────────────────────────────────────────────────────────────────
// Normalizer: agreement row → AgreementPaymentRow
// ─────────────────────────────────────────────────────────────────────────────
//
// The backend `GET /api/v1/agreements/` returns enriched agreement rows whose
// top-level columns come straight from the `agreements` table (id,
// rent_amount, expected_payment_amount, total_received_amount,
// reconciliation_status, nomba_account_ref, virtual_account_number,
// virtual_account_name, payment_frequency, status, lease_start_date,
// lease_end_date, created_at, updated_at — see database/newupdateDB.csv) plus
// nested `tenant`/`landlord`/`property` objects. Property fields (title, city,
// state) are NOT top-level — they live on `row.property`.
//
// The UI historically consumes a JOIN-shaped `AgreementPaymentRow`
// (agreement_id, property_title, tenant_name, etc.), so we normalize here so
// every consumer can keep reading those flattened field names. This is also
// why `key={row.agreement_id}` and `router.push(\`/tenant/payments/${id}\)`
// previously resolved to `undefined` → the rows had no `agreement_id`.

function normalizeAgreementRow(a: any): AgreementPaymentRow {
  const property = a?.property ?? null
  const tenant = a?.tenant ?? null
  const landlord = a?.landlord ?? null
  return {
    agreement_id: a?.id ?? a?.agreement_id ?? '',
    property_id: a?.property_id ?? '',
    property_title: property?.title ?? a?.property_title ?? '',
    property_city: property?.city ?? a?.property_city ?? null,
    property_state: property?.state ?? a?.property_state ?? null,
    property_image: property?.images?.[0] ?? property?.image_url ?? a?.property_image ?? null,
    tenant_id: a?.tenant_id ?? '',
    tenant_name: tenant?.full_name ?? a?.tenant_name ?? '',
    landlord_id: a?.landlord_id ?? '',
    landlord_name: landlord?.full_name ?? a?.landlord_name ?? '',
    landlord_bank_account_number: landlord?.bank_account_number ?? a?.landlord_bank_account_number ?? null,
    landlord_bank_name: landlord?.bank_name ?? a?.landlord_bank_name ?? null,
    landlord_account_name: landlord?.account_name ?? a?.landlord_account_name ?? null,
    landlord_bank_code: landlord?.bank_code ?? a?.landlord_bank_code ?? null,
    rent_amount: Number(a?.rent_amount ?? 0),
    expected_payment_amount: Number(a?.expected_payment_amount ?? 0),
    total_received_amount: Number(a?.total_received_amount ?? 0),
    payment_frequency: (property?.payment_frequency ?? a?.payment_frequency ?? null) as AgreementPaymentRow['payment_frequency'],
    status: (a?.status ?? 'DRAFT') as AgreementPaymentRow['status'],
    reconciliation_status: (a?.reconciliation_status ?? null) as AgreementPaymentRow['reconciliation_status'],
    virtual_account_number: a?.virtual_account_number ?? null,
    virtual_account_name: a?.virtual_account_name ?? null,
    nomba_account_ref: a?.nomba_account_ref ?? null,
    disbursement_status: (a?.disbursement_status ?? null) as AgreementPaymentRow['disbursement_status'],
    disbursement_merchant_tx_ref: a?.disbursement_merchant_tx_ref ?? null,
    disbursement_amount: a?.disbursement_amount ? Number(a.disbursement_amount) : null,
    lease_start_date: a?.lease_start_date ?? null,
    lease_end_date: a?.lease_end_date ?? null,
    created_at: a?.created_at ?? '',
    updated_at: a?.updated_at ?? '',
  }
}

export const paymentsAPI = {
  /**
   * Get the current tenant's payment list (one row per active agreement).
   * Each row carries the NUBAN, expected amount, and disbursement state.
   *
   * Backend: GET /api/v1/agreements/ (JWT-scoped — tenants see their own).
   */
  async getMyPayments(): Promise<PaymentsListResponse> {
    const { data } = await apiClient.get('/api/v1/agreements/', {
      timeout: 15000 // 15 seconds - fail fast for better UX
    })
    const agreements = data.agreements ?? data.payments ?? []
    // Normalize enriched agreement rows into the flattened AgreementPaymentRow
    // shape the UI consumes (agreement_id, property_title, tenant_name, ...).
    // Without this, `row.agreement_id` is undefined → React key warnings and
    // `/tenant/payments/undefined` navigation.
    return { success: true, payments: agreements.map(normalizeAgreementRow) }
  },

  /**
   * Get the landlord's received payments list.
   * Same /api/v1/agreements/ endpoint — landlord scope comes from the JWT,
   * so the backend returns agreements for their properties.
   * Slow endpoint — needs 60s timeout like getMyPayments.
   */
  async getReceived(): Promise<PaymentsListResponse> {
    const { data } = await apiClient.get('/api/v1/agreements/', {
      timeout: 60000 // 60 seconds - slow endpoint
    })
    const agreements = data.agreements ?? data.payments ?? []
    return { success: true, payments: agreements.map(normalizeAgreementRow) }
  },

  /**
   * Alias for getReceived — accepts an optional limit (ignored; the backend
   * returns the full landlord-scoped list) for callers that pass one.
   */
  async getReceivedPayments(_limit?: number): Promise<PaymentsListResponse> {
    return this.getReceived()
  },

  /**
   * Get full detail for a single agreement including NUBAN + transfer history.
   * Backend: GET /api/v1/agreements/{agreement_id}
   */
  async getAgreementDetail(agreementId: string): Promise<AgreementDetailResponse> {
    const { data } = await apiClient.get(`/api/v1/agreements/${agreementId}`)
    const rawAgreement = data.agreement ?? data
    return {
      success: true,
      // Normalize so the detail page can read flattened fields
      // (property_title, property_city, landlord_name, agreement_id, ...)
      // instead of the nested property/landlord objects the router returns.
      agreement: normalizeAgreementRow(rawAgreement),
      transfer_history: data.transfer_history ?? [],
    }
  },

  /**
   * Provision a NUBAN for an agreement if one does not already exist.
   * Idempotent on the backend -- safe to retry.
   * Backend: POST /api/v1/agreements/{agreement_id}/provision-nomba
   */
  async provisionNomba(agreementId: string): Promise<ProvisionResponse> {
    const { data } = await apiClient.post(
      `/api/v1/agreements/${agreementId}/provision-nomba`,
    )
    return data
  },

  /**
   * Pull the live transfer history for an agreement's NUBAN from Nomba.
   * Used to render the "Recent payments" table on the agreement detail page.
   *
   * Backend: GET /api/v1/agreements/{agreement_id}/payment-status
   * The backend looks up the (suffixed) account_ref server-side from the
   * agreement row, so callers should pass the AGREEMENT ID, not the raw
   * account_ref. (Legacy callers that pass a "{uuid}-SUB" ref still work
   * because the backend regex-strips the UUID — but prefer the agreement id.)
   */
  async getTransferHistory(agreementIdOrRef: string): Promise<TransferHistoryEntry[]> {
    const { data } = await apiClient.get(
      `/api/v1/agreements/${agreementIdOrRef}/payment-status`,
    )
    return data.transfer_history ?? data.history ?? data.data ?? []
  },

  /**
   * Trigger a landlord payout for a specific inbound transfer.
   * Backend auto-routes to the sub-account wallet when the agreement VA
   * has the -SUB suffix (so live fund availability is preserved).
   *
   * Backend: POST /api/v1/agreements/{agreement_id}/disburse
   * Body: { source_transfer_id, force?, retry_count? }
   *
   * NOTE: This call can take up to 60s — it does a bank re-verify + Nomba
   * transfer call, both of which are synchronous HTTP calls on the backend.
   * We use a 90s timeout to avoid a false "Network Error" from Axios cutting
   * the connection before the server responds.
   */
  async releaseFunds(
    agreementId: string,
    req: DisburseRequest,
  ): Promise<DisburseResponse> {
    const { data } = await apiClient.post(
      `/api/v1/agreements/${agreementId}/disburse`,
      req,
      { timeout: 90000 }, // 90s — bank re-verify + Nomba transfer can be slow
    )
    return data
  },

  /**
   * Poll the status of a previously initiated payout.
   * Backend: GET /api/v1/disbursements/{merchant_tx_ref}
   */
  async getDisbursementStatus(merchantTxRef: string): Promise<DisbursementStatus> {
    const { data } = await apiClient.get(`/api/v1/disbursements/${merchantTxRef}`)
    return data
  },

  /**
   * DEMO ONLY: Simulate a payout_success webhook for testing.
   * This allows testing the complete disbursement flow without waiting
   * for the actual Nomba webhook.
   * Backend: POST /api/v1/agreements/{agreement_id}/simulate-payout-webhook
   */
  async simulatePayoutWebhook(
    agreementId: string,
    merchantTxRef: string,
  ): Promise<{ success: boolean; message: string; transaction_id: string; status: string }> {
    const { data } = await apiClient.post(
      `/api/v1/agreements/${agreementId}/simulate-payout-webhook`,
      { merchant_tx_ref: merchantTxRef },
    )
    return data
  },
}

export default paymentsAPI
