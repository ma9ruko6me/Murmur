package com.example.murmur.post.exception;

public class PostForbiddenException extends RuntimeException {

    public PostForbiddenException(String message) {
        super(message);
    }
}
