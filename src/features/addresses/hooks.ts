import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createAddress,
  deleteAddress,
  getAddresses,
  setDefaultAddress,
  updateAddress,
  type AddressInput,
  type AddressUpdateInput,
} from './api'

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

function useAddressMutation<T>(mutationFn: (value: T) => Promise<unknown>) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: addressKeys.all }),
  })
}

export function useUpdateAddress() {
  return useAddressMutation(({ addressId, input }: { addressId: string; input: AddressUpdateInput }) =>
    updateAddress(addressId, input),
  )
}

export function useSetDefaultAddress() {
  return useAddressMutation((addressId: string) => setDefaultAddress(addressId))
}

export function useDeleteAddress() {
  return useAddressMutation((addressId: string) => deleteAddress(addressId))
}
