package com.example.murmur.auth.dto;

import com.example.murmur.user.User;
import java.time.LocalDateTime;

public record SignupResponse(
        Long id, String username, String displayName, String email, LocalDateTime createdAt) {

    public static SignupResponse from(User user) {
        return new SignupResponse(
                user.getId(), user.getUsername(), user.getDisplayName(), user.getEmail(), user.getCreatedAt());
    }
}
