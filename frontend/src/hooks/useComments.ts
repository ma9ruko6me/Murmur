import { useQuery } from '@tanstack/react-query'
import { fetchComments } from '../api/comments'

export function useComments(postId: number) {
  return useQuery({
    queryKey: ['posts', postId, 'comments'],
    queryFn: () => fetchComments(postId),
  })
}
