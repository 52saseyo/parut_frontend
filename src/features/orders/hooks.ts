import { useMutation, useQueries, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  confirmOrderItem,
  confirmPayment,
  createOrder,
  createTimeDealOrder,
  getOrder,
  getOrders,
  preparePayment,
  type CreateOrderInput,
  type CreateTimeDealOrderInput,
} from './api'

export const orderKeys = {
  all: ['orders'] as const,
  list: () => ['orders', 'list'] as const,
  detail: (orderId: string) => ['orders', 'detail', orderId] as const,
}

export function useOrders(enabled = true) {
  return useQuery({
    queryKey: orderKeys.list(),
    queryFn: getOrders,
    enabled,
  })
}

export function useCreateOrder() {
  return useMutation({ mutationFn: (input: CreateOrderInput) => createOrder(input) })
}

export function useCreateTimeDealOrder() {
  return useMutation({
    mutationFn: (input: CreateTimeDealOrderInput) => createTimeDealOrder(input),
  })
}

export function useOrder(orderId: string | undefined) {
  return useQuery({
    queryKey: orderKeys.detail(orderId ?? ''),
    queryFn: () => getOrder(orderId ?? ''),
    enabled: Boolean(orderId),
  })
}

export function useAdminOrderDetails(orderIds: string[], enabled = true) {
  return useQueries({
    queries: orderIds.map((orderId) => ({
      queryKey: orderKeys.detail(`admin-${orderId}`),
      queryFn: () => getOrder(orderId),
      enabled,
    })),
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

export function useConfirmPayment() {
  return useMutation({ mutationFn: confirmPayment })
}

export function useConfirmOrderItem() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderId, orderItemId }: { orderId: string; orderItemId: string }) =>
      confirmOrderItem(orderId, orderItemId),
    onSuccess: (_data, variables) => {
      void queryClient.invalidateQueries({ queryKey: orderKeys.detail(variables.orderId) })
      void queryClient.invalidateQueries({ queryKey: orderKeys.list() })
    },
  })
}
