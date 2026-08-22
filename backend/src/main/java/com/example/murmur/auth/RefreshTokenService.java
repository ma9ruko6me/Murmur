package com.example.murmur.auth;

import com.example.murmur.auth.exception.InvalidRefreshTokenException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

/**
 * Issues, rotates and revokes opaque refresh tokens. Unlike the access token (a self-contained
 * JWT), refresh tokens are random UUIDs persisted (hashed) in {@code refresh_tokens} so they can
 * be revoked on demand (logout, rotation).
 */
@Service
public class RefreshTokenService {

    private final RefreshTokenMapper refreshTokenMapper;
    private final long expirationMs;

    public RefreshTokenService(
            RefreshTokenMapper refreshTokenMapper,
            @Value("${refresh-token.expiration-ms}") long expirationMs) {
        this.refreshTokenMapper = refreshTokenMapper;
        this.expirationMs = expirationMs;
    }

    public long getExpirationSeconds() {
        return expirationMs / 1000;
    }

    public String issue(Long userId) {
        String rawToken = UUID.randomUUID().toString();

        RefreshToken refreshToken = new RefreshToken();
        refreshToken.setUserId(userId);
        refreshToken.setTokenHash(hash(rawToken));
        refreshToken.setExpiresAt(LocalDateTime.now().plusNanos(expirationMs * 1_000_000));
        refreshTokenMapper.insert(refreshToken);

        return rawToken;
    }

    public record RotateResult(Long userId, String rawToken) {
    }

    public RotateResult rotate(String rawToken) {
        RefreshToken existing = refreshTokenMapper
                .findByTokenHash(hash(rawToken))
                .filter(t -> t.getRevokedAt() == null)
                .filter(t -> t.getExpiresAt().isAfter(LocalDateTime.now()))
                .orElseThrow(() -> new InvalidRefreshTokenException("invalid or expired refresh token"));

        refreshTokenMapper.revokeById(existing.getId());
        String newRawToken = issue(existing.getUserId());
        return new RotateResult(existing.getUserId(), newRawToken);
    }

    public void revoke(String rawToken) {
        refreshTokenMapper.findByTokenHash(hash(rawToken)).ifPresent(t -> refreshTokenMapper.revokeById(t.getId()));
    }

    private static String hash(String rawToken) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] bytes = digest.digest(rawToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(bytes);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is not available", e);
        }
    }
}
