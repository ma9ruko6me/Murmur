import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchPosts } from '../api/posts'
import { postsQueryKey } from '../lib/postsCache'

export function useInfinitePosts(userId?: number) {
  return useInfiniteQuery({
    queryKey: postsQueryKey(userId),
    queryFn: ({ pageParam }) => fetchPosts({ cursor: pageParam, userId }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })
}
