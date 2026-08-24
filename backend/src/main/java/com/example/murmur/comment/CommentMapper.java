package com.example.murmur.comment;

import java.util.List;
import java.util.Optional;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface CommentMapper {

    List<Comment> findByPostId(@Param("postId") Long postId);

    Optional<Comment> findById(@Param("id") Long id);

    void insert(Comment comment);

    int update(@Param("id") Long id, @Param("content") String content);

    int softDelete(@Param("id") Long id, @Param("userId") Long userId);
}
