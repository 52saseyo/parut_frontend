import { useMutation } from '@tanstack/react-query'
import { approveRefunds, cancelRefund, rejectRefund, requestRefund } from './api'

export function useRequestRefund() {
  return useMutation({
    mutationFn: ({ orderItemId, reason }: { orderItemId: string; reason: string }) =>
      requestRefund(orderItemId, reason),
  })
}

export function useCancelRefund() {
  return useMutation({ mutationFn: (refundId: string) => cancelRefund(refundId) })
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
