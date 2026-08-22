import { useEffect, useState } from 'react'
import { AuthForm } from './components/AuthForm'
import { fetchMe, logout } from './api/auth'
import { useAuth } from './hooks/useAuth'

function App() {
  const { token, user, signIn, signOut } = useAuth()
  const [displayName, setDisplayName] = useState<string | null>(user?.displayName ?? null)
  const loadingUser = Boolean(token) && !displayName

  useEffect(() => {
    if (!token || displayName) {
      return
    }
    let cancelled = false
    fetchMe(token)
      .then((me) => {
        if (!cancelled) {
          setDisplayName(me.displayName)
        }
      })
      .catch(() => {
        if (!cancelled) {
          signOut()
        }
      })
    return () => {
      cancelled = true
    }
  }, [token, displayName, signOut])

  async function handleLogout() {
    if (token) {
      await logout(token).catch(() => undefined)
    }
    signOut()
    setDisplayName(null)
  }

  if (!token) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg text-text">
        <AuthForm
          onLoggedIn={(newToken, newUser) => {
            signIn(newToken, newUser)
            setDisplayName(newUser.displayName)
          }}
        />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-4 bg-bg text-text">
      {loadingUser ? (
        <p className="text-text-muted">読み込み中...</p>
      ) : (
        <p className="text-2xl font-semibold">Hello, {displayName ?? user?.displayName}</p>
      )}
      <button
        type="button"
        onClick={handleLogout}
        className="rounded bg-accent px-3 py-2 text-white hover:bg-accent-hover"
      >
        ログアウト
      </button>
    </div>
  )
}

export default App
