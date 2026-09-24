import { apiClient, type ApiResponse } from '../../lib/api'

export type NotificationType =
  | 'ORDER_COMPLETED'
  | 'DELIVERY_STARTED'
  | 'DELIVERY_COMPLETED'
  | 'REFUND_APPROVED'
  | 'REFUND_REJECTED'
  | 'SETTLEMENT_COMPLETED'
  | 'TIME_DEAL_OPEN_SOON'
  | (string & {})

export type ApiNotification = {
  notificationId: string
  type: NotificationType
  title?: string
  content?: string
  message?: string
  referenceId?: string | null
  targetId?: string | null
  timeDealId?: string | null
  isRead?: boolean
  read?: boolean
  readAt?: string | null
  createdAt?: string
}

type NotificationListResponse = {
  content?: ApiNotification[]
  notifications?: ApiNotification[]
  items?: ApiNotification[]
}

export async function getNotifications() {
  const response = await apiClient.get<ApiResponse<NotificationListResponse | ApiNotification[]>>(
    '/api/v1/notifications',
  )
  const data = response.data.data
  if (Array.isArray(data)) return data
  return data.content ?? data.notifications ?? data.items ?? []
}

export async function getUnreadNotificationCount() {
  const response = await apiClient.get<ApiResponse<number | { count?: number; unreadCount?: number }>>(
    '/api/v1/notifications/unread-count',
  )
  const data = response.data.data
  return typeof data === 'number' ? data : data.unreadCount ?? data.count ?? 0
}

export async function markNotificationAsRead(notificationId: string) {
  await apiClient.patch<ApiResponse<null>>(`/api/v1/notifications/${notificationId}/read`)
}

export async function subscribeToTimeDeal(timeDealId: string) {
  await apiClient.post<ApiResponse<null>>('/api/v1/notification-subscriptions/time-deals', { timeDealId })
}

export async function unsubscribeFromTimeDeal(timeDealId: string) {
  await apiClient.patch<ApiResponse<null>>(
    `/api/v1/notification-subscriptions/time-deals/${timeDealId}`,
  )
}

export async function getTimeDealSubscriptionStatus(timeDealId: string) {
  const response = await apiClient.get<
    ApiResponse<boolean | { subscribed?: boolean; isSubscribed?: boolean }>
  >(`/api/v1/notification-subscriptions/time-deals/${timeDealId}`)
  const data = response.data.data
  return typeof data === 'boolean' ? data : data.subscribed ?? data.isSubscribed ?? false
}
