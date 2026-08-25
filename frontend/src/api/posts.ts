import { apiClient } from './client'
import { extractErrorMessage } from './errors'
import type { Post, PostPage } from '../types/post'

export async function fetchPosts(params: {
  cursor?: string | null
  limit?: number
  userId?: number
  scope?: 'all' | 'following'
}): Promise<PostPage> {
  const response = await apiClient.get<PostPage>('/posts', {
    params: { cursor: params.cursor ?? undefined, limit: params.limit, userId: params.userId, scope: params.scope },
  })
  return response.data
}

export async function fetchNewPostCount(afterId: number, scope?: 'all' | 'following'): Promise<number> {
  const response = await apiClient.get<{ count: number }>('/posts/new-count', {
    params: { after: afterId, scope },
  })
  return response.data.count
}

export async function fetchPost(id: number): Promise<Post> {
  const response = await apiClient.get<Post>(`/posts/${id}`)
  return response.data
}

export async function createPost(content: string): Promise<Post> {
  try {
    const response = await apiClient.post<Post>('/posts', { content })
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, '投稿に失敗しました'), { cause: error })
  }
}

export async function updatePost(id: number, content: string): Promise<Post> {
  try {
    const response = await apiClient.put<Post>(`/posts/${id}`, { content })
    return response.data
  } catch (error) {
    throw new Error(extractErrorMessage(error, '投稿の編集に失敗しました'), { cause: error })
  }
}

export async function deletePost(id: number): Promise<void> {
  try {
    await apiClient.delete(`/posts/${id}`)
  } catch (error) {
    throw new Error(extractErrorMessage(error, '投稿の削除に失敗しました'), { cause: error })
  }
}
