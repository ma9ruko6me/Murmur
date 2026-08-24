import type { Comment } from '../types/comment'
import { CommentItem } from './CommentItem'

interface CommentListProps {
  comments: Comment[]
  currentUserId: number
  onReply: (comment: Comment) => void
  onSaveEdit: (id: number, content: string) => Promise<void>
  onDeleteRequest: (id: number) => void
}

export function CommentList({ comments, currentUserId, onReply, onSaveEdit, onDeleteRequest }: CommentListProps) {
  return (
    <ul className="flex flex-col gap-3">
      {comments.map((comment) => (
        <CommentItem
          key={comment.id}
          comment={comment}
          currentUserId={currentUserId}
          onReply={onReply}
          onSaveEdit={onSaveEdit}
          onDeleteRequest={onDeleteRequest}
        />
      ))}
    </ul>
  )
}
