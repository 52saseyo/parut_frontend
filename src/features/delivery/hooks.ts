import { useMutation, useQuery } from '@tanstack/react-query'
import { getDelivery, getSellerDeliveries, startDelivery } from './api'

export function useDelivery(deliveryId: string | undefined) {
  return useQuery({
    queryKey: ['deliveries', deliveryId],
    queryFn: () => getDelivery(deliveryId ?? ''),
    enabled: Boolean(deliveryId),
  })
}

export function useSellerDeliveries(orderId: string | undefined) {
  return useQuery({
    queryKey: ['deliveries', 'order', orderId],
    queryFn: () => getSellerDeliveries(orderId ?? ''),
    enabled: Boolean(orderId),
  })
}

export function useStartDelivery() {
  return useMutation({
    mutationFn: ({ deliveryId, trackingNumber }: { deliveryId: string; trackingNumber?: string }) =>
      startDelivery(deliveryId, trackingNumber),
  })
}
