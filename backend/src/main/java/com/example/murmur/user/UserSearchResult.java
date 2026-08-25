package com.example.murmur.user;

import java.time.LocalDateTime;
import lombok.Data;

@Data
public class UserSearchResult {

    private Long id;
    private String username;
    private String displayName;
    private String bio;
    private String avatarUrl;
    private LocalDateTime createdAt;
    private boolean followedByMe;
}
