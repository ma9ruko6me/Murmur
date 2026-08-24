export interface ReplyToSummary {
  commentId: number
  userId: number
  username: string
  displayName: string
  deleted: boolean
}

export interface Comment {
  id: number
  postId: number
  userId: number
  username: string
  displayName: string
  content: string | null
  createdAt: string
  updatedAt: string
  deleted: boolean
  replyTo: ReplyToSummary | null
}
