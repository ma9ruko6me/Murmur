import { useCallback, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { usePostSearch } from '../hooks/usePostSearch'
import { useIntersectionSentinel } from '../hooks/useIntersectionSentinel'
import { deletePost, updatePost } from '../api/posts'
import { likePost, unlikePost } from '../api/likes'
import { patchPostInInfiniteCache, removePostFromInfiniteCache } from '../lib/postsCache'
import type { AuthUser } from '../types/auth'
import type { Post } from '../types/post'
import { PostCard } from './PostCard'
import { PostFormModal } from './PostFormModal'
import { ConfirmDialog } from './ConfirmDialog'

interface PostSearchResultListProps {
  currentUser: AuthUser
  query: string
}

export function PostSearchResultList({ currentUser, query }: PostSearchResultListProps) {
  const queryClient = useQueryClient()
  const queryKey = useMemo(() => ['search', 'posts', query], [query])
  const [editingPost, setEditingPost] = useState<Post | null>(null)
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null)

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = usePostSearch(query)
  const posts = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data])

  const handleLoadMore = useCallback(() => {
    if (!isFetchingNextPage && hasNextPage) {
      fetchNextPage()
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage])

  const sentinelRef = useIntersectionSentinel(handleLoadMore, Boolean(hasNextPage))

  async function handleEditSubmit(content: string) {
    if (!editingPost) {
      return
    }
    const updated = await updatePost(editingPost.id, content)
    patchPostInInfiniteCache(queryClient, updated.id, () => updated, queryKey)
  }

  async function handleConfirmDelete() {
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

  if (query.trim().length === 0) {
    return <p className="py-8 text-center text-text-muted">検索キーワードを入力してください</p>
  }

  if (isLoading) {
    return <p className="py-8 text-center text-text-muted">読み込み中...</p>
  }

  if (posts.length === 0) {
    return <p className="py-8 text-center text-text-muted">該当する結果がありません</p>
  }

  return (
    <>
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
    </>
  )
}
