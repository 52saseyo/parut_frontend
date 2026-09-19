import axios from 'axios'
import type { AxiosError, InternalAxiosRequestConfig } from 'axios'

const ACCESS_TOKEN_KEY = 'parut.accessToken'
const REFRESH_TOKEN_KEY = 'parut.refreshToken'

export const authStorage = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  setTokens: (accessToken: string, refreshToken: string) => {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken)
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken)
  },
  clear: () => {
    localStorage.removeItem(ACCESS_TOKEN_KEY)
    localStorage.removeItem(REFRESH_TOKEN_KEY)
  },
}

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

let refreshPromise: Promise<string | null> | null = null

apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = authStorage.getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as
      (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined
    const refreshToken = authStorage.getRefreshToken()

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      !refreshToken ||
      originalRequest.url?.includes('/auth/reissue')
    ) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    refreshPromise ??= apiClient
      .post<ApiResponse<TokenResponse>>('/api/v1/auth/reissue', null, {
        headers: { 'Refresh-Token': refreshToken },
      })
      .then(({ data }) => {
        authStorage.setTokens(data.data.accessToken, data.data.refreshToken)
        return data.data.accessToken
      })
      .catch(() => {
        authStorage.clear()
        return null
      })
      .finally(() => {
        refreshPromise = null
      })

    const newAccessToken = await refreshPromise
    if (!newAccessToken) return Promise.reject(error)
    originalRequest.headers.Authorization = `Bearer ${newAccessToken}`
    return apiClient(originalRequest)
  },
)

export type ApiResponse<T> = {
  code: string
  data: T
  traceId?: string
  timestamp?: string
}

export type TokenResponse = {
  accessToken: string
  refreshToken: string
}
