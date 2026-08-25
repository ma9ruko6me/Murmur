import { useInfiniteQuery } from '@tanstack/react-query'
import { searchPosts } from '../api/search'

export function usePostSearch(q: string) {
  return useInfiniteQuery({
    queryKey: ['search', 'posts', q],
    queryFn: ({ pageParam }) => searchPosts({ q, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: q.trim().length > 0,
  })
}
