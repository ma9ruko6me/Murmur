import { useState } from 'react'
import type { FormEvent } from 'react'
import { login, signup } from '../api/auth'
import type { AuthUser } from '../types/auth'

interface AuthFormProps {
  onLoggedIn: (token: string, user: AuthUser) => void
}

export function AuthForm({ onLoggedIn }: AuthFormProps) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
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
      if (mode === 'signup') {
        await signup({ username, displayName, email, password })
      }
      const result = await login({ email, password })
      onLoggedIn(result.token, result.user)
    } catch {
      setError(mode === 'signup' ? 'サインアップに失敗しました' : 'ログインに失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-sm flex-col gap-3 rounded-lg border border-border bg-surface p-6"
    >
      <h1 className="text-lg font-semibold text-text">
        {mode === 'login' ? 'ログイン' : 'サインアップ'}
      </h1>

      {mode === 'signup' && (
        <>
          <input
            className="rounded border border-border px-3 py-2"
            placeholder="ユーザー名"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            className="rounded border border-border px-3 py-2"
            placeholder="表示名"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
          />
        </>
      )}
      <input
        className="rounded border border-border px-3 py-2"
        type="email"
        placeholder="メールアドレス"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        className="rounded border border-border px-3 py-2"
        type="password"
        placeholder="パスワード"
        minLength={8}
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded bg-accent px-3 py-2 text-white hover:bg-accent-hover disabled:opacity-50"
      >
        {mode === 'login' ? 'ログイン' : 'サインアップ'}
      </button>

      <button
        type="button"
        className="text-sm text-text-muted underline"
        onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
      >
        {mode === 'login' ? 'アカウントを作成する' : 'ログインに戻る'}
      </button>
    </form>
  )
}
