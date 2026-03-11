package com.taskflow;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.exception.*;
import com.taskflow.model.*;
import com.taskflow.repository.*;
import com.taskflow.service.ActivityService;
import com.taskflow.service.NotificationService;
import com.taskflow.service.TaskService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("TaskService Unit Tests")
class TaskServiceTest {

    @Mock private TaskRepository taskRepository;
    @Mock private ProjectRepository projectRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private NotificationService notificationService;
    @Mock private ActivityService activityService;

    @InjectMocks private TaskService taskService;

    private User reporter;
    private User assignee;
    private User stranger;
    private Project project;
    private Task task;
    private UserDetails reporterDetails;
    private UserDetails assigneeDetails;
    private UserDetails strangerDetails;

    @BeforeEach
    void setUp() {
        reporter = User.builder().id(UUID.randomUUID()).email("reporter@test.com")
            .fullName("Reporter").role(User.Role.MEMBER).isActive(true).build();
        assignee = User.builder().id(UUID.randomUUID()).email("assignee@test.com")
            .fullName("Assignee").role(User.Role.MEMBER).isActive(true).build();
        stranger = User.builder().id(UUID.randomUUID()).email("stranger@test.com")
            .fullName("Stranger").role(User.Role.MEMBER).isActive(true).build();

        project = Project.builder().id(UUID.randomUUID()).name("Test Project")
            .status(Project.ProjectStatus.ACTIVE).build();

        task = Task.builder().id(UUID.randomUUID()).title("Test Task")
            .status(Task.TaskStatus.TODO).priority(Task.TaskPriority.MEDIUM)
            .project(project).reporter(reporter).assignee(assignee).build();

        reporterDetails = mock(UserDetails.class);
        when(reporterDetails.getUsername()).thenReturn(reporter.getEmail());

        assigneeDetails = mock(UserDetails.class);
        lenient().when(assigneeDetails.getUsername()).thenReturn(assignee.getEmail());

        strangerDetails = mock(UserDetails.class);
        lenient().when(strangerDetails.getUsername()).thenReturn(stranger.getEmail());
    }

    // ── Create Task ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("createTask: valid request returns TaskResponse")
    void createTask_ValidRequest_ReturnsTaskResponse() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setTitle("New Task");

        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        TaskResponse response = taskService.createTask(project.getId(), req, reporterDetails);

        assertThat(response).isNotNull();
        assertThat(response.getTitle()).isEqualTo("New Task");
        verify(activityService).logActivity(eq("TASK_CREATED"), anyString(), any(), any(), any(), any(), any(), any());
    }

    @Test
    @DisplayName("createTask: with assignee sends notification")
    void createTask_WithAssignee_SendsNotification() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setTitle("Assigned Task");
        req.setAssigneeId(assignee.getId());

        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), assignee.getId()))
            .thenReturn(true);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(assignee.getId())).thenReturn(Optional.of(assignee));
        when(taskRepository.save(any(Task.class))).thenAnswer(inv -> {
            Task t = inv.getArgument(0);
            t.setId(UUID.randomUUID());
            return t;
        });

        taskService.createTask(project.getId(), req, reporterDetails);

        verify(notificationService).notifyTaskAssigned(eq(assignee), any(Task.class), eq(reporter));
    }

    @Test
    @DisplayName("createTask: assignee not in project throws ForbiddenException")
    void createTask_AssigneeNotInProject_ThrowsForbidden() {
        CreateTaskRequest req = new CreateTaskRequest();
        req.setTitle("Bad Assign");
        req.setAssigneeId(stranger.getId());

        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);
        when(projectRepository.findById(project.getId())).thenReturn(Optional.of(project));
        when(userRepository.findById(stranger.getId())).thenReturn(Optional.of(stranger));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), stranger.getId()))
            .thenReturn(false);

        assertThatThrownBy(() -> taskService.createTask(project.getId(), req, reporterDetails))
            .isInstanceOf(ForbiddenException.class);
    }

    // ── Update Task ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("updateTask: by assignee succeeds")
    void updateTask_ByAssignee_Succeeds() {
        UpdateTaskRequest req = new UpdateTaskRequest();
        req.setTitle("Updated Title");

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(assignee.getEmail())).thenReturn(Optional.of(assignee));
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.updateTask(task.getId(), req, assigneeDetails);
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("updateTask: by stranger throws ForbiddenException")
    void updateTask_ByStranger_ThrowsForbidden() {
        UpdateTaskRequest req = new UpdateTaskRequest();
        req.setTitle("Hack Title");

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), stranger.getId()))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> taskService.updateTask(task.getId(), req, strangerDetails))
            .isInstanceOf(ForbiddenException.class);
    }

    // ── Status Transitions ───────────────────────────────────────────────────

    @Test
    @DisplayName("updateTaskStatus: TODO → IN_PROGRESS succeeds")
    void updateTaskStatus_TodoToInProgress_Succeeds() {
        task.setStatus(Task.TaskStatus.TODO);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.updateTaskStatus(task.getId(), "IN_PROGRESS", reporterDetails);
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("updateTaskStatus: TODO → DONE throws InvalidStatusTransitionException")
    void updateTaskStatus_TodoToDone_ThrowsInvalid() {
        task.setStatus(Task.TaskStatus.TODO);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);

        assertThatThrownBy(() -> taskService.updateTaskStatus(task.getId(), "DONE", reporterDetails))
            .isInstanceOf(InvalidStatusTransitionException.class);
    }

    @Test
    @DisplayName("updateTaskStatus: IN_PROGRESS → REVIEW succeeds")
    void updateTaskStatus_InProgressToReview_Succeeds() {
        task.setStatus(Task.TaskStatus.IN_PROGRESS);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.updateTaskStatus(task.getId(), "REVIEW", reporterDetails);
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("updateTaskStatus: REVIEW → DONE succeeds")
    void updateTaskStatus_ReviewToDone_Succeeds() {
        task.setStatus(Task.TaskStatus.REVIEW);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);
        when(taskRepository.save(any(Task.class))).thenReturn(task);

        TaskResponse response = taskService.updateTaskStatus(task.getId(), "DONE", reporterDetails);
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("updateTaskStatus: DONE → IN_PROGRESS throws InvalidStatusTransitionException")
    void updateTaskStatus_DoneToInProgress_ThrowsInvalid() {
        task.setStatus(Task.TaskStatus.DONE);
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(true);

        assertThatThrownBy(() -> taskService.updateTaskStatus(task.getId(), "IN_PROGRESS", reporterDetails))
            .isInstanceOf(InvalidStatusTransitionException.class);
    }

    // ── Delete Task ──────────────────────────────────────────────────────────

    @Test
    @DisplayName("deleteTask: by project manager succeeds")
    void deleteTask_ByProjectManager_Succeeds() {
        User manager = User.builder().id(UUID.randomUUID()).email("mgr@test.com")
            .fullName("Manager").role(User.Role.MEMBER).isActive(true).build();
        UserDetails mgrDetails = mock(UserDetails.class);
        when(mgrDetails.getUsername()).thenReturn(manager.getEmail());

        ProjectMember pm = ProjectMember.builder()
            .role(User.Role.MANAGER).build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), manager.getId()))
            .thenReturn(Optional.of(pm));

        taskService.deleteTask(task.getId(), mgrDetails);

        verify(taskRepository).delete(task);
    }

    @Test
    @DisplayName("deleteTask: by regular member throws ForbiddenException")
    void deleteTask_ByMember_ThrowsForbidden() {
        ProjectMember pm = ProjectMember.builder()
            .role(User.Role.MEMBER).build();

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(reporter.getEmail())).thenReturn(Optional.of(reporter));
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), reporter.getId()))
            .thenReturn(Optional.of(pm));

        assertThatThrownBy(() -> taskService.deleteTask(task.getId(), reporterDetails))
            .isInstanceOf(ForbiddenException.class);
    }
}
