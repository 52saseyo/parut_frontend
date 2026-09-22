import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { approveRefunds, cancelRefund, getRefunds, rejectRefund, requestRefund } from './api'

const refundKeys = {
  all: ['refunds'] as const,
  list: () => ['refunds', 'list'] as const,
}

export function useRefunds(enabled = true) {
  return useQuery({ queryKey: refundKeys.list(), queryFn: getRefunds, enabled })
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
  return useMutation({ mutationFn: (refundIds: string[]) => approveRefunds(refundIds) })
}

export function useRejectRefund() {
  return useMutation({
    mutationFn: ({ refundId, rejectionReason }: { refundId: string; rejectionReason: string }) =>
      rejectRefund(refundId, rejectionReason),
  })
}
