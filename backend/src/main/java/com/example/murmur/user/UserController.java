package com.example.murmur.user;

import com.example.murmur.auth.dto.UserResponse;
import com.example.murmur.user.dto.UpdateProfileRequest;
import com.example.murmur.user.dto.UserProfileResponse;
import jakarta.validation.Valid;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/me")
    public UserResponse me(Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        User user = userService.getById(userId);
        return UserResponse.from(user);
    }

    @GetMapping("/{username}")
    public UserProfileResponse getProfile(@PathVariable String username, Authentication authentication) {
        Long currentUserId = (Long) authentication.getPrincipal();
        return userService.getProfileByUsername(username, currentUserId);
    }

    @PutMapping("/me")
    public UserProfileResponse updateProfile(
            @Valid @RequestBody UpdateProfileRequest request, Authentication authentication) {
        Long userId = (Long) authentication.getPrincipal();
        return userService.updateProfile(userId, request.displayName(), request.bio());
    }
}
