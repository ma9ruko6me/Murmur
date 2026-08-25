import { Link } from 'react-router-dom'
import type { Post } from '../types/post'
import { Avatar } from './Avatar'

interface PostCardProps {
  post: Post
  currentUserId: number
  onEdit: (post: Post) => void
  onDeleteRequest: (id: number) => void
  onToggleLike: (post: Post) => void
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

export function PostCard({ post, currentUserId, onEdit, onDeleteRequest, onToggleLike }: PostCardProps) {
  const isOwnPost = post.userId === currentUserId

  return (
    <article className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/users/${post.username}`} className="flex items-center gap-2">
          <Avatar userId={post.userId} displayName={post.displayName} size="sm" />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-text hover:underline">{post.displayName}</span>
            <span className="text-sm text-text-muted">@{post.username}</span>
          </span>
        </Link>
        <span className="whitespace-nowrap text-sm text-text-muted">{formatDate(post.createdAt)}</span>
      </div>

      <p className="my-2 whitespace-pre-wrap leading-relaxed text-text">{post.content}</p>

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onToggleLike(post)}
          aria-pressed={post.likedByMe}
          className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold ${
            post.likedByMe ? 'text-red-600' : 'text-text-muted hover:text-red-600'
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill={post.likedByMe ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth="2"
            className="h-4 w-4"
          >
            <path d="M12 21s-6.716-4.35-9.428-8.28C.826 9.62 1.5 6 4.5 4.6 6.9 3.5 9.6 4.4 12 7c2.4-2.6 5.1-3.5 7.5-2.4 3 1.4 3.674 5.02 1.928 8.12C18.716 16.65 12 21 12 21z" />
          </svg>
          <span>{post.likeCount}</span>
        </button>

        <Link
          to={`/posts/${post.id}`}
          className="flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold text-text-muted hover:text-accent"
        >
          <span aria-hidden="true">💬</span>
          <span>{post.commentCount}</span>
        </Link>

        {isOwnPost && (
          <>
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
          </>
        )}
      </div>
    </article>
  )
}
