import { apiClient, type ApiResponse } from '../../lib/api'
import type { CursorResponse } from '../products/api'

export type TimeDealStatus = 'SCHEDULED' | 'ACTIVE' | 'ENDED' | 'STOPPED'
export type TimeDealProductGrade = 'NORMAL' | 'UGLY'

export type ApiTimeDeal = {
  timeDealId: string
  productId: string
  sellerId: string
  imageUrl: string | null
  name: string
  description: string
  productGrade: TimeDealProductGrade
  origin: string
  harvestedDate: string
  originalPrice: number
  discountRate: number
  dealPrice: number
  startAt: string
  endAt: string
  maxPurchaseQuantity: number
  status: TimeDealStatus
  stock: {
    availableQuantity: number
    reservedQuantity: number
    soldQuantity: number
    lowStockThreshold: number
  }
}

export type TimeDealSearchParams = {
  status?: TimeDealStatus
  cursor?: string
  cursorId?: string
  size?: number
}

export async function getTimeDeals(params: TimeDealSearchParams = {}) {
  const response = await apiClient.get<ApiResponse<CursorResponse<ApiTimeDeal>>>(
    '/api/v1/time-deals',
    {
      params: { status: 'ACTIVE', ...params },
    },
  )
  return response.data.data
}

export async function getTimeDeal(timeDealId: string) {
  const response = await apiClient.get<ApiResponse<ApiTimeDeal>>(`/api/v1/time-deals/${timeDealId}`)
  return response.data.data
}
