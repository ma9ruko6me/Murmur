package com.example.murmur.like;

import com.example.murmur.post.Post;
import com.example.murmur.post.PostService;
import org.springframework.stereotype.Service;

@Service
public class LikeService {

    private final LikeMapper likeMapper;
    private final PostService postService;

    public LikeService(LikeMapper likeMapper, PostService postService) {
        this.likeMapper = likeMapper;
        this.postService = postService;
    }

    public LikeStatus like(Long postId, Long userId) {
        postService.getByIdForUser(postId, userId);
        likeMapper.insertIfAbsent(postId, userId);
        return currentStatus(postId, userId);
    }

    public LikeStatus unlike(Long postId, Long userId) {
        postService.getByIdForUser(postId, userId);
        likeMapper.delete(postId, userId);
        return currentStatus(postId, userId);
    }

    private LikeStatus currentStatus(Long postId, Long userId) {
        Post post = postService.getByIdForUser(postId, userId);
        return new LikeStatus(post.getLikeCount(), post.isLikedByMe());
    }
}
