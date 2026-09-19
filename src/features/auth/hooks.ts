import { useQuery } from '@tanstack/react-query'
import { getMyInfo } from './api'

export function useMyInfo(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMyInfo,
    enabled,
  })
}
