import { apiClient, type ApiResponse } from '../../lib/api'

export type Address = {
  addressId: string
  addressName: string | null
  recipientName: string | null
  recipientPhone: string | null
  zipCode: string | null
  addressBase: string | null
  addressDetail: string | null
  defaultAddress: boolean
}

export type AddressInput = {
  addressName?: string
  recipientName: string
  recipientPhone: string
  zipCode: string
  addressBase: string
  addressDetail?: string
  defaultAddress?: boolean
}

export type AddressUpdateInput = Partial<Omit<AddressInput, 'defaultAddress'>>

export async function getAddresses() {
  const response = await apiClient.get<ApiResponse<Address[]>>('/api/v1/users/me/addresses')
  return response.data.data
}

export async function createAddress(input: AddressInput) {
  const response = await apiClient.post<ApiResponse<Address>>('/api/v1/users/me/addresses', input)
  return response.data.data
}

export async function updateAddress(addressId: string, input: AddressUpdateInput) {
  const response = await apiClient.patch<ApiResponse<Address>>(
    `/api/v1/users/me/addresses/${addressId}`,
    input,
  )
  return response.data.data
}

export async function setDefaultAddress(addressId: string) {
  const response = await apiClient.patch<ApiResponse<Address>>(
    `/api/v1/users/me/addresses/${addressId}/default`,
  )
  return response.data.data
}

export async function deleteAddress(addressId: string) {
  await apiClient.delete<ApiResponse<unknown>>(`/api/v1/users/me/addresses/${addressId}`)
}
