import { useQuery } from '@tanstack/react-query'
import { getMySellerApplicationStatus } from './api'

export function useMySellerApplicationStatus(enabled = true) {
  return useQuery({
    queryKey: ['sellers', 'me', 'application'],
    queryFn: getMySellerApplicationStatus,
    enabled,
  })
}
