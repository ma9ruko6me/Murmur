import { apiClient } from './client'
import type { PostPage } from '../types/post'
import type { UserSearchResultPage } from '../types/search'

export async function searchUsers(params: {
  q: string
  cursor?: string | null
  limit?: number
}): Promise<UserSearchResultPage> {
  const response = await apiClient.get<UserSearchResultPage>('/users/search', {
    params: { q: params.q, cursor: params.cursor ?? undefined, limit: params.limit },
  })
  return response.data
}

export async function searchPosts(params: {
  q: string
  cursor?: string | null
  limit?: number
}): Promise<PostPage> {
  const response = await apiClient.get<PostPage>('/posts/search', {
    params: { q: params.q, cursor: params.cursor ?? undefined, limit: params.limit },
  })
  return response.data
}
