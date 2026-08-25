package com.example.murmur.user.dto;

import com.example.murmur.user.UserSearchResult;

public record UserSearchResultResponse(
        Long id, String username, String displayName, String bio, String avatarUrl, boolean followedByMe) {

    public static UserSearchResultResponse from(UserSearchResult user) {
        return new UserSearchResultResponse(
                user.getId(),
                user.getUsername(),
                user.getDisplayName(),
                user.getBio(),
                user.getAvatarUrl(),
                user.isFollowedByMe());
    }
}
