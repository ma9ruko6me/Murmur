import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'

interface RequireAuthProps {
  authenticated: boolean
  children: ReactNode
}

export function RequireAuth({ authenticated, children }: RequireAuthProps) {
  if (!authenticated) {
    return <Navigate to="/login" replace />
  }
  return <>{children}</>
}
