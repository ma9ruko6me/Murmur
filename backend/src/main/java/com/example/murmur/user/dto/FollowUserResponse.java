package com.example.murmur.user.dto;

import com.example.murmur.user.FollowUser;

public record FollowUserResponse(
        Long id, String username, String displayName, String bio, String avatarUrl, boolean followedByMe) {

    public static FollowUserResponse from(FollowUser user) {
        return new FollowUserResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.isFollowedByMe());
    }
}
