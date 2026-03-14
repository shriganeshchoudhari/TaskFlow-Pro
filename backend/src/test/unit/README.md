# Unit Tests

Fast, isolated unit tests using **JUnit 5 + Mockito**. No database, no network, no Spring context — all dependencies are mocked.

## Test Files

| File | Tests | Key Scenarios |
|------|-------|--------------|
| `AuthServiceTest.java` | 6 | Register (success/duplicate) · Login (success/bad-creds/inactive) · Refresh (valid/expired) |
| `TaskServiceTest.java` | 15 | Create · assignee-not-in-project · notification on assign · update by assignee/stranger · status transitions (TODO→IN_PROGRESS ✓ · TODO→DONE ✗ · IN_PROGRESS→REVIEW ✓ · REVIEW→DONE ✓ · DONE→IN_PROGRESS ✗) · delete by manager/member · subtasks · time logging |
| `CommentServiceTest.java` | 7 | Add (member/non-member) · Edit (author/other) · Delete (author/manager/stranger) |
| `NotificationServiceTest.java` | 8 | notifyTaskAssigned · notifyCommentAdded (not commenter) · markAsRead (own/other's) · markAllAsRead · scheduled due-date reminders |
| `ActivityServiceTest.java` | 9 | logActivity (all fields / status-change / null-task / single-save) · getProjectActivities (paged/empty) · getTaskActivities (paged/forwarded-paging) |
| `AttachmentServiceTest.java` | varies | Attachment CRUD |

## Running

```bash
# From backend/ directory
./mvnw test

# Single test class
./mvnw test -Dtest=TaskServiceTest

# Single test method
./mvnw test -Dtest="TaskServiceTest#updateTaskStatus_TodoToDone_ThrowsInvalid"
```

No Docker required — all tests use Mockito mocks.

## Writing New Unit Tests

Follow this structure:

```java
@ExtendWith(MockitoExtension.class)
@DisplayName("MyService Unit Tests")
class MyServiceTest {

    // Mock every dependency of the class under test
    @Mock private SomeDependency dep;
    @InjectMocks private MyService myService;

    private SomeEntity testEntity;

    @BeforeEach
    void setUp() {
        testEntity = SomeEntity.builder()
            .id(UUID.randomUUID())
            .name("Test")
            .build();
    }

    @Test
    @DisplayName("doSomething: happy path returns expected result")
    void doSomething_ValidInput_ReturnsResult() {
        when(dep.findById(any())).thenReturn(Optional.of(testEntity));
        var result = myService.doSomething(testEntity.getId());
        assertThat(result).isNotNull();
        verify(dep).findById(testEntity.getId());
    }

    @Test
    @DisplayName("doSomething: throws ForbiddenException when caller is not owner")
    void doSomething_CallerNotOwner_ThrowsForbidden() {
        when(dep.findById(any())).thenReturn(Optional.of(testEntity));
        assertThatThrownBy(() -> myService.doSomething(otherUserId))
            .isInstanceOf(ForbiddenException.class);
    }
}
```

**Naming convention:** `methodName_scenario_expectedOutcome`

**Coverage target:** ≥ 80% line coverage enforced by JaCoCo in CI.
Check your coverage:
```bash
./mvnw verify jacoco:report
open target/site/jacoco/index.html
```
