import { useCallback, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useUserSearch } from '../hooks/useUserSearch'
import { useIntersectionSentinel } from '../hooks/useIntersectionSentinel'
import { followUser, unfollowUser } from '../api/follows'
import { patchFollowUserInInfiniteCache } from '../lib/followCache'
import type { AuthUser } from '../types/auth'
import { Avatar } from './Avatar'
import { FollowButton } from './FollowButton'

interface UserSearchResultListProps {
  currentUser: AuthUser
  query: string
}

export function UserSearchResultList({ currentUser, query }: UserSearchResultListProps) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['search', 'users', query], [query])

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useUserSearch(query)
  const users = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const sentinelRef = useIntersectionSentinel(handleLoadMore, Boolean(hasNextPage))

  async function handleToggleFollow(userId: number, followedByMe: boolean) {
    const status = followedByMe ? await unfollowUser(userId) : await followUser(userId)
    patchFollowUserInInfiniteCache(queryClient, userId, status.followedByMe, queryKey)
  }

  if (query.trim().length === 0) {
    return <p className="py-8 text-center text-text-muted">検索キーワードを入力してください</p>
  }

  if (isLoading) {
    return <p className="py-8 text-center text-text-muted">読み込み中...</p>
  }

  if (users.length === 0) {
    return <p className="py-8 text-center text-text-muted">該当する結果がありません</p>
  }

  return (
    <>
      <ul className="flex flex-col gap-4">
        {users.map((user) => (
          <li
            key={user.id}
            className="flex items-center justify-between gap-4 rounded-xl border border-border bg-surface p-4"
          >
            <Link to={`/users/${user.username}`} className="flex min-w-0 items-center gap-2">
              <Avatar userId={user.id} displayName={user.displayName} size="sm" />
              <span className="flex min-w-0 flex-col leading-tight">
                <span className="truncate font-bold text-text hover:underline">{user.displayName}</span>
                <span className="truncate text-sm text-text-muted">@{user.username}</span>
              </span>
            </Link>
            {user.id !== currentUser.id && (
              <FollowButton userId={user.id} followedByMe={user.followedByMe} onToggle={handleToggleFollow} />
            )}
          </li>
        ))}
      </ul>

      <div ref={sentinelRef} className="h-4" />
      {isFetchingNextPage && <p className="py-4 text-center text-text-muted">読み込み中...</p>}
    </>
  )
}
