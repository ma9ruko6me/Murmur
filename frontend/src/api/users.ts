import { apiClient } from './client'
import { extractErrorMessage } from './errors'
import type { UserProfile } from '../types/profile'

export async function fetchUserProfile(username: string): Promise<UserProfile> {
  const response = await apiClient.get<UserProfile>(`/users/${encodeURIComponent(username)}`)
  return response.data
}

export async function updateMyProfile(params: { displayName: string; bio: string }): Promise<UserProfile> {
  try {
    const response = await apiClient.put<UserProfile>('/users/me', params)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'プロフィールの更新に失敗しました'), { cause: error })
  }
}
