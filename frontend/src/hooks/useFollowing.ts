import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFollowing } from '../api/follows'

export function useFollowing(userId?: number) {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'following'],
    queryFn: ({ pageParam }) => fetchFollowing({ userId: userId!, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: userId != null,
  })
}
