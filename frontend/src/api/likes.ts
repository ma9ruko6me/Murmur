import { apiClient } from './client'
import { extractErrorMessage } from './errors'
import type { LikeStatus } from '../types/post'

export async function likePost(id: number): Promise<LikeStatus> {
  try {
    const response = await apiClient.post<LikeStatus>(`/posts/${id}/like`)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'いいねに失敗しました'), { cause: error })
  }
}

export async function unlikePost(id: number): Promise<LikeStatus> {
  try {
    const response = await apiClient.delete<LikeStatus>(`/posts/${id}/like`)
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'いいねの解除に失敗しました'), { cause: error })
  }
}
