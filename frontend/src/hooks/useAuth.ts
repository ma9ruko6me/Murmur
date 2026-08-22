import { useCallback, useState } from 'react'
import type { AuthUser } from '../types/auth'

const TOKEN_STORAGE_KEY = 'murmur_token'

export function useAuth() {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(TOKEN_STORAGE_KEY))
  const [user, setUser] = useState<AuthUser | null>(null)

  const signIn = useCallback((newToken: string, newUser: AuthUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  const signOut = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY)
    setToken(null)
    setUser(null)
  }, [])

  return { token, user, signIn, signOut }
}
