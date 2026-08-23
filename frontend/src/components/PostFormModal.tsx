import { useEffect, useState } from 'react'

const MAX_CONTENT_LENGTH = 280

interface PostFormModalProps {
  mode: 'create' | 'edit'
  initialContent?: string
  onClose: () => void
  onSubmit: (content: string) => Promise<void>
}

export function PostFormModal({ mode, initialContent, onClose, onSubmit }: PostFormModalProps) {
  const [content, setContent] = useState(initialContent ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const trimmed = content.trim()
  const isTooLong = content.length > MAX_CONTENT_LENGTH
  const canSubmit = trimmed.length > 0 && !isTooLong && !submitting

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit(trimmed)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-900/50 p-4" onClick={onClose}>
      <div
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl bg-surface p-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-text">{mode === 'create' ? '投稿する' : '投稿を編集'}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-text-muted hover:text-text"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <textarea
          className="w-full resize-y rounded-lg border border-border p-3 text-text"
          rows={4}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="いまどうしてる?"
          autoFocus
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
            {submitting ? '送信中...' : mode === 'create' ? '投稿する' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
