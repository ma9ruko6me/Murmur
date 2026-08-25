package com.example.murmur.user;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    Optional<User> findByEmail(String email);

    Optional<User> findByUsername(String username);

    Optional<User> findById(Long id);

    void insert(User user);

    void updateProfile(@Param("id") Long id, @Param("displayName") String displayName, @Param("bio") String bio);

    long countPostsByUserId(Long userId);

    List<UserSearchResult> search(
            @Param("q") String q,
            @Param("currentUserId") Long currentUserId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            @Param("limit") int limit);
}
