export interface UserProfile {
  id: number
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  postCount: number
  own: boolean
  followerCount: number
  followingCount: number
  followedByMe: boolean
}
