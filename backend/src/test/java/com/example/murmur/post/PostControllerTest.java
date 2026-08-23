package com.example.murmur.post;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
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
class PostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void createListUpdateAndDeletePost() throws Exception {
        String token = signupAndLogin("bob", "Bob", "bob@example.com");
        String otherToken = signupAndLogin("carol", "Carol", "carol@example.com");

        MvcResult createResult = mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("hello world"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("hello world"))
                .andExpect(jsonPath("$.username").value("bob"))
                .andReturn();
        long postId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        // Blank content is rejected.
        mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload(""))))
                .andExpect(status().isBadRequest());

        // Over-length content is rejected.
        mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("a".repeat(281)))))
                .andExpect(status().isBadRequest());

        // List returns the newly created post first.
        mockMvc.perform(get("/api/posts").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].id").value(postId));

        // new-count reflects posts created after a given id.
        mockMvc.perform(get("/api/posts/new-count")
                        .param("after", String.valueOf(postId))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(0));

        mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("second post"))))
                .andExpect(status().isCreated());

        mockMvc.perform(get("/api/posts/new-count")
                        .param("after", String.valueOf(postId))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.count").value(1));

        // Updating another user's post is forbidden.
        mockMvc.perform(put("/api/posts/" + postId)
                        .header("Authorization", "Bearer " + otherToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("hijacked"))))
                .andExpect(status().isForbidden());

        // Updating a nonexistent post is not found.
        mockMvc.perform(put("/api/posts/999999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("nope"))))
                .andExpect(status().isNotFound());

        // Owner can update.
        mockMvc.perform(put("/api/posts/" + postId)
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload("updated content"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("updated content"));

        // Deleting another user's post is forbidden.
        mockMvc.perform(delete("/api/posts/" + postId).header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isForbidden());

        // Deleting a nonexistent post is not found.
        mockMvc.perform(delete("/api/posts/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());

        // Owner can delete.
        mockMvc.perform(delete("/api/posts/" + postId).header("Authorization", "Bearer " + token))
                .andExpect(status().isNoContent());
    }

    @Test
    void listPaginatesWithCursorWhenMorePostsExistThanPageSize() throws Exception {
        String token = signupAndLogin("dave", "Dave", "dave@example.com");

        for (int i = 0; i < 21; i++) {
            mockMvc.perform(post("/api/posts")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(new ContentPayload("post " + i))))
                    .andExpect(status().isCreated());
        }

        MvcResult firstPage = mockMvc.perform(get("/api/posts")
                        .param("limit", "20")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(20))
                .andExpect(jsonPath("$.nextCursor").exists())
                .andReturn();
        String cursor = objectMapper
                .readTree(firstPage.getResponse().getContentAsString())
                .get("nextCursor")
                .asText();
        long firstPageOldestId = objectMapper
                .readTree(firstPage.getResponse().getContentAsString())
                .get("items")
                .get(19)
                .get("id")
                .asLong();

        MvcResult secondPage = mockMvc.perform(get("/api/posts")
                        .param("cursor", cursor)
                        .param("limit", "20")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.nextCursor").doesNotExist())
                .andReturn();
        long secondPageNewestId = objectMapper
                .readTree(secondPage.getResponse().getContentAsString())
                .get("items")
                .get(0)
                .get("id")
                .asLong();

        org.assertj.core.api.Assertions.assertThat(secondPageNewestId).isLessThan(firstPageOldestId);
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
