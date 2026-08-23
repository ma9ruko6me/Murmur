export interface Post {
  id: number
  userId: number
  username: string
  displayName: string
  content: string
  createdAt: string
  updatedAt: string
}

export interface PostPage {
  items: Post[]
  nextCursor: string | null
}
