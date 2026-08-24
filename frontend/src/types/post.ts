export interface Post {
  id: number
  userId: number
  username: string
  displayName: string
  content: string
  createdAt: string
  updatedAt: string
  likeCount: number
  likedByMe: boolean
  commentCount: number
}

export interface PostPage {
  items: Post[]
  nextCursor: string | null
}

export interface LikeStatus {
  likeCount: number
  likedByMe: boolean
}
