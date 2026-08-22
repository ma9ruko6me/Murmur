package com.example.murmur.auth;

import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface RefreshTokenMapper {

    Optional<RefreshToken> findByTokenHash(String tokenHash);

    void insert(RefreshToken refreshToken);

    void revokeById(Long id);
}
