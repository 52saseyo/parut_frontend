import { apiClient, type ApiResponse } from '../../lib/api'

export type Delivery = {
  deliveryId: string
  deliveryGroupId: string
  status: 'PREPARING' | 'SHIPPED' | 'DELIVERED'
  trackingNumber: string | null
  shippedAt: string | null
  deliveredAt: string | null
}

export async function getDelivery(deliveryId: string) {
  const response = await apiClient.get<ApiResponse<Delivery>>(`/api/v1/deliveries/${deliveryId}`)
  return response.data.data
}

export async function getSellerDeliveries(orderId: string) {
  const response = await apiClient.get<ApiResponse<Delivery[]>>('/api/v1/deliveries', {
    params: { orderId },
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
