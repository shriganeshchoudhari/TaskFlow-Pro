package com.taskflow.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@DisplayName("Auth Controller Integration Tests")
class AuthControllerIT {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("taskflow_test")
        .withUsername("taskflow")
        .withPassword("taskflow_test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
        registry.add("spring.flyway.enabled", () -> "true");
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "validate");
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private static final String AUTH_BASE = "/api/v1/auth";
    private int userCounter = 0;

    private String uniqueEmail() {
        return "testuser" + (++userCounter) + "_" + System.currentTimeMillis() + "@test.com";
    }

    private String registerJson(String fullName, String email, String password) {
        return """
            {"fullName": "%s", "email": "%s", "password": "%s"}
            """.formatted(fullName, email, password);
    }

    private String loginJson(String email, String password) {
        return """
            {"email": "%s", "password": "%s"}
            """.formatted(email, password);
    }

    private String refreshJson(String refreshToken) {
        return """
            {"refreshToken": "%s"}
            """.formatted(refreshToken);
    }

    // ── Register Tests ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("Register: valid user returns 201 with UserResponse")
    void register_ValidUser_Returns201() throws Exception {
        String email = uniqueEmail();

        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("Test User", email, "TestPass123!")))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.email").value(email))
            .andExpect(jsonPath("$.fullName").value("Test User"))
            .andExpect(jsonPath("$.role").value("MEMBER"))
            .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    @DisplayName("Register: duplicate email returns 409")
    void register_DuplicateEmail_Returns409() throws Exception {
        String email = uniqueEmail();

        // First registration
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("User One", email, "TestPass123!")))
            .andExpect(status().isCreated());

        // Duplicate registration
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("User Two", email, "TestPass123!")))
            .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Register: invalid password returns 400")
    void register_InvalidPassword_Returns400() throws Exception {
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("Test User", uniqueEmail(), "short")))
            .andExpect(status().isBadRequest());
    }

    // ── Login Tests ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Login: valid credentials returns 200 with tokens")
    void login_ValidCredentials_Returns200WithTokens() throws Exception {
        String email = uniqueEmail();
        String password = "TestPass123!";

        // Register first
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("Login User", email, password)))
            .andExpect(status().isCreated());

        // Login
        mockMvc.perform(post(AUTH_BASE + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty())
            .andExpect(jsonPath("$.tokenType").value("Bearer"))
            .andExpect(jsonPath("$.expiresIn").value(900))
            .andExpect(jsonPath("$.user.email").value(email));
    }

    @Test
    @DisplayName("Login: wrong password returns 401")
    void login_WrongPassword_Returns401() throws Exception {
        String email = uniqueEmail();

        // Register first
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("WrongPW User", email, "TestPass123!")))
            .andExpect(status().isCreated());

        // Wrong password
        mockMvc.perform(post(AUTH_BASE + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, "WrongPassword123!")))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("Login: non-existent email returns 401")
    void login_NonExistentEmail_Returns401() throws Exception {
        mockMvc.perform(post(AUTH_BASE + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson("nonexistent@test.com", "TestPass123!")))
            .andExpect(status().isUnauthorized());
    }

    // ── Refresh Token Tests ─────────────────────────────────────────────────────

    @Test
    @DisplayName("Refresh: valid token returns 200 with new tokens")
    void refresh_ValidToken_Returns200NewTokens() throws Exception {
        String email = uniqueEmail();
        String password = "TestPass123!";

        // Register + Login
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("Refresh User", email, password)))
            .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post(AUTH_BASE + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String refreshToken = loginBody.get("refreshToken").asText();

        // Refresh
        mockMvc.perform(post(AUTH_BASE + "/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson(refreshToken)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.accessToken").isNotEmpty())
            .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("Refresh: invalid token returns 401")
    void refresh_InvalidToken_Returns401() throws Exception {
        mockMvc.perform(post(AUTH_BASE + "/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson("invalid.token.here")))
            .andExpect(status().isUnauthorized());
    }

    // ── Logout Tests ────────────────────────────────────────────────────────────

    @Test
    @DisplayName("Logout: valid token returns 204")
    void logout_ValidToken_Returns204() throws Exception {
        String email = uniqueEmail();
        String password = "TestPass123!";

        // Register + Login
        mockMvc.perform(post(AUTH_BASE + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson("Logout User", email, password)))
            .andExpect(status().isCreated());

        MvcResult loginResult = mockMvc.perform(post(AUTH_BASE + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson(email, password)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        String refreshToken = loginBody.get("refreshToken").asText();

        // Logout
        mockMvc.perform(post(AUTH_BASE + "/logout")
                .contentType(MediaType.APPLICATION_JSON)
                .content(refreshJson(refreshToken)))
            .andExpect(status().isNoContent());
    }
}
