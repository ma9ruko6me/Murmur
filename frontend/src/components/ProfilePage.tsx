import { useCallback, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { useUserProfile } from '../hooks/useUserProfile'
import { useInfinitePosts } from '../hooks/useInfinitePosts'
import { useIntersectionSentinel } from '../hooks/useIntersectionSentinel'
import { updateMyProfile } from '../api/users'
import { updatePost, deletePost } from '../api/posts'
import { likePost, unlikePost } from '../api/likes'
import {
  patchPostInInfiniteCache,
  patchPostsByAuthorInInfiniteCache,
  postsQueryKey,
  removePostFromInfiniteCache,
} from '../lib/postsCache'
import type { AuthUser } from '../types/auth'
import type { Post } from '../types/post'
import { Avatar } from './Avatar'
import { PostCard } from './PostCard'
import { PostFormModal } from './PostFormModal'
import { ProfileEditModal } from './ProfileEditModal'
import { ConfirmDialog } from './ConfirmDialog'

interface ProfilePageProps {
  currentUser: AuthUser
}

export function ProfilePage({ currentUser }: ProfilePageProps) {
  const { username } = useParams<{ username: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: profile, isLoading: isProfileLoading } = useUserProfile(username ?? '')
  const queryKey = useMemo(() => postsQueryKey(profile?.id), [profile?.id])
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading: isPostsLoading } =
    useInfinitePosts(profile?.id)

  const posts = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const sentinelRef = useIntersectionSentinel(handleLoadMore, Boolean(hasNextPage))

  async function handleEditProfileSubmit(values: { displayName: string; bio: string }) {
    const updated = await updateMyProfile(values)
    queryClient.setQueryData(['users', username], updated)
    patchPostsByAuthorInInfiniteCache(
      queryClient,
      updated.id,
      (post) => ({ ...post, displayName: updated.displayName }),
      queryKey,
    )
  }

  async function handleEditPostSubmit(content: string) {
    if (!editingPost) {
      return
    }
    const updated = await updatePost(editingPost.id, content)
    patchPostInInfiniteCache(queryClient, updated.id, () => updated, queryKey)
  }

  async function handleConfirmDeletePost() {
    if (deleteTargetId == null) {
      return
    }
    const id = deleteTargetId
    setDeleteTargetId(null)
    await deletePost(id)
    removePostFromInfiniteCache(queryClient, id, queryKey)
  }

  async function handleToggleLike(post: Post) {
    const status = post.likedByMe ? await unlikePost(post.id) : await likePost(post.id)
    patchPostInInfiniteCache(
      queryClient,
      post.id,
      (item) => ({ ...item, likeCount: status.likeCount, likedByMe: status.likedByMe }),
      queryKey,
    )
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
        <span className="text-xl font-bold text-accent">プロフィール</span>
      </nav>

      <main className="mx-auto max-w-[640px] px-4 py-6 pb-16">
        <section className="mb-6 flex flex-wrap items-start gap-4 rounded-xl border border-border bg-surface p-4">
          <Avatar userId={profile.id} displayName={profile.displayName} size="lg" />
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-bold text-text">{profile.displayName}</h1>
            <p className="text-sm text-text-muted">@{profile.username}</p>
            {profile.bio && <p className="mt-2 whitespace-pre-wrap leading-relaxed text-text">{profile.bio}</p>}
          </div>
          {profile.own && (
            <button
              type="button"
              onClick={() => setIsEditingProfile(true)}
              className="rounded-full border border-border bg-surface px-5 py-2 font-semibold text-text hover:bg-bg"
            >
              プロフィールを編集
            </button>
          )}
        </section>

        {isPostsLoading && <p className="py-8 text-center text-text-muted">読み込み中...</p>}

        {!isPostsLoading && posts.length === 0 && (
          <p className="py-8 text-center text-text-muted">まだ投稿がありません</p>
        )}

        <div className="flex flex-col gap-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              currentUserId={currentUser.id}
              onEdit={setEditingPost}
              onDeleteRequest={setDeleteTargetId}
              onToggleLike={handleToggleLike}
            />
          ))}
        </div>

        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && <p className="py-4 text-center text-text-muted">読み込み中...</p>}
      </main>

      {isEditingProfile && (
        <ProfileEditModal
          initialDisplayName={profile.displayName}
          initialBio={profile.bio ?? ''}
          onClose={() => setIsEditingProfile(false)}
          onSubmit={handleEditProfileSubmit}
        />
      )}

      {editingPost && (
        <PostFormModal
          key={editingPost.id}
          mode="edit"
          initialContent={editingPost.content}
          onClose={() => setEditingPost(null)}
          onSubmit={handleEditPostSubmit}
        />
      )}

      <ConfirmDialog
        open={deleteTargetId != null}
        message="この投稿を削除しますか?この操作は取り消せません"
        confirmLabel="削除する"
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
