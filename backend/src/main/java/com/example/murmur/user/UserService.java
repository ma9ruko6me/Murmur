package com.example.murmur.user;

import com.example.murmur.user.exception.UserNotFoundException;
import org.springframework.stereotype.Service;

@Service
public class UserService {

    private static final String NOT_FOUND_MESSAGE = "ユーザーが見つかりません";

    private final UserMapper userMapper;

    public UserService(UserMapper userMapper) {
        this.userMapper = userMapper;
    }

    public User getById(Long id) {
        return userMapper.findById(id).orElseThrow(() -> new UserNotFoundException(NOT_FOUND_MESSAGE));
    }
}
