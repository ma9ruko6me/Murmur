package com.example.murmur.user;

import com.example.murmur.user.dto.UserProfileResponse;
import com.example.murmur.user.exception.UserNotFoundException;
import com.example.murmur.user.exception.UserProfileNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final String NOT_FOUND_MESSAGE = "ユーザーが見つかりません";

    private final UserMapper userMapper;
    private final FollowMapper followMapper;

    public UserService(UserMapper userMapper, FollowMapper followMapper) {
        this.userMapper = userMapper;
        this.followMapper = followMapper;
    }

    public User getById(Long id) {
        return userMapper.findById(id).orElseThrow(() -> new UserNotFoundException(NOT_FOUND_MESSAGE));
    }

    public UserProfileResponse getProfileByUsername(String username, Long currentUserId) {
        User user = userMapper
                .findByUsername(username)
                .orElseThrow(() -> new UserProfileNotFoundException(NOT_FOUND_MESSAGE));
        long postCount = userMapper.countPostsByUserId(user.getId());
        boolean own = user.getId().equals(currentUserId);
        long followerCount = followMapper.countFollowers(user.getId());
        long followingCount = followMapper.countFollowing(user.getId());
        boolean followedByMe = !own && followMapper.exists(currentUserId, user.getId());
        return UserProfileResponse.from(user, postCount, own, followerCount, followingCount, followedByMe);
    }

    public UserProfileResponse updateProfile(Long userId, String displayName, String bio) {
        userMapper.updateProfile(userId, displayName, bio);
        User updated = getById(userId);
        long postCount = userMapper.countPostsByUserId(userId);
        long followerCount = followMapper.countFollowers(userId);
        long followingCount = followMapper.countFollowing(userId);
        return UserProfileResponse.from(updated, postCount, true, followerCount, followingCount, false);
    }
}
