import { useQuery } from '@tanstack/react-query'
import { getTimeDeal, getTimeDeals, type TimeDealSearchParams } from './api'

export const timeDealKeys = {
  all: ['time-deals'] as const,
  list: (params: TimeDealSearchParams) => ['time-deals', 'list', params] as const,
  detail: (timeDealId: string) => ['time-deals', 'detail', timeDealId] as const,
}

export function useTimeDeals(params: TimeDealSearchParams = {}, enabled = true) {
  return useQuery({
    queryKey: timeDealKeys.list(params),
    queryFn: () => getTimeDeals(params),
    enabled,
  })
}

export function useTimeDeal(timeDealId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: timeDealKeys.detail(timeDealId ?? ''),
    queryFn: () => getTimeDeal(timeDealId ?? ''),
    enabled: Boolean(timeDealId) && enabled,
  })
}
