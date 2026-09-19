import { apiClient, authStorage, type ApiResponse, type TokenResponse } from '../../lib/api'

export type SellerLoginRequest = {
  username: string
  password: string
}

export type SellerApplicationRequest = {
  loginId: string
  password: string
  companyName: string
  bizRegNo: string
  repName: string
  bizAddress: string
  managerName: string
  managerPhone: string
  managerEmail: string
  slackId?: string
}

export type SellerApplicationStatus = {
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectReason: string | null
  processedAt: string | null
}

export async function sellerLogin(request: SellerLoginRequest) {
  const response = await apiClient.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/login/seller',
    request,
  )
  authStorage.setTokens(response.data.data.accessToken, response.data.data.refreshToken)
  return response.data.data
}

export async function applyAsSeller(request: SellerApplicationRequest) {
  const response = await apiClient.post<ApiResponse<unknown>>('/api/v1/sellers/apply', request)
  return response.data.data
}

export async function getMySellerApplicationStatus() {
  const response = await apiClient.get<ApiResponse<SellerApplicationStatus>>(
    '/api/v1/sellers/me/application',
  )
  return response.data.data
}
