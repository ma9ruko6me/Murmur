package com.example.murmur.user;

import java.time.LocalDateTime;
import java.util.List;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface FollowMapper {

    int insertIfAbsent(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    int delete(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    boolean exists(@Param("followerId") Long followerId, @Param("followeeId") Long followeeId);

    long countFollowers(@Param("userId") Long userId);

    long countFollowing(@Param("userId") Long userId);

    List<FollowUser> findFollowers(
            @Param("userId") Long userId,
            @Param("currentUserId") Long currentUserId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            @Param("limit") int limit);

    List<FollowUser> findFollowing(
            @Param("userId") Long userId,
            @Param("currentUserId") Long currentUserId,
            @Param("cursorCreatedAt") LocalDateTime cursorCreatedAt,
            @Param("cursorId") Long cursorId,
            @Param("limit") int limit);
}
