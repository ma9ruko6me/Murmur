import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { usePost } from '../hooks/usePost'
import { useComments } from '../hooks/useComments'
import { createComment, deleteComment, updateComment } from '../api/comments'
import { likePost, unlikePost } from '../api/likes'
import { deletePost, updatePost } from '../api/posts'
import { patchPostInInfiniteCache, removePostFromInfiniteCache } from '../lib/postsCache'
import type { AuthUser } from '../types/auth'
import type { Comment } from '../types/comment'
import type { Post } from '../types/post'
import { PostCard } from './PostCard'
import { PostFormModal } from './PostFormModal'
import { ConfirmDialog } from './ConfirmDialog'
import { CommentList } from './CommentList'
import { CommentForm } from './CommentForm'

interface PostDetailPageProps {
  currentUser: AuthUser
}

export function PostDetailPage({ currentUser }: PostDetailPageProps) {
  const { postId: postIdParam } = useParams<{ postId: string }>()
  const postId = Number(postIdParam)
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: post, isLoading: isPostLoading } = usePost(postId)
  const { data: comments, isLoading: isCommentsLoading } = useComments(postId)

  const [isEditingPost, setIsEditingPost] = useState(false)
  const [deletePostConfirm, setDeletePostConfirm] = useState(false)
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null)
  const [deleteCommentId, setDeleteCommentId] = useState<number | null>(null)

  function patchPostCommentCount(delta: number) {
    queryClient.setQueryData<Post>(['posts', postId], (old) =>
      old ? { ...old, commentCount: old.commentCount + delta } : old,
    )
    patchPostInInfiniteCache(queryClient, postId, (item) => ({
      ...item,
      commentCount: item.commentCount + delta,
    }))
  }

  function patchCommentsCache(updater: (comments: Comment[]) => Comment[]) {
    queryClient.setQueryData<Comment[]>(['posts', postId, 'comments'], (old) => (old ? updater(old) : old))
  }

  async function handleToggleLike() {
    if (!post) {
      return
    }
    const status = post.likedByMe ? await unlikePost(post.id) : await likePost(post.id)
    const updated: Post = { ...post, likeCount: status.likeCount, likedByMe: status.likedByMe }
    queryClient.setQueryData(['posts', postId], updated)
    patchPostInInfiniteCache(queryClient, postId, () => updated)
  }

  async function handleEditPostSubmit(content: string) {
    const updated = await updatePost(postId, content)
    queryClient.setQueryData(['posts', postId], updated)
    patchPostInInfiniteCache(queryClient, postId, () => updated)
  }

  async function handleConfirmDeletePost() {
    setDeletePostConfirm(false)
    await deletePost(postId)
    removePostFromInfiniteCache(queryClient, postId)
    navigate('/')
  }

  async function handleCreateComment(content: string) {
    const created = await createComment(postId, content, replyingTo?.id ?? null)
    patchCommentsCache((current) => [...current, created])
    setReplyingTo(null)
    patchPostCommentCount(1)
  }

  async function handleSaveCommentEdit(id: number, content: string) {
    const updated = await updateComment(id, content)
    patchCommentsCache((current) => current.map((comment) => (comment.id === updated.id ? updated : comment)))
  }

  async function handleConfirmDeleteComment() {
    if (deleteCommentId == null) {
      return
    }
    const id = deleteCommentId
    setDeleteCommentId(null)
    await deleteComment(id)
    patchCommentsCache((current) =>
      current.map((comment) => (comment.id === id ? { ...comment, deleted: true, content: null } : comment)),
    )
    patchPostCommentCount(-1)
  }

  if (isPostLoading) {
    return <p className="py-8 text-center text-text-muted">読み込み中...</p>
  }

  if (!post) {
    return <p className="py-8 text-center text-text-muted">投稿が見つかりません</p>
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
        <span className="text-xl font-bold text-accent">投稿</span>
      </nav>

      <main className="mx-auto max-w-[640px] px-4 py-6 pb-16">
        <PostCard
          post={post}
          currentUserId={currentUser.id}
          onEdit={() => setIsEditingPost(true)}
          onDeleteRequest={() => setDeletePostConfirm(true)}
          onToggleLike={handleToggleLike}
        />

        <div className="mt-6">
          <CommentForm
            key={replyingTo?.id ?? 'new'}
            replyingTo={replyingTo}
            onCancelReply={() => setReplyingTo(null)}
            onSubmit={handleCreateComment}
          />
        </div>

        <div className="mt-4">
          {isCommentsLoading && <p className="py-8 text-center text-text-muted">読み込み中...</p>}
          {!isCommentsLoading && comments && comments.length === 0 && (
            <p className="py-8 text-center text-text-muted">まだコメントがありません</p>
          )}
          {comments && (
            <CommentList
              comments={comments}
              currentUserId={currentUser.id}
              onReply={setReplyingTo}
              onSaveEdit={handleSaveCommentEdit}
              onDeleteRequest={setDeleteCommentId}
            />
          )}
        </div>
      </main>

      {isEditingPost && (
        <PostFormModal
          mode="edit"
          initialContent={post.content}
          onClose={() => setIsEditingPost(false)}
          onSubmit={handleEditPostSubmit}
        />
      )}

      <ConfirmDialog
        open={deletePostConfirm}
        message="この投稿を削除しますか?この操作は取り消せません"
        confirmLabel="削除する"
        onConfirm={handleConfirmDeletePost}
        onCancel={() => setDeletePostConfirm(false)}
      />

      <ConfirmDialog
        open={deleteCommentId != null}
        message="このコメントを削除しますか?この操作は取り消せません"
        confirmLabel="削除する"
        onConfirm={handleConfirmDeleteComment}
        onCancel={() => setDeleteCommentId(null)}
      />
    </div>
  )
}
