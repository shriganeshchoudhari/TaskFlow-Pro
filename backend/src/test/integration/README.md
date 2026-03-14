# Integration Tests

Spring Boot integration tests using **Testcontainers** — each test spins up a real PostgreSQL 16 container, runs Flyway migrations, and exercises the full application stack via MockMvc.

## Test Files

| File | Tests | Coverage |
|------|-------|---------|
| `AuthControllerIT.java` | 10 | Register (201/400/409) · Login (200/401) · Refresh (200/401) · Logout (204) |
| `ProjectTaskControllerIT.java` | 14 | Project CRUD (201/401/204) · Task lifecycle · Status transitions (200/422) · Comments · Subtasks · Time logging |

## Running

```bash
# From backend/ directory
./mvnw verify -Pintegration-test

# With output
./mvnw verify -Pintegration-test -Dsurefire.failIfNoSpecifiedTests=false
```

**Requirements:** Docker must be running (Testcontainers pulls `postgres:16-alpine`).

## Configuration

Tests activate the `integration-test` Spring profile, which reads `src/test/resources/application-integration-test.yml`. This overrides the datasource URL with the Testcontainers dynamic JDBC URL via `@DynamicPropertySource`.

Key settings in `application-integration-test.yml`:
- `spring.flyway.repair-on-migrate: true` — allows clean re-runs
- `app.jwt.secret` — valid Base64 HS512 key for test token generation
- `app.cors.allowed-origins: http://localhost:5173` — matches dev frontend

## Writing New Integration Tests

```java
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@AutoConfigureMockMvc
@Testcontainers
@ActiveProfiles("integration-test")
class MyControllerIT {

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

    // Helper: register → login → return Bearer token
    private String loginAndGetToken(String email, String password) throws Exception {
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"fullName":"Test","email":"%s","password":"%s"}"""
                    .formatted(email, password)))
            .andExpect(status().isCreated());

        MvcResult result = mockMvc.perform(post("/api/v1/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""{"email":"%s","password":"%s"}""".formatted(email, password)))
            .andExpect(status().isOk())
            .andReturn();

        return objectMapper.readTree(result.getResponse().getContentAsString())
            .get("accessToken").asText();
    }
}
```
