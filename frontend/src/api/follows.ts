import { apiClient } from './client'
import { extractErrorMessage } from './errors'
import type { FollowStatus, FollowUserPage } from '../types/follow'

export async function followUser(userId: number): Promise<FollowStatus> {
  try {
    const response = await apiClient.post<FollowStatus>(`/users/${userId}/follow`)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'フォローに失敗しました'), { cause: error })
  }
}

export async function unfollowUser(userId: number): Promise<FollowStatus> {
  try {
    const response = await apiClient.delete<FollowStatus>(`/users/${userId}/follow`)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'フォロー解除に失敗しました'), { cause: error })
  }
}

export async function fetchFollowers(params: {
  userId: number
  cursor?: string | null
  limit?: number
}): Promise<FollowUserPage> {
  const response = await apiClient.get<FollowUserPage>(`/users/${params.userId}/followers`, {
    params: { cursor: params.cursor ?? undefined, limit: params.limit },
  })
  return response.data
}

export async function fetchFollowing(params: {
  userId: number
  cursor?: string | null
  limit?: number
}): Promise<FollowUserPage> {
  const response = await apiClient.get<FollowUserPage>(`/users/${params.userId}/following`, {
    params: { cursor: params.cursor ?? undefined, limit: params.limit },
  })
  return response.data
}
