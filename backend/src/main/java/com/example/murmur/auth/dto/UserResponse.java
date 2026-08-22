package com.example.murmur.auth.dto;

import com.example.murmur.user.User;

public record UserResponse(Long id, String username, String displayName, String email) {

    public static UserResponse from(User user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getEmail());
    }
}
