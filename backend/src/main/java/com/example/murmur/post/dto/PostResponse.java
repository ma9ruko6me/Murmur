package com.example.murmur.post.dto;

import com.example.murmur.post.Post;
import java.time.LocalDateTime;

public record PostResponse(
        Long id,
        Long userId,
        String username,
        String displayName,
        String content,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {

    public static PostResponse from(Post post) {
        return new PostResponse(
                post.getId(),
                post.getUserId(),
                post.getUsername(),
                post.getDisplayName(),
                post.getContent(),
                post.getCreatedAt(),
                post.getUpdatedAt());
    }
}
