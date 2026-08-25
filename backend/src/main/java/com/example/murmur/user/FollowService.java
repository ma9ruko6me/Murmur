package com.example.murmur.user;

import com.example.murmur.user.exception.SelfFollowException;
import com.example.murmur.user.exception.UserProfileNotFoundException;
import java.time.LocalDateTime;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public class FollowService {

    private static final String NOT_FOUND_MESSAGE = "ユーザーが見つかりません";

    private final FollowMapper followMapper;
    private final UserMapper userMapper;

    public FollowService(FollowMapper followMapper, UserMapper userMapper) {
        this.followMapper = followMapper;
        this.userMapper = userMapper;
    }

    public FollowStatus follow(Long targetId, Long currentUserId) {
        ensureTargetExists(targetId);
        if (targetId.equals(currentUserId)) {
            throw new SelfFollowException("自分自身をフォローすることはできません");
        }
        followMapper.insertIfAbsent(currentUserId, targetId);
        return currentStatus(targetId, currentUserId);
    }

    public FollowStatus unfollow(Long targetId, Long currentUserId) {
        ensureTargetExists(targetId);
        followMapper.delete(currentUserId, targetId);
        return currentStatus(targetId, currentUserId);
    }

    public List<FollowUser> findFollowers(
            Long userId, Long currentUserId, LocalDateTime cursorCreatedAt, Long cursorId, int limit) {
        ensureTargetExists(userId);
        return followMapper.findFollowers(userId, currentUserId, cursorCreatedAt, cursorId, limit);
    }

    public List<FollowUser> findFollowing(
            Long userId, Long currentUserId, LocalDateTime cursorCreatedAt, Long cursorId, int limit) {
        ensureTargetExists(userId);
        return followMapper.findFollowing(userId, currentUserId, cursorCreatedAt, cursorId, limit);
    }

    private FollowStatus currentStatus(Long targetId, Long currentUserId) {
        long followerCount = followMapper.countFollowers(targetId);
        boolean followedByMe = followMapper.exists(currentUserId, targetId);
        return new FollowStatus(followerCount, followedByMe);
    }

    private void ensureTargetExists(Long id) {
        userMapper.findById(id).orElseThrow(() -> new UserProfileNotFoundException(NOT_FOUND_MESSAGE));
    }
}
