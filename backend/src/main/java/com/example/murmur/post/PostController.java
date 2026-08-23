package com.example.murmur.post;

import com.example.murmur.post.dto.CreatePostRequest;
import com.example.murmur.post.dto.PostPageResponse;
import com.example.murmur.post.dto.PostResponse;
import com.example.murmur.post.dto.UpdatePostRequest;
import com.example.murmur.post.exception.PostForbiddenException;
import com.example.murmur.post.exception.PostNotFoundException;
import jakarta.validation.Valid;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Base64;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/posts")
public class PostController {

    private static final int DEFAULT_LIMIT = 20;
    private static final int MAX_LIMIT = 50;
    private static final String NOT_FOUND_MESSAGE = "投稿が見つかりません";
    private static final String FORBIDDEN_MESSAGE = "この投稿を編集・削除する権限がありません";

    private final PostMapper postMapper;

    public PostController(PostMapper postMapper) {
        this.postMapper = postMapper;
    }

    @GetMapping
    public PostPageResponse list(
            @RequestParam(required = false) String cursor, @RequestParam(required = false) Integer limit) {
        int pageSize = clamp(limit);
        Cursor decoded = cursor != null ? decodeCursor(cursor) : null;
        List<Post> rows = postMapper.findPage(
                decoded != null ? decoded.createdAt() : null,
                decoded != null ? decoded.id() : null,
                pageSize + 1);
        boolean hasMore = rows.size() > pageSize;
        List<Post> page = hasMore ? rows.subList(0, pageSize) : rows;
        String nextCursor = hasMore ? encodeCursor(page.get(page.size() - 1)) : null;
        return new PostPageResponse(page.stream().map(PostResponse::from).toList(), nextCursor);
    }

    @GetMapping("/new-count")
    public Map<String, Long> newCount(@RequestParam Long after) {
        return Map.of("count", postMapper.countNewerThan(after));
    }

    @PostMapping
    public ResponseEntity<PostResponse> create(
            @Valid @RequestBody CreatePostRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Post post = new Post();
        post.setUserId(userId);
        post.setContent(request.content());
        postMapper.insert(post);
        Post saved = postMapper.findById(post.getId()).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED).body(PostResponse.from(saved));
    }

    @PutMapping("/{id}")
    public PostResponse update(
            @PathVariable Long id, @Valid @RequestBody UpdatePostRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Post existing = requireOwnedPost(id, userId);
        postMapper.update(existing.getId(), request.content());
        return PostResponse.from(postMapper.findById(id).orElseThrow());
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        requireOwnedPost(id, userId);
        postMapper.delete(id, userId);
        return ResponseEntity.noContent().build();
    }

    private Post requireOwnedPost(Long id, Long userId) {
        Post existing = postMapper.findById(id).orElseThrow(() -> new PostNotFoundException(NOT_FOUND_MESSAGE));
        if (!existing.getUserId().equals(userId)) {
            throw new PostForbiddenException(FORBIDDEN_MESSAGE);
        }
        return existing;
    }

    private int clamp(Integer requested) {
        if (requested == null) {
            return DEFAULT_LIMIT;
        }
        return Math.max(1, Math.min(requested, MAX_LIMIT));
    }

    private String encodeCursor(Post post) {
        long epochMillis =
                post.getCreatedAt().atZone(ZoneId.systemDefault()).toInstant().toEpochMilli();
        String raw = epochMillis + ":" + post.getId();
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
