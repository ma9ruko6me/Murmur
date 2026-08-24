package com.example.murmur.comment;

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
class CommentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void createListUpdateAndDeleteFlowWithReplyAndCommentCount() throws Exception {
        String authorToken = signupAndLogin("hana", "Hana", "hana@example.com");
        String replierToken = signupAndLogin("ippei", "Ippei", "ippei@example.com");

        long postId = createPost(authorToken, "a post to comment on");

        MvcResult createResult = mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCommentPayload("first comment", null))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("first comment"))
                .andExpect(jsonPath("$.deleted").value(false))
                .andExpect(jsonPath("$.replyTo").doesNotExist())
                .andReturn();
        long commentId = objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + replierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(
                                new CreateCommentPayload("a reply", commentId))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.content").value("a reply"))
                .andExpect(jsonPath("$.replyTo.commentId").value(commentId))
                .andExpect(jsonPath("$.replyTo.username").value("hana"))
                .andExpect(jsonPath("$.replyTo.deleted").value(false));

        mockMvc.perform(get("/api/posts/" + postId + "/comments").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(2))
                .andExpect(jsonPath("$[0].content").value("first comment"))
                .andExpect(jsonPath("$[1].content").value("a reply"));

        mockMvc.perform(get("/api/posts/" + postId).header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commentCount").value(2));

        // Only the author can edit their own comment.
        mockMvc.perform(put("/api/comments/" + commentId)
                        .header("Authorization", "Bearer " + replierToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCommentPayload("hijacked"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(put("/api/comments/" + commentId)
                        .header("Authorization", "Bearer " + authorToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCommentPayload("edited comment"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content").value("edited comment"));

        // Deleting a comment that has a reply must succeed (soft delete) and the reply keeps its replyTo reference.
        mockMvc.perform(delete("/api/comments/" + commentId).header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isNoContent());

        mockMvc.perform(get("/api/posts/" + postId + "/comments").header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].deleted").value(true))
                .andExpect(jsonPath("$[0].content").doesNotExist())
                .andExpect(jsonPath("$[1].replyTo.username").value("hana"))
                .andExpect(jsonPath("$[1].replyTo.deleted").value(true));

        mockMvc.perform(get("/api/posts/" + postId).header("Authorization", "Bearer " + authorToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.commentCount").value(1));
    }

    @Test
    void validationAndNotFoundCases() throws Exception {
        String token = signupAndLogin("junko", "Junko", "junko@example.com");
        long postId = createPost(token, "validation target");

        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCommentPayload("", null))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/posts/" + postId + "/comments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCommentPayload("x".repeat(281), null))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/posts/999999/comments")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new CreateCommentPayload("orphan", null))))
                .andExpect(status().isNotFound());

        mockMvc.perform(put("/api/comments/999999")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new UpdateCommentPayload("nope"))))
                .andExpect(status().isNotFound());

        mockMvc.perform(delete("/api/comments/999999").header("Authorization", "Bearer " + token))
                .andExpect(status().isNotFound());
    }

    private long createPost(String token, String content) throws Exception {
        MvcResult createResult = mockMvc.perform(post("/api/posts")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new ContentPayload(content))))
                .andExpect(status().isCreated())
                .andReturn();
        return objectMapper
                .readTree(createResult.getResponse().getContentAsString())
                .get("id")
                .asLong();
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

    private record CreateCommentPayload(String content, Long parentCommentId) {
    }

    private record UpdateCommentPayload(String content) {
    }
}
