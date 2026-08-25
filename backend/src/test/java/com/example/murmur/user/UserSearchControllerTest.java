package com.example.murmur.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class UserSearchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void searchMatchesUsernameOrDisplayNameCaseInsensitivelyAndReflectsFollowedByMe() throws Exception {
        Account searcher = signupAndLogin("karen", "Karen", "karen@example.com");
        Account byUsername = signupAndLogin("murmur-lover", "Someone", "murmurlover@example.com");
        Account byDisplayName = signupAndLogin("leo", "Murmur Fan", "leo@example.com");
        signupAndLogin("otherperson", "Otherperson", "otherperson@example.com");

        mockMvc.perform(post("/api/users/" + byUsername.id() + "/follow")
                        .header("Authorization", "Bearer " + searcher.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/search")
                        .param("q", "MURMUR")
                        .header("Authorization", "Bearer " + searcher.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andExpect(jsonPath("$.items[?(@.username == '" + byUsername.username() + "')].followedByMe")
                        .value(true))
                .andExpect(jsonPath("$.items[?(@.username == '" + byDisplayName.username() + "')].followedByMe")
                        .value(false));
    }

    @Test
    void searchWithBlankQueryReturnsEmptyPage() throws Exception {
        Account searcher = signupAndLogin("mona", "Mona", "mona@example.com");

        mockMvc.perform(get("/api/users/search").header("Authorization", "Bearer " + searcher.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(0));
    }

    private Account signupAndLogin(String username, String displayName, String email) throws Exception {
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
        String token = objectMapper
                .readTree(loginResult.getResponse().getContentAsString())
                .get("token")
                .asText();

        MvcResult meResult = mockMvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();
        long id = objectMapper
                .readTree(meResult.getResponse().getContentAsString())
                .get("id")
                .asLong();

        return new Account(id, username, token);
    }

    private record Account(long id, String username, String token) {
    }

    private record SignupPayload(String username, String displayName, String email, String password) {
    }

    private record LoginPayload(String email, String password) {
    }
}
