package com.example.murmur.post;

import com.example.murmur.post.exception.PostForbiddenException;
import com.example.murmur.post.exception.PostNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class PostService {

    private static final String NOT_FOUND_MESSAGE = "投稿が見つかりません";
    private static final String FORBIDDEN_MESSAGE = "この投稿を編集・削除する権限がありません";

    private final PostMapper postMapper;

    public PostService(PostMapper postMapper) {
        this.postMapper = postMapper;
    }

    public List<Post> findPage(LocalDateTime cursorCreatedAt, Long cursorId, int limit) {
        return postMapper.findPage(cursorCreatedAt, cursorId, limit);
    }

    public long countNewerThan(Long afterId) {
        return postMapper.countNewerThan(afterId);
    }

    public Post create(Long userId, String content) {
        Post post = new Post();
        post.setUserId(userId);
        post.setContent(content);
        postMapper.insert(post);
        return getById(post.getId());
    }

    public Post update(Long id, Long userId, String content) {
        requireOwnedPost(id, userId);
        postMapper.update(id, content);
        return getById(id);
    }

    public void delete(Long id, Long userId) {
        requireOwnedPost(id, userId);
        postMapper.delete(id, userId);
    }

    public Post getById(Long id) {
        return postMapper.findById(id).orElseThrow(() -> new PostNotFoundException(NOT_FOUND_MESSAGE));
    }

    private Post requireOwnedPost(Long id, Long userId) {
        Post existing = getById(id);
        if (!existing.getUserId().equals(userId)) {
            throw new PostForbiddenException(FORBIDDEN_MESSAGE);
        }
        return existing;
    }
}
