package com.example.murmur.auth;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.example.murmur.TestcontainersConfiguration;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

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
        MvcResult loginResult = mockMvc.perform(
                        post("/api/auth/login").contentType(MediaType.APPLICATION_JSON).content(loginBody))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();
        String token =
                objectMapper.readTree(loginResult.getResponse().getContentAsString()).get("token").asText();
        Cookie refreshCookie = loginResult.getResponse().getCookie("refresh_token");
        assertThat(refreshCookie).isNotNull();
        assertThat(refreshCookie.isHttpOnly()).isTrue();

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

        // No refresh token cookie means the refresh endpoint is rejected.
        mockMvc.perform(post("/api/auth/refresh")).andExpect(status().isUnauthorized());

        // The refresh token cookie yields a new access token and rotates the cookie.
        MvcResult refreshResult = mockMvc.perform(post("/api/auth/refresh").cookie(refreshCookie))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").exists())
                .andReturn();
        String refreshedToken = objectMapper
                .readTree(refreshResult.getResponse().getContentAsString())
                .get("token")
                .asText();
        Cookie rotatedCookie = refreshResult.getResponse().getCookie("refresh_token");
        assertThat(rotatedCookie).isNotNull();
        assertThat(rotatedCookie.getValue()).isNotEqualTo(refreshCookie.getValue());

        mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + refreshedToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"));

        // The old (rotated-away) refresh token cannot be reused.
        mockMvc.perform(post("/api/auth/refresh").cookie(refreshCookie)).andExpect(status().isUnauthorized());

        // Logout revokes the current refresh token.
        mockMvc.perform(post("/api/auth/logout")
                        .header("Authorization", "Bearer " + refreshedToken)
                        .cookie(rotatedCookie))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/auth/refresh").cookie(rotatedCookie)).andExpect(status().isUnauthorized());
    }

    private record SignupPayload(String username, String displayName, String email, String password) {
    }

    private record LoginPayload(String email, String password) {
    }
}
