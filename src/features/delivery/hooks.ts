import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getDelivery,
  getDeliveries,
  startDelivery,
  type DeliveryListParams,
} from './api'

const deliveryKeys = {
  all: ['deliveries'] as const,
  list: (params: DeliveryListParams) => ['deliveries', 'list', params] as const,
  detail: (deliveryId: string) => ['deliveries', deliveryId] as const,
}

export function useDelivery(deliveryId: string | undefined) {
  return useQuery({
    queryKey: deliveryKeys.detail(deliveryId ?? ''),
    queryFn: () => getDelivery(deliveryId ?? ''),
    enabled: Boolean(deliveryId),
  })
}

export function useDeliveries(params: DeliveryListParams = {}, enabled = true) {
  return useQuery({
    queryKey: deliveryKeys.list(params),
    queryFn: () => getDeliveries(params),
    enabled,
  })
}

export const useSellerDeliveries = useDeliveries

export function useStartDelivery() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ deliveryId, trackingNumber }: { deliveryId: string; trackingNumber?: string }) =>
      startDelivery(deliveryId, trackingNumber),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: deliveryKeys.all }),
  })
}
