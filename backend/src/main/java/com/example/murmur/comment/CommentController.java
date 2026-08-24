package com.example.murmur.comment;

import com.example.murmur.comment.dto.CommentResponse;
import com.example.murmur.comment.dto.CreateCommentRequest;
import com.example.murmur.comment.dto.UpdateCommentRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/api/posts/{postId}/comments")
    public List<CommentResponse> list(@PathVariable Long postId, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return commentService.findByPostId(postId, userId).stream()
                .map(CommentResponse::from)
                .toList();
    }

    @PostMapping("/api/posts/{postId}/comments")
    public ResponseEntity<CommentResponse> create(
            @PathVariable Long postId,
            @Valid @RequestBody CreateCommentRequest request,
            Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Comment saved = commentService.create(postId, userId, request.content(), request.parentCommentId());
        return ResponseEntity.status(HttpStatus.CREATED).body(CommentResponse.from(saved));
    }

    @PutMapping("/api/comments/{id}")
    public CommentResponse update(
            @PathVariable Long id, @Valid @RequestBody UpdateCommentRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        Comment updated = commentService.update(id, userId, request.content());
        return CommentResponse.from(updated);
    }

    @DeleteMapping("/api/comments/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        commentService.delete(id, userId);
        return ResponseEntity.noContent().build();
    }
}
