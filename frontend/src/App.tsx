import { Navigate, Route, Routes, useNavigate } from 'react-router-dom'
import { LoginPage } from './components/LoginPage'
import { SignupPage } from './components/SignupPage'
import { Timeline } from './components/Timeline'
import { PostDetailPage } from './components/PostDetailPage'
import { ProfilePage } from './components/ProfilePage'
import { RequireAuth } from './components/RequireAuth'
import { useAuth } from './hooks/useAuth'

function App() {
  const { user, status, signIn, signOut } = useAuth()
  const navigate = useNavigate()

  if (status === 'loading') {
    return (
      <div className="flex min-h-svh items-center justify-center bg-bg text-text-muted">
        読み込み中...
      </div>
    )
  }

  const authenticated = status === 'authenticated' && user != null

  return (
    <Routes>
      <Route
        path="/login"
        element={
          authenticated ? (
            <Navigate to="/" replace />
          ) : (
            <div className="flex min-h-svh items-center justify-center bg-bg text-text">
              <LoginPage onLoggedIn={signIn} onSwitchToSignup={() => navigate('/signup')} />
            </div>
          )
        }
      />
      <Route
        path="/signup"
        element={
          authenticated ? (
            <Navigate to="/" replace />
          ) : (
            <div className="flex min-h-svh items-center justify-center bg-bg text-text">
              <SignupPage onLoggedIn={signIn} onSwitchToLogin={() => navigate('/login')} />
            </div>
          )
        }
      />
      <Route
        path="/"
        element={
          <RequireAuth authenticated={authenticated}>
            {user && <Timeline currentUser={user} onLogout={signOut} />}
          </RequireAuth>
        }
      />
      <Route
        path="/posts/:postId"
        element={
          <RequireAuth authenticated={authenticated}>
            {user && <PostDetailPage currentUser={user} />}
          </RequireAuth>
        }
      />
      <Route
        path="/users/:username"
        element={
          <RequireAuth authenticated={authenticated}>
            {user && <ProfilePage currentUser={user} />}
          </RequireAuth>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default App
