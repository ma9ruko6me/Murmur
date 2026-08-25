package com.example.murmur.user.dto;

import com.example.murmur.user.User;

public record UserProfileResponse(
        Long id,
        String username,
        String displayName,
        String bio,
        String avatarUrl,
        long postCount,
        boolean own,
        long followerCount,
        long followingCount,
        boolean followedByMe) {

    public static UserProfileResponse from(
            User user, long postCount, boolean own, long followerCount, long followingCount, boolean followedByMe) {
        return new UserProfileResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                postCount,
                own,
                followerCount,
                followingCount,
                followedByMe);
    }
}
