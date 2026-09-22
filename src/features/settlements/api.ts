import { apiClient, type ApiResponse } from '../../lib/api'

export type SettlementStatus = 'PENDING' | 'COMPLETED'

export type Settlement = {
  settlementId: string
  orderItemId: string
  salesAmount: number
  settlementAmount: number
  status: SettlementStatus
  eligibleAt: string
  settledAt: string | null
}

export type AdminSettlement = Settlement & {
  sellerId: string
  processedBy: string | null
  createdAt: string
}

export type SellerSettlementPage = {
  content: Settlement[]
  pageInfo: {
    nextCursor: string | null
    nextIdAfter: string | null
    hasNext: boolean
    sortBy: string
    sortDirection: string
  }
}

export type AdminSettlementPage = {
  content: AdminSettlement[]
  pageInfo: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    last: boolean
  }
}

export async function getSellerSettlements(status: SettlementStatus = 'PENDING') {
  const response = await apiClient.get<ApiResponse<SellerSettlementPage>>('/api/v1/settlements', {
    params: { status, size: 10 },
  })
  return response.data.data
}

export async function getAdminSettlements(status: SettlementStatus = 'PENDING', page = 0) {
  const response = await apiClient.get<ApiResponse<AdminSettlementPage>>(
    '/api/v1/admin/settlements',
    { params: { status, page, size: 10, sort: 'createdAt,desc' } },
  )
  return response.data.data
}

export async function completeSettlements(settlementIds: string[]) {
  const response = await apiClient.patch<ApiResponse<AdminSettlement[]>>(
    '/api/v1/settlements/complete',
    { settlementIds },
  )
  return response.data.data
}
