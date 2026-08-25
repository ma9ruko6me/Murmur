package com.example.murmur.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record UpdateProfileRequest(
        @NotBlank(message = "表示名を入力してください")
                @Size(max = 50, message = "表示名は50文字以内で入力してください")
                String displayName,
        @Size(max = 160, message = "自己紹介は160文字以内で入力してください") String bio) {
}
