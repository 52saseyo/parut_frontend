import { apiClient, type ApiResponse } from '../../lib/api'

export type Delivery = {
  deliveryId: string
  deliveryGroupId: string
  status: 'PREPARING' | 'SHIPPED' | 'DELIVERED'
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

export type DeliveryListResponse = {
  content: Delivery[]
  pageInfo: {
    nextCursor: string | null
    nextIdAfter: string | null
    hasNext: boolean
    sortBy: string
    sortDirection: 'ASC' | 'DESC'
  }
}

export type DeliveryListParams = {
  orderId?: string
  status?: Delivery['status']
  size?: number
  cursor?: string
  cursorId?: string
}

export type AdminDelivery = Delivery & {
  orderId: string
  customerId: string
  sellerId: string
}

export type AdminDeliveryPage = {
  content: AdminDelivery[]
  pageInfo: {
    page: number
    size: number
    totalElements: number
    totalPages: number
    last: boolean
  }
}

export async function getDelivery(deliveryId: string) {
  const response = await apiClient.get<ApiResponse<Delivery>>(`/api/v1/deliveries/${deliveryId}`)
  return response.data.data
}

export async function getDeliveries(params: DeliveryListParams = {}) {
  const response = await apiClient.get<ApiResponse<DeliveryListResponse>>('/api/v1/deliveries', {
    params: { size: 10, ...params },
  })
  return response.data.data
}

export async function getAdminDeliveries(page = 0, size = 50) {
  const response = await apiClient.get<ApiResponse<AdminDeliveryPage>>('/api/v1/admin/deliveries', {
    params: { page, size, sort: 'createdAt,id', direction: 'desc' },
  })
  return response.data.data
}

export async function startDelivery(deliveryId: string, trackingNumber?: string) {
  const response = await apiClient.patch<ApiResponse<Delivery>>(
    `/api/v1/deliveries/${deliveryId}/ship`,
    { trackingNumber },
  )
  return response.data.data
}
