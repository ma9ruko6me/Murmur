import { useState } from 'react'
import { LoginPage } from './components/LoginPage'
import { SignupPage } from './components/SignupPage'
import { WelcomePage } from './components/WelcomePage'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, status, signIn, signOut } = useAuth()
  const [authView, setAuthView] = useState<'login' | 'signup'>('login')

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg text-text-muted">
        読み込み中...
      </div>
    )
  }

  if (status === 'authenticated' && user) {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg text-text">
        <WelcomePage user={user} onLogout={signOut} />
      </div>
    )
  }

  return (
    <div className="flex min-h-svh items-center justify-center bg-bg text-text">
      {authView === 'login' ? (
        <LoginPage onLoggedIn={signIn} onSwitchToSignup={() => setAuthView('signup')} />
      ) : (
        <SignupPage onLoggedIn={signIn} onSwitchToLogin={() => setAuthView('login')} />
      )}
    </div>
  )
}

export default App
