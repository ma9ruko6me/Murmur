package com.example.murmur.like;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.murmur.TestcontainersConfiguration;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class LikeControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void likeAndUnlikeAreIdempotentAndReflectCountAcrossUsers() throws Exception {
        String token = signupAndLogin("erin", "Erin", "erin@example.com");
        String otherToken = signupAndLogin("frank", "Frank", "frank@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("likeable post"))))
                .andExpect(status().isCreated())
                .andReturn();
        long postId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        // Liking increments the count and marks likedByMe for the actor.
        mockMvc.perform(post("/api/posts/" + postId + "/like").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(true));

        // Liking again is idempotent.
        mockMvc.perform(post("/api/posts/" + postId + "/like").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(true));

        // A different user liking increases the shared count; likedByMe is per-actor.
        mockMvc.perform(post("/api/posts/" + postId + "/like").header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(2))
                .andExpect(jsonPath("$.likedByMe").value(true));

        // Unliking decrements the count and clears likedByMe for the actor.
        mockMvc.perform(delete("/api/posts/" + postId + "/like").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(false));

        // Unliking when not liked is idempotent, not an error.
        mockMvc.perform(delete("/api/posts/" + postId + "/like").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.likeCount").value(1))
                .andExpect(jsonPath("$.likedByMe").value(false));
    }

    @Test
    void likeAndUnlikeOnNonexistentPostAreNotFound() throws Exception {
        String token = signupAndLogin("grace", "Grace", "grace@example.com");

        mockMvc.perform(post("/api/posts/999999/like").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/posts/999999/like").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private String signupAndLogin(String username, String displayName, String email) throws Exception {
        mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new SignupPayload(username, displayName, email, "correct-horse-battery"))))
                .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new LoginPayload(email, "correct-horse-battery"))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper
                .readTree(loginResult.getResponse().getContentAsString())
                .get("token")
                .asText();
    }

    private record SignupPayload(String username, String displayName, String email, String password) {
    }

    private record LoginPayload(String email, String password) {
    }

    private record ContentPayload(String content) {
    }
}
