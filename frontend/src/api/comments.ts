import { apiClient } from './client'
import { extractErrorMessage } from './errors'
import type { Comment } from '../types/comment'

export async function fetchComments(postId: number): Promise<Comment[]> {
  const response = await apiClient.get<Comment[]>(`/posts/${postId}/comments`)
  return response.data
}

export async function createComment(
  postId: number,
  content: string,
  parentCommentId?: number | null,
): Promise<Comment> {
  try {
    const response = await apiClient.post<Comment>(`/posts/${postId}/comments`, { content, parentCommentId })
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'コメントの投稿に失敗しました'), { cause: error })
  }
}

export async function updateComment(id: number, content: string): Promise<Comment> {
  try {
    const response = await apiClient.put<Comment>(`/comments/${id}`, { content })
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'コメントの編集に失敗しました'), { cause: error })
  }
}

export async function deleteComment(id: number): Promise<void> {
  try {
    await apiClient.delete(`/comments/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, 'コメントの削除に失敗しました'), { cause: error })
  }
}
