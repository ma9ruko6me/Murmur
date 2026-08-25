package com.example.murmur.user;

import com.example.murmur.user.dto.FollowStatusResponse;
import com.example.murmur.user.dto.FollowUserPageResponse;
import com.example.murmur.user.dto.FollowUserResponse;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/{id}")
public class FollowController {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final FollowService followService;

    public FollowController(FollowService followService) {
        this.followService = followService;
    }

    @PostMapping("/follow")
    public FollowStatusResponse follow(@PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return FollowStatusResponse.from(followService.follow(id, userId));
    }

    @DeleteMapping("/follow")
    public FollowStatusResponse unfollow(@PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return FollowStatusResponse.from(followService.unfollow(id, userId));
    }

    @GetMapping("/followers")
    public FollowUserPageResponse followers(
            @PathVariable Long id,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        return page(id, cursor, limit, authentication, followService::findFollowers);
    }

    @GetMapping("/following")
    public FollowUserPageResponse following(
            @PathVariable Long id,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        return page(id, cursor, limit, authentication, followService::findFollowing);
    }

    private FollowUserPageResponse page(
            Long id, String cursor, Integer limit, Authentication authentication, PageFetcher fetcher) {
        Long currentUserId = (Long) authentication.getPrincipal();
        int pageSize = clamp(limit);
        Cursor decoded = cursor != null ? decodeCursor(cursor) : null;
        List<FollowUser> rows = fetcher.fetch(
                id,
                currentUserId,
                decoded != null ? decoded.createdAt() : null,
                decoded != null ? decoded.followId() : null,
                pageSize + 1);
        boolean hasMore = rows.size() > pageSize;
        List<FollowUser> page = hasMore ? rows.subList(0, pageSize) : rows;
        String nextCursor = hasMore ? encodeCursor(page.get(page.size() - 1)) : null;
        return new FollowUserPageResponse(
                page.stream().map(FollowUserResponse::from).toList(), nextCursor);
    }

    private int clamp(Integer requested) {
        if (requested == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(requested, MAX_LIMIT));
    }

    private String encodeCursor(FollowUser user) {
        long epochMillis =
                user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        String raw = epochMillis + ":" + user.getFollowId();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private Cursor decodeCursor(String cursor) {
        String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
        String[] parts = raw.split(":", 2);
        LocalDateTime createdAt = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(Long.parseLong(parts[0])), ZoneId.systemDefault());
        return new Cursor(createdAt, Long.parseLong(parts[1]));
    }

    private record Cursor(LocalDateTime createdAt, Long followId) {
    }

    @FunctionalInterface
    private interface PageFetcher {
        List<FollowUser> fetch(
                Long userId, Long currentUserId, LocalDateTime cursorCreatedAt, Long cursorId, int limit);
    }
}
