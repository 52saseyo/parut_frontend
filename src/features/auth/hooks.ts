import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { deleteMyInfo, getMyInfo, updateMyInfo, type UserUpdateInput } from './api'

export function useMyInfo(enabled = true) {
  return useQuery({
    queryKey: ['auth', 'me'],
    queryFn: getMyInfo,
    enabled,
  })
}

export function useUpdateMyInfo() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ userId, input }: { userId: string; input: UserUpdateInput }) =>
      updateMyInfo(userId, input),
    onSuccess: (data) => queryClient.setQueryData(['auth', 'me'], data),
  })
}

export function useDeleteMyInfo() {
  return useMutation({ mutationFn: (userId: string) => deleteMyInfo(userId) })
}
