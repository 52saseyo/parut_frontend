import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { getSellerApplications, processSellerApplication } from './api'

export const adminKeys = {
  sellerApplications: (keyword: string, page: number) =>
    ['admin', 'seller-applications', keyword, page] as const,
}

export function useSellerApplications(keyword: string, page: number, enabled = true) {
  return useQuery({
    queryKey: adminKeys.sellerApplications(keyword, page),
    queryFn: () => getSellerApplications({ keyword: keyword || undefined, page, size: 10 }),
    enabled,
  })
}

export function useProcessSellerApplication() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      applicationId,
      input,
    }: {
      applicationId: string
      input: { status: 'APPROVED' | 'REJECTED'; rejectReason?: string }
    }) => processSellerApplication(applicationId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'seller-applications'] })
    },
  })
}
