import { apiClient, authStorage, type ApiResponse, type TokenResponse } from '../../lib/api'

export type LoginRequest = {
  username: string
  password: string
}

export type SignupRequest = LoginRequest & {
  name: string
  slackId?: string
}

export async function login(request: LoginRequest) {
  const response = await apiClient.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/login/user',
    request,
  )
  authStorage.setTokens(response.data.data.accessToken, response.data.data.refreshToken)
  return response.data.data
}

export async function signup(request: SignupRequest) {
  await apiClient.post<ApiResponse<null>>('/api/v1/auth/signup', request)
}

export async function logout() {
  try {
    await apiClient.post<ApiResponse<null>>('/api/v1/auth/logout')
  } finally {
    authStorage.clear()
  }
}
