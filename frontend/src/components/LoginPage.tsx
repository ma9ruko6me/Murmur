import { useState } from 'react'
import type { FormEvent } from 'react'
import { login } from '../api/auth'
import type { AuthUser } from '../types/auth'

interface LoginPageProps {
  onLoggedIn: (token: string, user: AuthUser) => void
  onSwitchToSignup: () => void
}

export function LoginPage({ onLoggedIn, onSwitchToSignup }: LoginPageProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const result = await login({ email, password })
      onLoggedIn(result.token, result.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ログインに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex w-full max-w-sm flex-col gap-4 rounded-xl border border-border bg-surface p-8 shadow-sm">
      <h1 className="text-center text-2xl font-bold text-accent">Murmur</h1>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
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
            autoComplete="current-password"
            required
          />
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="mt-2 rounded bg-accent px-3 py-2 font-semibold text-white hover:bg-accent-hover disabled:opacity-50"
        >
          {submitting ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>

      <p className="text-center text-sm text-text-muted">
        アカウントをお持ちでない方は{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold text-accent underline"
        >
          サインアップ
        </button>
      </p>
    </div>
  )
}
