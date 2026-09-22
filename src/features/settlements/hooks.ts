import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { completeSettlements, getAdminSettlements, getSellerSettlements, type SettlementStatus } from './api'

export function useSellerSettlements(status: SettlementStatus = 'PENDING') {
  return useQuery({
    queryKey: ['settlements', 'seller', status],
    queryFn: () => getSellerSettlements(status),
  })
}

export function useAdminSettlements(status: SettlementStatus = 'PENDING', page = 0) {
  return useQuery({
    queryKey: ['settlements', 'admin', status, page],
    queryFn: () => getAdminSettlements(status, page),
  })
}

export function useCompleteSettlements() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (settlementIds: string[]) => completeSettlements(settlementIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settlements'] }),
  })
}
