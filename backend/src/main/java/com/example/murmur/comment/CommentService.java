package com.example.murmur.comment;

import com.example.murmur.comment.exception.CommentForbiddenException;
import com.example.murmur.comment.exception.CommentNotFoundException;
import com.example.murmur.post.PostService;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class CommentService {

    private static final String NOT_FOUND_MESSAGE = "コメントが見つかりません";
    private static final String FORBIDDEN_MESSAGE = "このコメントを編集・削除する権限がありません";

    private final CommentMapper commentMapper;
    private final PostService postService;

    public CommentService(CommentMapper commentMapper, PostService postService) {
        this.commentMapper = commentMapper;
        this.postService = postService;
    }

    public List<Comment> findByPostId(Long postId, Long currentUserId) {
        postService.getByIdForUser(postId, currentUserId);
        return commentMapper.findByPostId(postId);
    }

    public Comment create(Long postId, Long userId, String content, Long parentCommentId) {
        postService.getByIdForUser(postId, userId);
        if (parentCommentId != null) {
            requireReplyTargetInPost(parentCommentId, postId);
        }

        Comment comment = new Comment();
        comment.setPostId(postId);
        comment.setUserId(userId);
        comment.setContent(content);
        comment.setParentCommentId(parentCommentId);
        commentMapper.insert(comment);
        return getById(comment.getId());
    }

    public Comment update(Long id, Long userId, String content) {
        requireOwnedComment(id, userId);
        commentMapper.update(id, content);
        return getById(id);
    }

    public void delete(Long id, Long userId) {
        requireOwnedComment(id, userId);
        commentMapper.softDelete(id, userId);
    }

    public Comment getById(Long id) {
        return commentMapper.findById(id).orElseThrow(() -> new CommentNotFoundException(NOT_FOUND_MESSAGE));
    }

    private void requireReplyTargetInPost(Long parentCommentId, Long postId) {
        Comment parent = getById(parentCommentId);
        if (!parent.getPostId().equals(postId)) {
            throw new CommentNotFoundException(NOT_FOUND_MESSAGE);
        }
    }

    private Comment requireOwnedComment(Long id, Long userId) {
        Comment existing = getById(id);
        if (existing.isDeleted()) {
            throw new CommentNotFoundException(NOT_FOUND_MESSAGE);
        }
        if (!existing.getUserId().equals(userId)) {
            throw new CommentForbiddenException(FORBIDDEN_MESSAGE);
        }
        return existing;
    }
}
