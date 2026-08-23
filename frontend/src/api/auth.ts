import type { AxiosRequestConfig } from 'axios'
import { apiClient } from './client'
import { extractErrorMessage } from './errors'
import type { AuthUser, LoginResponse } from '../types/auth'

export interface SignupPayload {
  username: string
  displayName: string
  email: string
  password: string
}

export interface LoginPayload {
  email: string
  password: string
}

export interface RefreshResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
}

export async function signup(payload: SignupPayload): Promise<void> {
  try {
    await apiClient.post('/auth/signup', payload)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'サインアップに失敗しました'), { cause: error })
  }
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const response = await apiClient.post<LoginResponse>('/auth/login', payload)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'ログインに失敗しました'), { cause: error })
  }
}

export async function logout(): Promise<void> {
  await apiClient.post('/auth/logout')
}

export async function fetchMe(): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('/users/me')
  return response.data
}

export async function refresh(config?: AxiosRequestConfig): Promise<RefreshResponse> {
  const response = await apiClient.post<RefreshResponse>('/auth/refresh', undefined, config)
  return response.data
}
