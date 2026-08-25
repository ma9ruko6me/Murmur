import { useInfiniteQuery } from '@tanstack/react-query'
import { fetchFollowers } from '../api/follows'

export function useFollowers(userId?: number) {
  return useInfiniteQuery({
    queryKey: ['users', userId, 'followers'],
    queryFn: ({ pageParam }) => fetchFollowers({ userId: userId!, cursor: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    enabled: userId != null,
  })
}
