import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getNotifications,
  getTimeDealSubscriptionStatus,
  getUnreadNotificationCount,
  markNotificationAsRead,
  subscribeToTimeDeal,
  unsubscribeFromTimeDeal,
} from './api'

export const notificationKeys = {
  all: ['notifications'] as const,
  list: ['notifications', 'list'] as const,
  unreadCount: ['notifications', 'unread-count'] as const,
  timeDealSubscription: (timeDealId: string) =>
    ['notifications', 'time-deal-subscription', timeDealId] as const,
}

export function useNotifications(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.list,
    queryFn: () => getNotifications(),
    enabled,
    staleTime: 30_000,
  })
}

export function useUnreadNotificationCount(enabled = true) {
  return useQuery({
    queryKey: notificationKeys.unreadCount,
    queryFn: getUnreadNotificationCount,
    enabled,
    refetchInterval: 30_000,
  })
}

export function useTimeDealSubscriptionStatus(timeDealId: string, enabled = true) {
  return useQuery({
    queryKey: notificationKeys.timeDealSubscription(timeDealId),
    queryFn: () => getTimeDealSubscriptionStatus(timeDealId),
    enabled: Boolean(timeDealId) && enabled,
    staleTime: 30_000,
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: markNotificationAsRead,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: notificationKeys.list })
      void queryClient.invalidateQueries({ queryKey: notificationKeys.unreadCount })
    },
  })
}

export function useTimeDealSubscription() {
  const queryClient = useQueryClient()
  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['notifications', 'time-deal-subscription'] })
    void queryClient.invalidateQueries({ queryKey: notificationKeys.all })
  }
  return {
    subscribe: useMutation({ mutationFn: subscribeToTimeDeal, onSuccess: invalidate }),
    unsubscribe: useMutation({ mutationFn: unsubscribeFromTimeDeal, onSuccess: invalidate }),
  }
}
