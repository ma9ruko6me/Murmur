package com.example.murmur.post.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreatePostRequest(
        @NotBlank(message = "投稿内容を入力してください")
                @Size(max = 280, message = "投稿は280文字以内で入力してください")
                String content) {
}
