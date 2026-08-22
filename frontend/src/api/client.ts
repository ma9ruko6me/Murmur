import axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080/api',
  withCredentials: true,
})

let accessToken: string | null = null

export function getAccessToken(): string | null {
  return accessToken
}

export function setAccessToken(token: string | null): void {
  accessToken = token
}

let onAuthFailure: (() => void) | null = null

export function setOnAuthFailure(handler: (() => void) | null): void {
  onAuthFailure = handler
}

apiClient.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`
  }
  return config
})

interface RetryableRequestConfig extends AxiosRequestConfig {
  _retry?: boolean
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as RetryableRequestConfig | undefined
    const isRefreshCall = originalRequest?.url?.includes('/auth/refresh')

    if (error.response?.status !== 401 || !originalRequest || originalRequest._retry || isRefreshCall) {
      return Promise.reject(error)
    }

    originalRequest._retry = true
    try {
      const { data } = await apiClient.post<{ token: string }>('/auth/refresh')
      setAccessToken(data.token)
      originalRequest.headers = { ...originalRequest.headers, Authorization: `Bearer ${data.token}` }
      return apiClient(originalRequest)
    } catch (refreshError) {
      setAccessToken(null)
      onAuthFailure?.()
      return Promise.reject(refreshError)
    }
  },
)
