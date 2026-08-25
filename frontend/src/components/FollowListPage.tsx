import { useCallback, useMemo } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '../hooks/useUserProfile'
import { useFollowers } from '../hooks/useFollowers'
import { useFollowing } from '../hooks/useFollowing'
import { useIntersectionSentinel } from '../hooks/useIntersectionSentinel'
import { followUser, unfollowUser } from '../api/follows'
import { patchFollowUserInInfiniteCache } from '../lib/followCache'
import type { AuthUser } from '../types/auth'
import { Avatar } from './Avatar'
import { FollowButton } from './FollowButton'

interface FollowListPageProps {
  currentUser: AuthUser
  listType: 'followers' | 'following'
}

const TITLES: Record<FollowListPageProps['listType'], string> = {
  followers: 'フォロワー',
  following: 'フォロー中',
}

export function FollowListPage({ currentUser, listType }: FollowListPageProps) {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: isProfileLoading } = useUserProfile(username ?? '')
  const queryKey = useMemo(() => ['users', profile?.id, listType], [profile?.id, listType])

  const followersQuery = useFollowers(listType === 'followers' ? profile?.id : undefined)
  const followingQuery = useFollowing(listType === 'following' ? profile?.id : undefined)
  const activeQuery = listType === 'followers' ? followersQuery : followingQuery

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isListLoading } = activeQuery
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

  if (isProfileLoading) {
    return <p className="py-8 text-center text-text-muted">読み込み中...</p>
  }

  if (!profile) {
    return <p className="py-8 text-center text-text-muted">ユーザーが見つかりません</p>
  }

  return (
    <div className="min-h-svh bg-bg text-text">
      <nav className="sticky top-0 z-10 flex items-center gap-4 border-b border-border bg-surface px-6 py-3">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="text-lg text-text-muted hover:text-text"
          aria-label="戻る"
        >
          ←
        </button>
        <span className="text-xl font-bold text-accent">
          @{profile.username} の{TITLES[listType]}
        </span>
      </nav>

      <main className="mx-auto max-w-[640px] px-4 py-6 pb-16">
        {isListLoading && <p className="py-8 text-center text-text-muted">読み込み中...</p>}

        {!isListLoading && users.length === 0 && (
          <p className="py-8 text-center text-text-muted">
            {listType === 'followers' ? 'フォロワーがいません' : 'フォロー中のユーザーがいません'}
          </p>
        )}

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
      </main>
    </div>
  )
}
