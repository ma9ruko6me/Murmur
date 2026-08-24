import { useQuery } from '@tanstack/react-query'
import { fetchPost } from '../api/posts'

export function usePost(postId: number) {
  return useQuery({
    queryKey: ['posts', postId],
    queryFn: () => fetchPost(postId),
  })
}
