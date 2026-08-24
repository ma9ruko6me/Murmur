import { useState } from 'react'
import type { Comment } from '../types/comment'

const MAX_CONTENT_LENGTH = 280

interface CommentFormProps {
  replyingTo: Comment | null
  onCancelReply: () => void
  onSubmit: (content: string) => Promise<void>
}

export function CommentForm({ replyingTo, onCancelReply, onSubmit }: CommentFormProps) {
  const [content, setContent] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const trimmed = content.trim()
  const isTooLong = content.length > MAX_CONTENT_LENGTH
  const canSubmit = trimmed.length > 0 && !isTooLong && !submitting

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      setContent('')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'コメントの投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      {replyingTo && (
        <div className="mb-2 flex items-center justify-between text-sm text-text-muted">
          <span>@{replyingTo.username} への返信</span>
          <button type="button" onClick={onCancelReply} className="text-text-muted hover:text-text">
            キャンセル
          </button>
        </div>
      )}

      <textarea
        className="w-full resize-y rounded-lg border border-border p-3 text-text"
        rows={3}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder={replyingTo ? '返信を入力' : 'コメントを入力'}
      />

      <div className={`my-1 text-right text-sm ${isTooLong ? 'text-red-600' : 'text-text-muted'}`}>
        {content.length} / {MAX_CONTENT_LENGTH}
      </div>

      {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="rounded-full bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? '送信中...' : replyingTo ? '返信する' : 'コメントする'}
        </button>
      </div>
    </div>
  )
}
