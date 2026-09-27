import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getMySellerApplicationStatus, getMySellerInfo, updateMySellerInfo, type SellerUpdateInput } from './api'

export function useMySellerApplicationStatus(enabled = true) {
  return useQuery({
    queryKey: ['sellers', 'me', 'application'],
    queryFn: getMySellerApplicationStatus,
    enabled,
  })
}

export function useMySellerInfo(enabled = true) {
  return useQuery({
    queryKey: ['sellers', 'me'],
    queryFn: getMySellerInfo,
    enabled,
  })
}

export function useUpdateMySellerInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ sellerId, input }: { sellerId: string; input: SellerUpdateInput }) =>
      updateMySellerInfo(sellerId, input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sellers', 'me'] })
      void queryClient.invalidateQueries({ queryKey: ['sellers', 'me', 'application'] })
    },
  })
}
