import { useInfiniteQuery } from '@tanstack/react-query'
import { searchUsers } from '../api/search'

export function useUserSearch(q: string) {
  return useInfiniteQuery({
    queryKey: ['search', 'users', q],
    queryFn: ({ pageParam }) => searchUsers({ q, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: q.trim().length > 0,
  })
}
