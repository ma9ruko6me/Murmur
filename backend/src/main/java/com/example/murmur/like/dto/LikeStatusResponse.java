package com.example.murmur.like.dto;

import com.example.murmur.like.LikeStatus;

public record LikeStatusResponse(long likeCount, boolean likedByMe) {

    public static LikeStatusResponse from(LikeStatus status) {
        return new LikeStatusResponse(status.likeCount(), status.likedByMe());
    }
}
