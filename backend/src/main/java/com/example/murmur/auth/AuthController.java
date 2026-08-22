package com.example.murmur.auth;

import com.example.murmur.auth.dto.LoginRequest;
import com.example.murmur.auth.dto.LoginResponse;
import com.example.murmur.auth.dto.SignupRequest;
import com.example.murmur.auth.dto.SignupResponse;
import com.example.murmur.auth.dto.UserResponse;
import com.example.murmur.auth.exception.DuplicateUserException;
import com.example.murmur.auth.exception.InvalidCredentialsException;
import com.example.murmur.user.User;
import com.example.murmur.user.UserMapper;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthController(UserMapper userMapper, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.userMapper = userMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
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
        LoginResponse response = new LoginResponse(
                token, "Bearer", jwtService.getExpirationSeconds(), UserResponse.from(user));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<Map<String, String>> logout() {
        // Stateless JWT: nothing to invalidate server-side. The client discards the token.
        return ResponseEntity.ok(Map.of("message", "logged out"));
    }
}
