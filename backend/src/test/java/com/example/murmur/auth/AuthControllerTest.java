package com.example.murmur.auth;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.murmur.TestcontainersConfiguration;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void signupThenLoginIssuesTokenThatUnlocksMe() throws Exception {
        String signupBody = objectMapper.writeValueAsString(
                new SignupPayload("alice", "Alice", "alice@example.com", "correct-horse-battery"));

        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signupBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.email").value("alice@example.com"));

        // Duplicate signup is rejected.
        mockMvc.perform(post("/api/auth/signup").contentType(MediaType.APPLICATION_JSON).content(signupBody))
                .andExpect(status().isConflict());

        String loginBody =
                objectMapper.writeValueAsString(new LoginPayload("alice@example.com", "correct-horse-battery"));
        String responseJson = mockMvc.perform(
                        post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn()
                .getResponse()
                .getContentAsString();
        String token = objectMapper.readTree(responseJson).get("token").asText();

        // Wrong password is rejected.
        String wrongLoginBody =
                objectMapper.writeValueAsString(new LoginPayload("alice@example.com", "wrong-password"));
        mockMvc.perform(
                        post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(wrongLoginBody))
                .andExpect(status().isUnauthorized());

        // Protected endpoint requires the token.
        mockMvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.displayName", containsString("Alice")));

        mockMvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    private record SignupPayload(String username, String displayName, String email, String password) {
    }

    private record LoginPayload(String email, String password) {
    }
}
