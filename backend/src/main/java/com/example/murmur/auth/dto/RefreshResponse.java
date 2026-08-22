package com.example.murmur.auth.dto;

public record RefreshResponse(String token, String tokenType, long expiresInSeconds) {
}
