import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createAddress, getAddresses, type AddressInput } from './api'

const addressKeys = {
  all: ['addresses'] as const,
  list: () => ['addresses', 'list'] as const,
}

export function useAddresses(enabled = true) {
  return useQuery({
    queryKey: addressKeys.list(),
    queryFn: getAddresses,
    enabled,
  })
}

export function useCreateAddress() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: AddressInput) => createAddress(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}
