import { useMutation, useQuery } from '@tanstack/react-query'
import {
  confirmOrderItem,
  createOrder,
  getOrder,
  preparePayment,
  type CreateOrderInput,
} from './api'

export const orderKeys = {
  all: ['orders'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
}

export function useCreateOrder() {
  return useMutation({ mutationFn: (input: CreateOrderInput) => createOrder(input) })
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ''),
    queryFn: () => getOrder(orderId ?? ''),
    enabled: Boolean(orderId),
  })
}

export function usePreparePayment() {
  return useMutation({
    mutationFn: ({
      orderId,
      paymentMethod,
    }: {
      orderId: string
      paymentMethod?: 'CREDIT_CARD' | 'TOSS_PAY'
    }) => preparePayment(orderId, paymentMethod),
  })
}

export function useConfirmOrderItem() {
  return useMutation({
    mutationFn: ({ orderId, orderItemId }: { orderId: string; orderItemId: string }) =>
      confirmOrderItem(orderId, orderItemId),
  })
}
