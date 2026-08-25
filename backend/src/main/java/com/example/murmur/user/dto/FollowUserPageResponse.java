package com.example.murmur.user.dto;

import java.util.List;

public record FollowUserPageResponse(List<FollowUserResponse> items, String nextCursor) {
}
