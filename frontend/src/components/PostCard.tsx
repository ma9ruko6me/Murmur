import type { Post } from '../types/post'
import { Avatar } from './Avatar'

interface PostCardProps {
  post: Post
  currentUserId: number
  onEdit: (post: Post) => void
  onDeleteRequest: (id: number) => void
}

function formatDate(iso: string): string {
  const date = new Date(iso)
  return date.toLocaleString('ja-JP', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function PostCard({ post, currentUserId, onEdit, onDeleteRequest }: PostCardProps) {
  const isOwnPost = post.userId === currentUserId

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Avatar userId={post.userId} displayName={post.displayName} size="sm" />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-text">{post.displayName}</span>
            <span className="text-sm text-text-muted">@{post.username}</span>
          </span>
        </div>
        <span className="whitespace-nowrap text-sm text-text-muted">{formatDate(post.createdAt)}</span>
      </div>

      <p className="my-2 whitespace-pre-wrap leading-relaxed text-text">{post.content}</p>

      {isOwnPost && (
        <div className="mt-3 flex items-center gap-4">
          <button
            type="button"
            onClick={() => onEdit(post)}
            className="rounded-full px-2 py-1 text-sm font-semibold text-text-muted hover:text-text"
          >
            編集
          </button>
          <button
            type="button"
            onClick={() => onDeleteRequest(post.id)}
            className="rounded-full px-2 py-1 text-sm font-semibold text-text-muted hover:text-red-600"
          >
            削除
          </button>
        </div>
      )}
    </article>
  )
}
