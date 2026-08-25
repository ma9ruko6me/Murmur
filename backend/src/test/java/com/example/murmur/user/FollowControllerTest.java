package com.example.murmur.user;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
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
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

@Import(TestcontainersConfiguration.class)
@SpringBootTest
@AutoConfigureMockMvc
class FollowControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Test
    void followAndUnfollowAreIdempotentAndReflectCountAcrossUsers() throws Exception {
        Account a = signupAndLogin("ann", "Ann", "ann@example.com");
        Account b = signupAndLogin("beth", "Beth", "beth@example.com");

        mockMvc.perform(post("/api/users/" + b.id() + "/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followerCount").value(1))
                .andExpect(jsonPath("$.followedByMe").value(true));

        // Following again is idempotent.
        mockMvc.perform(post("/api/users/" + b.id() + "/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followerCount").value(1))
                .andExpect(jsonPath("$.followedByMe").value(true));

        mockMvc.perform(delete("/api/users/" + b.id() + "/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followerCount").value(0))
                .andExpect(jsonPath("$.followedByMe").value(false));

        // Unfollowing when not following is idempotent, not an error.
        mockMvc.perform(delete("/api/users/" + b.id() + "/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followerCount").value(0))
                .andExpect(jsonPath("$.followedByMe").value(false));
    }

    @Test
    void followingNonexistentUserIsNotFound() throws Exception {
        Account a = signupAndLogin("carl", "Carl", "carl@example.com");

        mockMvc.perform(post("/api/users/999999/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isNotFound());
    }

    @Test
    void followingSelfIsRejected() throws Exception {
        Account a = signupAndLogin("dana", "Dana", "dana@example.com");

        mockMvc.perform(post("/api/users/" + a.id() + "/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isBadRequest());
    }

    @Test
    void profileReflectsFollowerAndFollowingCounts() throws Exception {
        Account a = signupAndLogin("emma", "Emma", "emma@example.com");
        Account b = signupAndLogin("finn", "Finn", "finn@example.com");

        mockMvc.perform(post("/api/users/" + b.id() + "/follow").header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/users/" + b.username()).header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followerCount").value(1))
                .andExpect(jsonPath("$.followedByMe").value(true));

        mockMvc.perform(get("/api/users/" + a.username()).header("Authorization", "Bearer " + a.token()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.followingCount").value(1));
    }

    @Test
    void followersAndFollowingListsPaginate() throws Exception {
        Account target = signupAndLogin("gina", "Gina", "gina@example.com");
        Account f1 = signupAndLogin("hank", "Hank", "hank@example.com");
        Account f2 = signupAndLogin("iris", "Iris", "iris@example.com");
        Account f3 = signupAndLogin("jack", "Jack", "jack@example.com");

        for (Account follower : new Account[] {f1, f2, f3}) {
            mockMvc.perform(post("/api/users/" + target.id() + "/follow")
                            .header("Authorization", "Bearer " + follower.token()))
                    .andExpect(status().isOk());
        }

        MvcResult firstPage = mockMvc.perform(get("/api/users/" + target.id() + "/followers")
                        .header("Authorization", "Bearer " + target.token())
                        .param("limit", "2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(2))
                .andReturn();
        String nextCursor = objectMapper
                .readTree(firstPage.getResponse().getContentAsString())
                .get("nextCursor")
                .asText();

        mockMvc.perform(get("/api/users/" + target.id() + "/followers")
                        .header("Authorization", "Bearer " + target.token())
                        .param("limit", "2")
                        .param("cursor", nextCursor))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items.length()").value(1))
                .andExpect(jsonPath("$.nextCursor").doesNotExist());
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
