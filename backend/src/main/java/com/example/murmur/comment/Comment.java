package com.example.murmur.comment;

import java.time.LocalDateTime;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class Comment {

    private Long id;
    private Long postId;
    private Long userId;
    private Long parentCommentId;
    private String content;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private boolean deleted;
    private String username;
    private String displayName;
    private Long replyToCommentId;
    private Long replyToUserId;
    private String replyToUsername;
    private String replyToDisplayName;
    private boolean replyToDeleted;
}
