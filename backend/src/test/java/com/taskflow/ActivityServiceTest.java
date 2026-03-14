package com.taskflow;

import com.taskflow.dto.response.ActivityResponse;
import com.taskflow.model.*;
import com.taskflow.repository.ActivityRepository;
import com.taskflow.service.ActivityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("ActivityService Unit Tests")
class ActivityServiceTest {

    @Mock private ActivityRepository activityRepository;

    @InjectMocks private ActivityService activityService;

    private User actor;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        actor = User.builder()
            .id(UUID.randomUUID())
            .email("actor@test.com")
            .fullName("Actor User")
            .role(User.Role.MEMBER)
            .build();

        project = Project.builder()
            .id(UUID.randomUUID())
            .name("Test Project")
            .status(Project.ProjectStatus.ACTIVE)
            .build();

        task = Task.builder()
            .id(UUID.randomUUID())
            .title("Test Task")
            .status(Task.TaskStatus.TODO)
            .project(project)
            .reporter(actor)
            .build();
    }

    // ── logActivity ───────────────────────────────────────────────────────────

    @Test
    @DisplayName("logActivity: saves Activity with all provided fields")
    void logActivity_AllFields_SavesCorrectly() {
        when(activityRepository.save(any(Activity.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        activityService.logActivity(
            "TASK_CREATED", "TASK", task.getId(),
            actor, project, task,
            null, task.getTitle()
        );

        ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
        verify(activityRepository).save(captor.capture());

        Activity saved = captor.getValue();
        assertThat(saved.getAction()).isEqualTo("TASK_CREATED");
        assertThat(saved.getEntityType()).isEqualTo("TASK");
        assertThat(saved.getEntityId()).isEqualTo(task.getId());
        assertThat(saved.getActor()).isEqualTo(actor);
        assertThat(saved.getProject()).isEqualTo(project);
        assertThat(saved.getTask()).isEqualTo(task);
        assertThat(saved.getOldValue()).isNull();
        assertThat(saved.getNewValue()).isEqualTo(task.getTitle());
    }

    @Test
    @DisplayName("logActivity: saves status change with old and new values")
    void logActivity_StatusChange_RecordsOldAndNewValues() {
        when(activityRepository.save(any(Activity.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        activityService.logActivity(
            "STATUS_CHANGED", "TASK", task.getId(),
            actor, project, task,
            "TODO", "IN_PROGRESS"
        );

        ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
        verify(activityRepository).save(captor.capture());

        Activity saved = captor.getValue();
        assertThat(saved.getOldValue()).isEqualTo("TODO");
        assertThat(saved.getNewValue()).isEqualTo("IN_PROGRESS");
    }

    @Test
    @DisplayName("logActivity: works with null task (project-level activity)")
    void logActivity_NullTask_SavesProjectLevelActivity() {
        when(activityRepository.save(any(Activity.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        activityService.logActivity(
            "PROJECT_CREATED", "PROJECT", project.getId(),
            actor, project, null, null, project.getName()
        );

        ArgumentCaptor<Activity> captor = ArgumentCaptor.forClass(Activity.class);
        verify(activityRepository).save(captor.capture());

        assertThat(captor.getValue().getTask()).isNull();
        assertThat(captor.getValue().getEntityType()).isEqualTo("PROJECT");
    }

    @Test
    @DisplayName("logActivity: repository save is called exactly once per call")
    void logActivity_CalledOnce_SavesOnce() {
        when(activityRepository.save(any(Activity.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        activityService.logActivity(
            "COMMENT_ADDED", "COMMENT", UUID.randomUUID(),
            actor, project, task, null, "A comment"
        );

        verify(activityRepository, times(1)).save(any(Activity.class));
    }

    // ── getProjectActivities ─────────────────────────────────────────────────

    @Test
    @DisplayName("getProjectActivities: returns paged ActivityResponse list")
    void getProjectActivities_ReturnsMappedPage() {
        Activity activity = buildActivity("TASK_CREATED");
        Pageable pageable = PageRequest.of(0, 10);
        Page<Activity> page = new PageImpl<>(List.of(activity), pageable, 1);

        when(activityRepository.findByProjectIdOrderByCreatedAtDesc(project.getId(), pageable))
            .thenReturn(page);

        Page<ActivityResponse> result =
            activityService.getProjectActivities(project.getId(), pageable);

        assertThat(result.getTotalElements()).isEqualTo(1);
        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getAction()).isEqualTo("TASK_CREATED");
        verify(activityRepository).findByProjectIdOrderByCreatedAtDesc(project.getId(), pageable);
    }

    @Test
    @DisplayName("getProjectActivities: returns empty page when no activities")
    void getProjectActivities_NoActivities_ReturnsEmptyPage() {
        Pageable pageable = PageRequest.of(0, 10);
        when(activityRepository.findByProjectIdOrderByCreatedAtDesc(any(), eq(pageable)))
            .thenReturn(Page.empty(pageable));

        Page<ActivityResponse> result =
            activityService.getProjectActivities(UUID.randomUUID(), pageable);

        assertThat(result.getContent()).isEmpty();
        assertThat(result.getTotalElements()).isZero();
    }

    // ── getTaskActivities ────────────────────────────────────────────────────

    @Test
    @DisplayName("getTaskActivities: returns paged ActivityResponse list")
    void getTaskActivities_ReturnsMappedPage() {
        Activity activity = buildActivity("STATUS_CHANGED");
        Pageable pageable = PageRequest.of(0, 5);
        Page<Activity> page = new PageImpl<>(List.of(activity), pageable, 1);

        when(activityRepository.findByTaskIdOrderByCreatedAtDesc(task.getId(), pageable))
            .thenReturn(page);

        Page<ActivityResponse> result =
            activityService.getTaskActivities(task.getId(), pageable);

        assertThat(result.getContent()).hasSize(1);
        assertThat(result.getContent().get(0).getAction()).isEqualTo("STATUS_CHANGED");
        verify(activityRepository).findByTaskIdOrderByCreatedAtDesc(task.getId(), pageable);
    }

    @Test
    @DisplayName("getTaskActivities: paging parameters are forwarded to repository")
    void getTaskActivities_PagingForwarded() {
        Pageable pageable = PageRequest.of(2, 20);
        when(activityRepository.findByTaskIdOrderByCreatedAtDesc(any(), eq(pageable)))
            .thenReturn(Page.empty(pageable));

        activityService.getTaskActivities(task.getId(), pageable);

        verify(activityRepository).findByTaskIdOrderByCreatedAtDesc(task.getId(), pageable);
    }

    // ── Helpers ──────────────────────────────────────────────────────────────

    private Activity buildActivity(String action) {
        return Activity.builder()
            .id(UUID.randomUUID())
            .action(action)
            .entityType("TASK")
            .entityId(task.getId())
            .actor(actor)
            .project(project)
            .task(task)
            .createdAt(OffsetDateTime.now())
            .build();
    }
}
