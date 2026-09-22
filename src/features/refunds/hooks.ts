import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveRefunds, cancelRefund, getRefunds, rejectRefund, requestRefund, type Refund } from './api'

const refundKeys = {
  all: ['refunds'] as const,
  list: (status?: Refund['status']) => ['refunds', 'list', status] as const,
}

export function useRefunds(enabled = true, status?: Refund['status']) {
  return useQuery({ queryKey: refundKeys.list(status), queryFn: () => getRefunds(status), enabled })
}

export function useRequestRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ orderItemId, reason }: { orderItemId: string; reason: string }) =>
      requestRefund(orderItemId, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: refundKeys.all }),
  })
}

export function useCancelRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (refundId: string) => cancelRefund(refundId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: refundKeys.all }),
  })
}

export function useApproveRefunds() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (refundIds: string[]) => approveRefunds(refundIds),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: refundKeys.all }),
  })
}

export function useRejectRefund() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ refundId, rejectionReason }: { refundId: string; rejectionReason: string }) =>
      rejectRefund(refundId, rejectionReason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: refundKeys.all }),
  })
}
