import { apiClient } from './client'
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

export async function signup(payload: SignupPayload): Promise<void> {
  await apiClient.post('/auth/signup', payload)
}

export async function login(payload: LoginPayload): Promise<LoginResponse> {
  const response = await apiClient.post<LoginResponse>('/auth/login', payload)
  return response.data
}

export async function logout(token: string): Promise<void> {
  await apiClient.post('/auth/logout', {}, { headers: { Authorization: `Bearer ${token}` } })
}

export async function fetchMe(token: string): Promise<AuthUser> {
  const response = await apiClient.get<AuthUser>('/users/me', {
    headers: { Authorization: `Bearer ${token}` },
  })
  return response.data
}
