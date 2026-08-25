import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Comment } from '../types/comment'
import { Avatar } from './Avatar'

const MAX_CONTENT_LENGTH = 280

interface CommentItemProps {
  comment: Comment
  currentUserId: number
  onReply: (comment: Comment) => void
  onSaveEdit: (id: number, content: string) => Promise<void>
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

export function CommentItem({ comment, currentUserId, onReply, onSaveEdit, onDeleteRequest }: CommentItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [draft, setDraft] = useState(comment.content ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const isOwnComment = comment.userId === currentUserId

  if (comment.deleted) {
    return (
      <li className="rounded-xl border border-border bg-surface p-4">
        {comment.replyTo && (
          <p className="mb-1 text-xs text-text-muted">@{comment.replyTo.username} への返信</p>
        )}
        <p className="text-sm italic text-text-muted">削除済みのコメントです</p>
      </li>
    )
  }

  const trimmed = draft.trim()
  const isTooLong = draft.length > MAX_CONTENT_LENGTH
  const canSave = trimmed.length > 0 && !isTooLong && !submitting

  function handleCancelEdit() {
    setIsEditing(false)
    setDraft(comment.content ?? '')
    setError(null)
  }

  async function handleSave() {
    setError(null)
    setSubmitting(true)
    try {
      await onSaveEdit(comment.id, trimmed)
      setIsEditing(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コメントの編集に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <li className="rounded-xl border border-border bg-surface p-4">
      {comment.replyTo && (
        <p className="mb-1 text-xs text-text-muted">@{comment.replyTo.username} への返信</p>
      )}

      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <Link to={`/users/${comment.username}`} className="flex items-center gap-2">
          <Avatar userId={comment.userId} displayName={comment.displayName} size="sm" />
          <span className="flex flex-col leading-tight">
            <span className="font-bold text-text hover:underline">{comment.displayName}</span>
            <span className="text-sm text-text-muted">@{comment.username}</span>
          </span>
        </Link>
        <span className="whitespace-nowrap text-sm text-text-muted">{formatDate(comment.createdAt)}</span>
      </div>

      {isEditing ? (
        <>
          <textarea
            className="w-full resize-y rounded-lg border border-border p-3 text-text"
            rows={3}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            autoFocus
          />
          <div className={`my-1 text-right text-sm ${isTooLong ? 'text-red-600' : 'text-text-muted'}`}>
            {draft.length} / {MAX_CONTENT_LENGTH}
          </div>
          {error && <p className="mb-2 text-sm text-red-600">{error}</p>}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={handleCancelEdit}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-text-muted hover:text-text"
            >
              キャンセル
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={!canSave}
              className="rounded-full bg-accent px-4 py-1.5 text-sm font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
            >
              {submitting ? '保存中...' : '保存'}
            </button>
          </div>
        </>
      ) : (
        <p className="my-2 whitespace-pre-wrap leading-relaxed text-text">{comment.content}</p>
      )}

      <div className="mt-3 flex items-center gap-4">
        <button
          type="button"
          onClick={() => onReply(comment)}
          className="rounded-full px-2 py-1 text-sm font-semibold text-text-muted hover:text-text"
        >
          返信
        </button>

        {isOwnComment && !isEditing && (
          <>
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="rounded-full px-2 py-1 text-sm font-semibold text-text-muted hover:text-text"
            >
              編集
            </button>
            <button
              type="button"
              onClick={() => onDeleteRequest(comment.id)}
              className="rounded-full px-2 py-1 text-sm font-semibold text-text-muted hover:text-red-600"
            >
              削除
            </button>
          </>
        )}
      </div>
    </li>
  )
}
