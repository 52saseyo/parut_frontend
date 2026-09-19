import { apiClient, type ApiResponse } from '../../lib/api'

export type Recipient = {
  recipientName: string
  recipientPhone: string
  zipCode: string
  addressBase: string
  addressDetail?: string
  deliveryRequest?: string
}

export type CreateOrderInput = {
  items: Array<{ productId: string; quantity: number }>
  recipient: Recipient
  removeFromCart?: boolean
}

export type OrderCreateResponse = {
  orderId: string
  orderNo: string
  orderType: 'NORMAL' | 'TIME_DEAL'
  orderStatus: 'CREATED' | 'STOCK_RESERVED' | 'PAYMENT_PENDING' | 'PAID' | 'ABORTED'
  totalProductAmount: number
  totalDeliveryFee: number
  totalPaymentAmount: number
  expiresAt: string
  orderedAt: string
}

export type OrderDetailResponse = {
  orderId: string
  orderNo: string
  orderType: 'NORMAL' | 'TIME_DEAL'
  orderStatus: OrderCreateResponse['orderStatus']
  totalProductAmount: number
  totalDeliveryFee: number
  totalPaymentAmount: number
  canceledAmount: number
  expiresAt: string
  orderedAt: string
  paidAt: string | null
  recipient: Recipient
  payment: {
    paymentId: string
    paymentStatus: 'READY' | 'IN_PROGRESS' | 'DONE' | 'PARTIAL_CANCELED' | 'CANCELED' | 'ABORTED'
    paymentMethod: 'CREDIT_CARD' | 'TOSS_PAY'
    totalAmount: number
    canceledAmount: number
    approvedAt: string | null
    receiptUrl: string | null
  } | null
  deliveryGroups: Array<{
    deliveryGroupId: string
    sellerId: string
    groupStatus: 'PREPARING' | 'SHIPPED' | 'DELIVERED'
    productAmount: number
    deliveryFee: number
    items: Array<{
      orderItemId: string
      productId: string
      productName: string
      quantity: number
      unitPrice: number
      itemStatus: 'ORDERED' | 'CANCELED' | 'REFUND_REQUESTED' | 'REFUNDED' | 'CONFIRMED'
      cancelable: boolean
      refundable: boolean
    }>
  }>
}

export type PaymentReadyResponse = {
  paymentId: string
  tossOrderId: string
  orderName: string
  amount: number
  customerName: string
  successUrl: string
  failUrl: string
  expiresAt: string
  idempotencyKey: string
}

export type PaymentConfirmInput = {
  paymentKey: string
  tossOrderId: string
  amount: number
}

export function createOrderPayload(input: CreateOrderInput) {
  return {
    items: input.items,
    recipient: input.recipient,
    removeFromCart: input.removeFromCart ?? false,
  }
}

export function paymentReadyPayload(
  orderId: string,
  paymentMethod: 'CREDIT_CARD' | 'TOSS_PAY' = 'TOSS_PAY',
) {
  return { orderId, paymentMethod }
}

function idempotencyKey() {
  return crypto.randomUUID()
}

export async function createOrder(input: CreateOrderInput) {
  const response = await apiClient.post<ApiResponse<OrderCreateResponse>>(
    '/api/v1/orders',
    createOrderPayload(input),
    { headers: { 'Idempotency-Key': idempotencyKey() } },
  )
  return response.data.data
}

export async function getOrder(orderId: string) {
  const response = await apiClient.get<ApiResponse<OrderDetailResponse>>(
    `/api/v1/orders/${orderId}`,
  )
  return response.data.data
}

export async function preparePayment(
  orderId: string,
  paymentMethod: 'CREDIT_CARD' | 'TOSS_PAY' = 'TOSS_PAY',
) {
  const response = await apiClient.post<ApiResponse<PaymentReadyResponse>>(
    '/api/v1/payments/ready',
    paymentReadyPayload(orderId, paymentMethod),
  )
  return response.data.data
}

export async function confirmPayment(input: PaymentConfirmInput) {
  const response = await apiClient.post<ApiResponse<unknown>>('/api/v1/payments/confirm', input, {
    headers: { 'Idempotency-Key': idempotencyKey() },
  })
  return response.data.data
}

export async function confirmOrderItem(orderId: string, orderItemId: string) {
  const response = await apiClient.patch<ApiResponse<unknown>>(
    `/api/v1/orders/${orderId}/items/${orderItemId}/confirm`,
  )
  return response.data.data
}
