package com.example.murmur.user.dto;

import com.example.murmur.user.FollowStatus;

public record FollowStatusResponse(long followerCount, boolean followedByMe) {

    public static FollowStatusResponse from(FollowStatus status) {
        return new FollowStatusResponse(status.followerCount(), status.followedByMe());
    }
}
