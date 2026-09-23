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

export async function getSellerSettlements(status: SettlementStatus = 'PENDING', size: 10 | 30 | 50 = 50) {
  const response = await apiClient.get<ApiResponse<SellerSettlementPage>>('/api/v1/settlements', {
    params: { status, size },
  })
  return response.data.data
}

export async function getAdminSettlements(status: SettlementStatus = 'PENDING', page = 0) {
  // 정렬은 서버 기본값(createdAt, id 내림차순)을 그대로 쓴다.
  // createdAt만 지정하면 생성 시각이 같은 정산의 순서가 조회마다 달라진다.
  const response = await apiClient.get<ApiResponse<AdminSettlementPage>>(
    '/api/v1/admin/settlements',
    // 한 요청의 승인 상한이 50건이라 한 페이지에서 전체 선택으로 상한을 채울 수 있게 맞춘다.
    { params: { status, page, size: 50 } },
  )
  return response.data.data
}

export type SettlementCompletionStatus = 'SUCCESS' | 'FAILED'

// 완료하지 못한 정산도 같은 배열에 담겨 오며 완료 정보 필드는 비어 있다.
export type SettlementCompletionItem = {
  settlementId: string
  orderItemId: string | null
  status: SettlementStatus | null
  settledAt: string | null
  result: SettlementCompletionStatus
}

export function summarizeCompletion(items: SettlementCompletionItem[]) {
  const succeeded = items.filter((item) => item.result === 'SUCCESS').length
  return { total: items.length, succeeded, failed: items.length - succeeded }
}

export async function completeSettlements(settlementIds: string[]) {
  const response = await apiClient.patch<ApiResponse<SettlementCompletionItem[]>>(
    '/api/v1/settlements/complete',
    { settlementIds },
  )
  return response.data.data
}
