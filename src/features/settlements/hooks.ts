import { useQuery } from '@tanstack/react-query'
import { getAdminSettlements, getSellerSettlements, type SettlementStatus } from './api'

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
