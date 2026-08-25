import type { InfiniteData, QueryClient } from '@tanstack/react-query'
import type { FollowUserPage } from '../types/follow'

export type FollowUserQueryData = InfiniteData<FollowUserPage, string | null>

export function patchFollowUserInInfiniteCache(
  queryClient: QueryClient,
  userId: number,
  followedByMe: boolean,
  queryKey: readonly unknown[],
): void {
  queryClient.setQueryData<FollowUserQueryData>(queryKey, (old) => {
    if (!old) {
      return old
    }
    return {
      ...old,
      pages: old.pages.map((page) => ({
        ...page,
        items: page.items.map((item) => (item.id === userId ? { ...item, followedByMe } : item)),
      })),
    }
  })
}
