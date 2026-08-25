package com.example.murmur.user.dto;

import java.util.List;

public record UserSearchResultPageResponse(List<UserSearchResultResponse> items, String nextCursor) {
}
