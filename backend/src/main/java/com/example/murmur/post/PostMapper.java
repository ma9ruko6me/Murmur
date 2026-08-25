package com.example.murmur.post;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface PostMapper {

    Optional<Post> findById(@Param("id") Long id, @Param("currentUserId") Long currentUserId);

    List<Post> findPage(
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            @Param("limit") int limit,
            @Param("currentUserId") Long currentUserId,
            @Param("authorId") Long authorId);

    long countNewerThan(@Param("afterId") Long afterId);

    void insert(Post post);

    void update(@Param("id") Long id, @Param("content") String content);

    int delete(@Param("id") Long id, @Param("userId") Long userId);
}
