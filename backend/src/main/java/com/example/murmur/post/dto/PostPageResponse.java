package com.example.murmur.post.dto;

import java.util.List;

public record PostPageResponse(List<PostResponse> items, String nextCursor) {
}
