package com.example.murmur.comment.dto;

public record ReplyToSummary(Long commentId, Long userId, String username, String displayName, boolean deleted) {
}
