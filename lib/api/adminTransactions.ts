/**
 * Admin Transaction Monitoring API
 * Allows admins to monitor Nomba transactions for reconciliation and debugging
 */

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'

export interface Transaction {
  id: string
  amount: number
  status: string
  type: string
  transactionRef?: string
  createdAt: string
  description?: string
  [key: string]: any
}

export interface TransactionResponse {
  success: boolean
  data: {
    content: Transaction[]
    pageable?: {
      pageNumber: number
      pageSize: number
      totalPages: number
      totalElements: number
    }
  }
  message?: string
  error?: string
}

export interface SubAccountDetails {
  accountId: string
  accountHolderId: string
  accountRef: string
  status: string
  type: string
  accountName: string
  currency: string
  banks?: Array<{
    bankAccountNumber: string
    bankName: string
    bankAccountName: string
  }>
  createdAt?: string
}

export interface SubAccountBalance {
  amount: string
  currency: string
  timeCreated: string
}

export interface SubAccountResponse {
  success: boolean
  data: SubAccountDetails | SubAccountBalance
  message?: string
  error?: string
}

export interface AdminTransactionsAPI {
  getAccountTransactions: (params?: {
    dateFrom?: string
    dateTo?: string
    limit?: number
    page?: number
  }) => Promise<TransactionResponse>
  
  getVirtualAccountTransactions: (virtualAccount: string, params?: {
    dateFrom?: string
    dateTo?: string
    limit?: number
    page?: number
  }) => Promise<TransactionResponse>
  
  getBankTransactions: (params?: {
    limit?: number
    page?: number
  }) => Promise<TransactionResponse>
  
  getSubAccountDetails: (params?: {
    subAccountId?: string
    accountRef?: string
  }) => Promise<SubAccountResponse>
  
  getSubAccountBalance: (params?: {
    subAccountId?: string
  }) => Promise<SubAccountResponse>
}

const adminTransactionsAPI: AdminTransactionsAPI = {
  async getAccountTransactions(params = {}) {
    const { dateFrom, dateTo, limit = 50, page = 1 } = params
    const queryParams = new URLSearchParams()
    if (dateFrom) queryParams.append('dateFrom', dateFrom)
    if (dateTo) queryParams.append('dateTo', dateTo)
    queryParams.append('limit', limit.toString())
    queryParams.append('page', page.toString())
    
    const response = await fetch(
      `${API_BASE}/api/v1/admin/transactions/account?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch account transactions')
    }
    
    return response.json()
  },
  
  async getVirtualAccountTransactions(virtualAccount: string, params = {}) {
    const { dateFrom, dateTo, limit = 50, page = 1 } = params
    const queryParams = new URLSearchParams()
    if (dateFrom) queryParams.append('dateFrom', dateFrom)
    if (dateTo) queryParams.append('dateTo', dateTo)
    queryParams.append('limit', limit.toString())
    queryParams.append('page', page.toString())
    
    const response = await fetch(
      `${API_BASE}/api/v1/admin/transactions/virtual/${virtualAccount}?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch virtual account transactions')
    }
    
    return response.json()
  },
  
  async getBankTransactions(params = {}) {
    const { limit = 50, page = 1 } = params
    const queryParams = new URLSearchParams()
    queryParams.append('limit', limit.toString())
    queryParams.append('page', page.toString())
    
    const response = await fetch(
      `${API_BASE}/api/v1/admin/transactions/bank?${queryParams}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch bank transactions')
    }
    
    return response.json()
  },
  
  async getSubAccountDetails(params = {}) {
    const { subAccountId, accountRef } = params
    const queryParams = new URLSearchParams()
    if (subAccountId) queryParams.append('sub_account_id', subAccountId)
    if (accountRef) queryParams.append('account_ref', accountRef)
    
    const response = await fetch(
      `${API_BASE}/api/v1/admin/transactions/sub-account/details${queryParams.toString() ? `?${queryParams}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch sub-account details')
    }
    
    return response.json()
  },
  
  async getSubAccountBalance(params = {}) {
    const { subAccountId } = params
    const queryParams = new URLSearchParams()
    if (subAccountId) queryParams.append('sub_account_id', subAccountId)
    
    const response = await fetch(
      `${API_BASE}/api/v1/admin/transactions/sub-account/balance${queryParams.toString() ? `?${queryParams}` : ''}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      }
    )
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.detail || 'Failed to fetch sub-account balance')
    }
    
    return response.json()
  },
}

export default adminTransactionsAPI
