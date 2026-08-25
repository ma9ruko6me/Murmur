import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPosts } from '../api/posts'
import { postsQueryKey } from '../lib/postsCache'

export function useInfinitePosts(userId?: number, scope?: 'all' | 'following') {
  return useInfiniteQuery({
    queryKey: postsQueryKey(userId, scope),
    queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam, userId, scope }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
