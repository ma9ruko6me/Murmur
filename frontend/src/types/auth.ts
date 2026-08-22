export interface AuthUser {
  id: number
  username: string
  displayName: string
  email: string
}

export interface LoginResponse {
  token: string
  tokenType: string
  expiresInSeconds: number
  user: AuthUser
}
