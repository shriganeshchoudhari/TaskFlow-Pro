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

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
@DisplayName("Project & Task Controller Integration Tests")
class ProjectTaskControllerIT {

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
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;

    private String accessToken;
    private String projectId;
    private int counter = 0;

    private String uniqueEmail() {
        return "it_user" + (++counter) + "_" + System.currentTimeMillis() + "@test.com";
    }

    /**
     * Register a user, login, and create a project for test data.
     */
    @BeforeEach
    void setupUserAndProject() throws Exception {
        String email = uniqueEmail();
        String password = "TestPass123!";

        // Register
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"fullName": "IT User", "email": "%s", "password": "%s"}
                    """.formatted(email, password)))
            .andExpect(status().isCreated());

        // Login
        MvcResult loginResult = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"email": "%s", "password": "%s"}
                    """.formatted(email, password)))
            .andExpect(status().isOk())
            .andReturn();

        JsonNode loginBody = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        accessToken = loginBody.get("accessToken").asText();

        // Create project
        MvcResult projResult = mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "IT Project", "description": "Integration test project"}
                    """))
            .andExpect(status().isCreated())
            .andReturn();

        JsonNode projBody = objectMapper.readTree(projResult.getResponse().getContentAsString());
        projectId = projBody.get("id").asText();
    }

    // ── Project Tests ────────────────────────────────────────────────────────

    @Test
    @DisplayName("createProject: authenticated user returns 201")
    void createProject_Authenticated_Returns201() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "Another Project", "description": "Testing"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.name").value("Another Project"));
    }

    @Test
    @DisplayName("createProject: unauthenticated returns 401")
    void createProject_Unauthenticated_Returns401() throws Exception {
        mockMvc.perform(post("/api/v1/projects")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"name": "Unauth Project"}
                    """))
            .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("getProject: member returns 200")
    void getProject_Member_Returns200() throws Exception {
        mockMvc.perform(get("/api/v1/projects/" + projectId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("IT Project"));
    }

    @Test
    @DisplayName("archiveProject: by manager returns 204")
    void archiveProject_ByManager_Returns204() throws Exception {
        mockMvc.perform(delete("/api/v1/projects/" + projectId)
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isNoContent());
    }

    // ── Task Tests ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("createTask: in project returns 201")
    void createTask_InProject_Returns201() throws Exception {
        mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "IT Task", "priority": "HIGH"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.title").value("IT Task"))
            .andExpect(jsonPath("$.priority").value("HIGH"));
    }

    @Test
    @DisplayName("updateTaskStatus: valid transition returns 200")
    void updateTaskStatus_ValidTransition_Returns200() throws Exception {
        // Create a task
        MvcResult taskResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Status Task"}
                    """))
            .andExpect(status().isCreated())
            .andReturn();

        String taskId = objectMapper.readTree(taskResult.getResponse().getContentAsString())
            .get("id").asText();

        // TODO → IN_PROGRESS
        mockMvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status": "IN_PROGRESS"}
                    """))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("IN_PROGRESS"));
    }

    @Test
    @DisplayName("updateTaskStatus: invalid transition returns 422")
    void updateTaskStatus_InvalidTransition_Returns422() throws Exception {
        // Create a task (defaults to TODO)
        MvcResult taskResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Invalid Transition Task"}
                    """))
            .andExpect(status().isCreated())
            .andReturn();

        String taskId = objectMapper.readTree(taskResult.getResponse().getContentAsString())
            .get("id").asText();

        // TODO → DONE (invalid)
        mockMvc.perform(patch("/api/v1/tasks/" + taskId + "/status")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"status": "DONE"}
                    """))
            .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @DisplayName("getMyTasks: returns 200 with paged result")
    void getMyTasks_Returns200PagedResult() throws Exception {
        mockMvc.perform(get("/api/v1/tasks/my-tasks")
                .header("Authorization", "Bearer " + accessToken))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content").isArray());
    }

    // ── Comment Tests ────────────────────────────────────────────────────────

    @Test
    @DisplayName("addComment: to task returns 201")
    void addComment_ToTask_Returns201() throws Exception {
        // Create a task first
        MvcResult taskResult = mockMvc.perform(post("/api/v1/projects/" + projectId + "/tasks")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"title": "Comment Task"}
                    """))
            .andExpect(status().isCreated())
            .andReturn();

        String taskId = objectMapper.readTree(taskResult.getResponse().getContentAsString())
            .get("id").asText();

        // Add comment
        mockMvc.perform(post("/api/v1/tasks/" + taskId + "/comments")
                .header("Authorization", "Bearer " + accessToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                    {"content": "This is a test comment"}
                    """))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.content").value("This is a test comment"));
    }
}
