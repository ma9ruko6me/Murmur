package com.example.murmur.comment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCommentRequest(
        @NotBlank(message = "コメント内容を入力してください")
                @Size(max = 280, message = "コメントは280文字以内で入力してください")
                String content,
        Long parentCommentId) {
}
