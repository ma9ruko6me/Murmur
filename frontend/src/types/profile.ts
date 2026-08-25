export interface UserProfile {
  id: number
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  postCount: number
  own: boolean
}
