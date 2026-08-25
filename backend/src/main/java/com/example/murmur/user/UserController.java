package com.example.murmur.user;

import com.example.murmur.auth.dto.UserResponse;
import com.example.murmur.user.dto.UpdateProfileRequest;
import com.example.murmur.user.dto.UserProfileResponse;
import com.example.murmur.user.dto.UserSearchResultPageResponse;
import com.example.murmur.user.dto.UserSearchResultResponse;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        User user = userService.getById(userId);
        return UserResponse.from(user);
    }

    @GetMapping("/{username}")
    public UserProfileResponse getProfile(@PathVariable String username, Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        return userService.getProfileByUsername(username, currentUserId);
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(
            @Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return userService.updateProfile(userId, request.displayName(), request.bio());
    }

    @GetMapping("/search")
    public UserSearchResultPageResponse search(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String cursor,
            @RequestParam(required = false) Integer limit,
            Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        int pageSize = clamp(limit);
        Cursor decoded = cursor != null ? decodeCursor(cursor) : null;
        List<UserSearchResult> rows = userService.search(
                q,
                currentUserId,
                decoded != null ? decoded.createdAt() : null,
                decoded != null ? decoded.id() : null,
                pageSize + 1);
        boolean hasMore = rows.size() > pageSize;
        List<UserSearchResult> page = hasMore ? rows.subList(0, pageSize) : rows;
        String nextCursor = hasMore ? encodeCursor(page.get(page.size() - 1)) : null;
        return new UserSearchResultPageResponse(
                page.stream().map(UserSearchResultResponse::from).toList(), nextCursor);
    }

    private int clamp(Integer requested) {
        if (requested == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(requested, MAX_LIMIT));
    }

    private String encodeCursor(UserSearchResult user) {
        long epochMillis =
                user.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        String raw = epochMillis + ":" + user.getId();
        return Base64.getUrlEncoder().withoutPadding().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    private Cursor decodeCursor(String cursor) {
        String raw = new String(Base64.getUrlDecoder().decode(cursor), StandardCharsets.UTF_8);
        String[] parts = raw.split(":", 2);
        LocalDateTime createdAt = LocalDateTime.ofInstant(
                Instant.ofEpochMilli(Long.parseLong(parts[0])), ZoneId.systemDefault());
        return new Cursor(createdAt, Long.parseLong(parts[1]));
    }

    private record Cursor(LocalDateTime createdAt, Long id) {
    }
}
