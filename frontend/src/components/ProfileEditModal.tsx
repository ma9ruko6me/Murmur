import { useEffect, useState } from 'react'

const MAX_DISPLAY_NAME_LENGTH = 50
const MAX_BIO_LENGTH = 160

interface ProfileEditModalProps {
  initialDisplayName: string
  initialBio: string
  onClose: () => void
  onSubmit: (values: { displayName: string; bio: string }) => Promise<void>
}

export function ProfileEditModal({
  initialDisplayName,
  initialBio,
  onClose,
  onSubmit,
}: ProfileEditModalProps) {
  const [displayName, setDisplayName] = useState(initialDisplayName)
  const [bio, setBio] = useState(initialBio)
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

  const trimmedDisplayName = displayName.trim()
  const isDisplayNameTooLong = displayName.length > MAX_DISPLAY_NAME_LENGTH
  const isBioTooLong = bio.length > MAX_BIO_LENGTH
  const canSubmit = trimmedDisplayName.length > 0 && !isDisplayNameTooLong && !isBioTooLong && !submitting

  async function handleSubmit() {
    setError(null)
    setSubmitting(true)
    try {
      await onSubmit({ displayName: trimmedDisplayName, bio: bio.trim() })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'プロフィールの更新に失敗しました')
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
          <h2 className="text-lg font-bold text-text">プロフィールを編集</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-lg text-text-muted hover:text-text"
            aria-label="閉じる"
          >
            ✕
          </button>
        </div>

        <label className="mb-1 block text-sm font-semibold text-text" htmlFor="profile-display-name">
          表示名
        </label>
        <input
          id="profile-display-name"
          type="text"
          className="w-full rounded-lg border border-border p-3 text-text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          autoFocus
        />
        <div className={`my-1 text-right text-sm ${isDisplayNameTooLong ? 'text-red-600' : 'text-text-muted'}`}>
          {displayName.length} / {MAX_DISPLAY_NAME_LENGTH}
        </div>

        <label className="mb-1 block text-sm font-semibold text-text" htmlFor="profile-bio">
          自己紹介
        </label>
        <textarea
          id="profile-bio"
          className="w-full resize-y rounded-lg border border-border p-3 text-text"
          rows={4}
          value={bio}
          onChange={(e) => setBio(e.target.value)}
        />
        <div className={`my-1 text-right text-sm ${isBioTooLong ? 'text-red-600' : 'text-text-muted'}`}>
          {bio.length} / {MAX_BIO_LENGTH}
        </div>

        {error && <p className="mb-2 text-sm text-red-600">{error}</p>}

        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-full bg-accent px-5 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
          >
            {submitting ? '保存中...' : '保存する'}
          </button>
        </div>
      </div>
    </div>
  )
}
