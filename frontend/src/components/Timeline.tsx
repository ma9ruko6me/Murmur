import { useCallback, useMemo, useState } from 'react'
import type { InfiniteData } from '@tanstack/react-query'
import { useQueryClient } from '@tanstack/react-query'
import { useInfinitePosts } from '../hooks/useInfinitePosts'
import { useNewPostsAvailable } from '../hooks/useNewPostsAvailable'
import { useIntersectionSentinel } from '../hooks/useIntersectionSentinel'
import { createPost, deletePost, updatePost } from '../api/posts'
import { logout } from '../api/auth'
import type { AuthUser } from '../types/auth'
import type { Post, PostPage } from '../types/post'
import { Avatar } from './Avatar'
import { PostCard } from './PostCard'
import { PostFormModal } from './PostFormModal'
import { ConfirmDialog } from './ConfirmDialog'

interface TimelineProps {
  currentUser: AuthUser
  onLogout: () => void
}

type PostsQueryData = InfiniteData<PostPage, string | null>

export function Timeline({ currentUser, onLogout }: TimelineProps) {
  const queryClient = useQueryClient()
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)
  const [loggingOut, setLoggingOut] = useState(false)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfinitePosts()

  const posts = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])
  const latestKnownId = posts[0]?.id ?? null

  const { data: newPostCount, refetch: refetchNewPostCount } = useNewPostsAvailable(
    latestKnownId,
    !isLoading,
  )

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const sentinelRef = useIntersectionSentinel(handleLoadMore, Boolean(hasNextPage))

  async function handleShowNewPosts() {
    await queryClient.resetQueries({ queryKey: ['posts'] })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  async function handleManualRefresh() {
    if ((newPostCount ?? 0) > 0) {
      await handleShowNewPosts()
    } else {
      await refetchNewPostCount()
    }
  }

  function patchCreatedPost(created: Post) {
    queryClient.setQueryData<PostsQueryData>(['posts'], (old) => {
      if (!old) {
        return old
      }
      const [firstPage, ...rest] = old.pages
      const updatedFirstPage: PostPage = {
        ...firstPage,
        items: [created, ...firstPage.items],
      }
      return { ...old, pages: [updatedFirstPage, ...rest] }
    })
  }

  function patchUpdatedPost(updated: Post) {
    queryClient.setQueryData<PostsQueryData>(['posts'], (old) => {
      if (!old) {
        return old
      }
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.map((item) => (item.id === updated.id ? updated : item)),
        })),
      }
    })
  }

  function removePostFromCache(id: number) {
    queryClient.setQueryData<PostsQueryData>(['posts'], (old) => {
      if (!old) {
        return old
      }
      return {
        ...old,
        pages: old.pages.map((page) => ({
          ...page,
          items: page.items.filter((item) => item.id !== id),
        })),
      }
    })
  }

  async function handleCreateSubmit(content: string) {
    const created = await createPost(content)
    patchCreatedPost(created)
  }

  async function handleEditSubmit(content: string) {
    if (!editingPost) {
      return
    }
    const updated = await updatePost(editingPost.id, content)
    patchUpdatedPost(updated)
  }

  async function handleConfirmDelete() {
    if (deleteTargetId == null) {
      return
    }
    const id = deleteTargetId
    setDeleteTargetId(null)
    await deletePost(id)
    removePostFromCache(id)
  }

  async function handleLogout() {
    setLoggingOut(true)
    await logout().catch(() => undefined)
    onLogout()
  }

  return (
    <div className="min-h-svh bg-bg text-text">
      <nav className="sticky top-0 z-10 flex flex-wrap items-center gap-4 border-b border-border bg-surface px-6 py-3">
        <span className="text-xl font-bold text-accent">Murmur</span>
        <div className="flex flex-1 items-center justify-end gap-4">
          <div className="flex items-center gap-2">
            <Avatar userId={currentUser.id} displayName={currentUser.displayName} size="sm" />
            <span className="hidden font-semibold text-text sm:inline">{currentUser.displayName}</span>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="rounded-full border border-border bg-surface px-5 py-2 font-semibold text-text hover:bg-bg disabled:opacity-50"
          >
            ログアウト
          </button>
        </div>
      </nav>

      <main className="mx-auto max-w-[640px] px-4 py-6 pb-16">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-text">タイムライン</h1>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleManualRefresh}
              className="rounded-full border border-border bg-surface px-5 py-2 font-semibold text-text hover:bg-bg"
            >
              更新
            </button>
            <button
              type="button"
              onClick={() => setIsCreating(true)}
              className="rounded-full bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-hover"
            >
              投稿する
            </button>
          </div>
        </div>

        {(newPostCount ?? 0) > 0 && (
          <div className="mb-4 flex justify-center">
            <button
              type="button"
              onClick={handleShowNewPosts}
              className="rounded-full bg-accent px-5 py-2 font-semibold text-white shadow-sm hover:bg-accent-hover"
            >
              {newPostCount}件の新着投稿
            </button>
          </div>
        )}

        {isLoading && <p className="py-8 text-center text-text-muted">読み込み中...</p>}

        {!isLoading && posts.length === 0 && (
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
            />
          ))}
        </div>

        <div ref={sentinelRef} className="h-4" />
        {isFetchingNextPage && <p className="py-4 text-center text-text-muted">読み込み中...</p>}
      </main>

      {isCreating && (
        <PostFormModal mode="create" onClose={() => setIsCreating(false)} onSubmit={handleCreateSubmit} />
      )}

      {editingPost && (
        <PostFormModal
          key={editingPost.id}
          mode="edit"
          initialContent={editingPost.content}
          onClose={() => setEditingPost(null)}
          onSubmit={handleEditSubmit}
        />
      )}

      <ConfirmDialog
        open={deleteTargetId != null}
        message="この投稿を削除しますか?この操作は取り消せません"
        confirmLabel="削除する"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </div>
  )
}
