import { apiClient, authStorage, type ApiResponse, type TokenResponse } from '../../lib/api'

export type LoginRequest = {
  username: string
  password: string
}

export type SignupRequest = LoginRequest & {
  name: string
  slackId?: string
}

export type UserProfile = {
  id: string
  username: string
  name: string
  slackId: string | null
  createdAt: string
}

export async function login(request: LoginRequest) {
  const response = await apiClient.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/login/user',
    request,
  )
  authStorage.setTokens(response.data.data.accessToken, response.data.data.refreshToken)
  return response.data.data
}

export async function adminLogin(request: LoginRequest) {
  const response = await apiClient.post<ApiResponse<TokenResponse>>(
    '/api/v1/auth/login/admin',
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
    //window.location.href = '/login'
    // 각 권한에 맞는 로그인페이지로 이동
    // 현재 접속 중인 URL 경로를 확인
    const currentPath = window.location.pathname;
    
    if (currentPath.startsWith('/seller')) {
      window.location.href = '/seller/login';   // 판매자
    } else if (currentPath.startsWith('/admin')) {
      window.location.href = '/admin/login';  //관리자
    } else {
      window.location.href = '/login'; // 고객
    }
  }
}

export async function getMyInfo() {
  const response = await apiClient.get<ApiResponse<UserProfile>>('/api/v1/users/me')
  return response.data.data
}
