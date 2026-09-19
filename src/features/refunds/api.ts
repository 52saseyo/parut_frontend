import { apiClient, type ApiResponse } from '../../lib/api'

export type Refund = {
  refundId: string
  orderItemId: string
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'CANCELED'
  refundAmount: number
  reason: string
  rejectionReason: string | null
  requestedAt: string
  canceledAt: string | null
  processedAt: string | null
  processedBy: string | null
}

export function approveRefundsPayload(refundIds: string[]) {
  return { refundIds }
}

export async function requestRefund(orderItemId: string, reason: string) {
  const response = await apiClient.post<ApiResponse<Refund>>(
    `/api/v1/order-items/${orderItemId}/refunds`,
    { reason },
  )
  return response.data.data
}

export async function cancelRefund(refundId: string) {
  const response = await apiClient.patch<ApiResponse<Refund>>(`/api/v1/refunds/${refundId}/cancel`)
  return response.data.data
}

export async function approveRefunds(refundIds: string[]) {
  const response = await apiClient.patch<ApiResponse<Refund[]>>(
    '/api/v1/refunds/approve',
    approveRefundsPayload(refundIds),
  )
  return response.data.data
}

export async function rejectRefund(refundId: string, rejectionReason: string) {
  const response = await apiClient.patch<ApiResponse<Refund>>(
    `/api/v1/refunds/${refundId}/reject`,
    { rejectionReason },
  )
  return response.data.data
}
