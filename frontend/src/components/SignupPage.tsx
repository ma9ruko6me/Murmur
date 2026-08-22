import { useState } from 'react'
import type { FormEvent } from 'react'
import { login, signup } from '../api/auth'
import type { AuthUser } from '../types/auth'

interface SignupPageProps {
  onLoggedIn: (token: string, user: AuthUser) => void
  onSwitchToLogin: () => void
}

export function SignupPage({ onLoggedIn, onSwitchToLogin }: SignupPageProps) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await signup({ username, displayName, email, password })
      const result = await login({ email, password })
      onLoggedIn(result.token, result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'サインアップに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-accent">Murmur</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <label className="flex flex-col gap-1 text-sm font-semibold text-text-muted">
          ユーザー名
          <input
            type="text"
            className="rounded border border-border px-3 py-2 text-text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            pattern="[A-Za-z0-9_]+"
            maxLength={50}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-text-muted">
          表示名
          <input
            type="text"
            className="rounded border border-border px-3 py-2 text-text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-text-muted">
          メールアドレス
          <input
            type="email"
            className="rounded border border-border px-3 py-2 text-text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-semibold text-text-muted">
          パスワード
          <input
            type="password"
            className="rounded border border-border px-3 py-2 text-text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            maxLength={72}
            autoComplete="new-password"
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-accent px-3 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? '登録中...' : 'サインアップ'}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        アカウントをお持ちの方は{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold text-accent underline"
        >
          ログイン
        </button>
      </p>
    </div>
  )
}
