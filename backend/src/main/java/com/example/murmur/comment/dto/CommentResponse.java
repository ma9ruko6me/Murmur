package com.example.murmur.comment.dto;

import com.example.murmur.comment.Comment;
import java.time.LocalDateTime;

public record CommentResponse(
        Long id,
        Long postId,
        Long userId,
        String username,
        String displayName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt,
        boolean deleted,
        ReplyToSummary replyTo) {

    public static CommentResponse from(Comment comment) {
        ReplyToSummary replyTo = comment.getParentCommentId() != null
                ? new ReplyToSummary(
                        comment.getReplyToCommentId(),
                        comment.getReplyToUserId(),
                        comment.getReplyToUsername(),
                        comment.getReplyToDisplayName(),
                        comment.isReplyToDeleted())
                : null;
        return new CommentResponse(
                comment.getId(),
                comment.getPostId(),
                comment.getUserId(),
                comment.getUsername(),
                comment.getDisplayName(),
                comment.getContent(),
                comment.getCreatedAt(),
                comment.getUpdatedAt(),
                comment.isDeleted(),
                replyTo);
    }
}
