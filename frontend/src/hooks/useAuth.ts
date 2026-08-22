import axios from 'axios'
import { useCallback, useEffect, useState } from 'react'
import type { AuthUser } from '../types/auth'
import { fetchMe, refresh } from '../api/auth'
import { setAccessToken, setOnAuthFailure } from '../api/client'

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated'

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [status, setStatus] = useState<AuthStatus>('loading')

  const signOut = useCallback(() => {
    setAccessToken(null)
    setUser(null)
    setStatus('unauthenticated')
  }, [])

  const signIn = useCallback((token: string, newUser: AuthUser) => {
    setAccessToken(token)
    setUser(newUser)
    setStatus('authenticated')
  }, [])

  useEffect(() => {
    setOnAuthFailure(signOut)
    return () => setOnAuthFailure(null)
  }, [signOut])

  useEffect(() => {
    // React StrictMode invokes this effect twice in development. The refresh
    // endpoint rotates the refresh token on every call, so a stale duplicate
    // request would race against the real one and get rejected with 401.
    // Aborting the first invocation's request (rather than merely ignoring
    // its result) prevents that request from ever reaching the server.
    const controller = new AbortController()

    refresh({ signal: controller.signal })
      .then(({ token }) => {
        setAccessToken(token)
        return fetchMe()
      })
      .then((me) => {
        setUser(me)
        setStatus('authenticated')
      })
      .catch((error) => {
        if (axios.isCancel(error) || controller.signal.aborted) {
          return
        }
        setAccessToken(null)
        setStatus('unauthenticated')
      })

    return () => {
      controller.abort()
    }
  }, [])

  return { user, status, signIn, signOut }
}
