export interface FollowStatus {
  followerCount: number
  followedByMe: boolean
}

export interface FollowUser {
  id: number
  username: string
  displayName: string
  bio: string | null
  avatarUrl: string | null
  followedByMe: boolean
}

export interface FollowUserPage {
  items: FollowUser[]
  nextCursor: string | null
}
