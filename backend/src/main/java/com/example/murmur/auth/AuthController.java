package com.example.murmur.auth;

import com.example.murmur.auth.dto.LoginRequest;
import com.example.murmur.auth.dto.LoginResponse;
import com.example.murmur.auth.dto.RefreshResponse;
import com.example.murmur.auth.dto.SignupRequest;
import com.example.murmur.auth.dto.SignupResponse;
import com.example.murmur.auth.dto.UserResponse;
import com.example.murmur.auth.exception.DuplicateUserException;
import com.example.murmur.auth.exception.InvalidCredentialsException;
import com.example.murmur.auth.exception.InvalidRefreshTokenException;
import com.example.murmur.user.User;
import com.example.murmur.user.UserMapper;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final String REFRESH_TOKEN_COOKIE_NAME = "refresh_token";
    private static final String REFRESH_TOKEN_COOKIE_PATH = "/api/auth";

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final RefreshTokenService refreshTokenService;
    private final boolean cookieSecure;

    public AuthController(
            UserMapper userMapper,
            PasswordEncoder passwordEncoder,
            JwtService jwtService,
            RefreshTokenService refreshTokenService,
            @Value("${cookie.secure}") boolean cookieSecure) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.refreshTokenService = refreshTokenService;
        this.cookieSecure = cookieSecure;
    }

    @PostMapping("/signup")
    public ResponseEntity<SignupResponse> signup(@Valid @RequestBody SignupRequest request) {
        if (userMapper.findByUsername(request.username()).isPresent()) {
            throw new DuplicateUserException("username is already taken");
        }
        if (userMapper.findByEmail(request.email()).isPresent()) {
            throw new DuplicateUserException("email is already registered");
        }

        User user = new User();
        user.setUsername(request.username());
        user.setDisplayName(request.displayName());
        user.setEmail(request.email());
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        userMapper.insert(user);

        User saved = userMapper.findById(user.getId()).orElseThrow();
        return ResponseEntity.status(HttpStatus.CREATED).body(SignupResponse.from(saved));
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userMapper
                .findByEmail(request.email())
                .filter(u -> passwordEncoder.matches(request.password(), u.getPasswordHash()))
                .orElseThrow(() -> new InvalidCredentialsException("invalid email or password"));

        String token = jwtService.issueToken(user.getId(), user.getUsername());
        String refreshToken = refreshTokenService.issue(user.getId());
        LoginResponse response = new LoginResponse(
                token, "Bearer", jwtService.getExpirationSeconds(), UserResponse.from(user));
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie(refreshToken).toString())
                .body(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<RefreshResponse> refresh(
            @CookieValue(name = REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshTokenCookie) {
        if (refreshTokenCookie == null) {
            throw new InvalidRefreshTokenException("invalid or expired refresh token");
        }

        RefreshTokenService.RotateResult rotated = refreshTokenService.rotate(refreshTokenCookie);
        User user = userMapper.findById(rotated.userId()).orElseThrow();
        String token = jwtService.issueToken(user.getId(), user.getUsername());
        RefreshResponse response = new RefreshResponse(token, "Bearer", jwtService.getExpirationSeconds());
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshTokenCookie(rotated.rawToken()).toString())
                .body(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout(
            @CookieValue(name = REFRESH_TOKEN_COOKIE_NAME, required = false) String refreshTokenCookie) {
        if (refreshTokenCookie != null) {
            refreshTokenService.revoke(refreshTokenCookie);
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, expiredRefreshTokenCookie().toString())
                .body(Map.of("message", "logged out"));
    }

    private ResponseCookie refreshTokenCookie(String rawToken) {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, rawToken)
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path(REFRESH_TOKEN_COOKIE_PATH)
                .maxAge(refreshTokenService.getExpirationSeconds())
                .build();
    }

    private ResponseCookie expiredRefreshTokenCookie() {
        return ResponseCookie.from(REFRESH_TOKEN_COOKIE_NAME, "")
                .httpOnly(true)
                .secure(cookieSecure)
                .sameSite("Lax")
                .path(REFRESH_TOKEN_COOKIE_PATH)
                .maxAge(0)
                .build();
    }
}
