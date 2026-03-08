package com.taskflow.service;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.model.Project;
import com.taskflow.model.Task;
import com.taskflow.model.User;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.ProjectRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class TaskService {

    private final TaskRepository taskRepository;
    private final ProjectRepository projectRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    @Transactional(readOnly = true)
    public Page<TaskResponse> getProjectTasks(UUID projectId, String status, String priority,
                                               UUID assigneeId, Pageable pageable,
                                               UserDetails currentUser) {
        User user = resolveUser(currentUser);
        assertProjectMember(projectId, user.getId());

        return taskRepository.findByProjectIdWithFilters(
                projectId, status, priority, assigneeId, pageable)
            .map(TaskResponse::fromEntity);
    }

    @Transactional
    public TaskResponse createTask(UUID projectId, CreateTaskRequest request,
                                    UserDetails currentUser) {
        User reporter = resolveUser(currentUser);
        assertProjectMember(projectId, reporter.getId());

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException("Project not found: " + projectId));

        User assignee = null;
        if (request.getAssigneeId() != null) {
            assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException(
                    "Assignee not found: " + request.getAssigneeId()));
            assertProjectMember(projectId, assignee.getId());
        }

        Task task = Task.builder()
            .title(request.getTitle())
            .description(request.getDescription())
            .status(request.getStatus() != null
                ? Task.TaskStatus.valueOf(request.getStatus()) : Task.TaskStatus.TODO)
            .priority(request.getPriority() != null
                ? Task.TaskPriority.valueOf(request.getPriority()) : Task.TaskPriority.MEDIUM)
            .dueDate(request.getDueDate())
            .project(project)
            .reporter(reporter)
            .assignee(assignee)
            .tags(request.getTags())
            .build();

        Task saved = taskRepository.save(task);

        // Log activity
        activityService.logActivity("TASK_CREATED", "TASK", saved.getId(),
            reporter, project, saved, null, null);

        // Notify assignee
        if (assignee != null && !assignee.getId().equals(reporter.getId())) {
            notificationService.notifyTaskAssigned(assignee, saved, reporter);
        }

        log.info("Task created: {} in project: {}", saved.getId(), projectId);
        return TaskResponse.fromEntity(saved);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID taskId, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());
        return TaskResponse.fromEntity(task);
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, CreateTaskRequest request,
                                    UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertCanModifyTask(task, user);

        if (request.getTitle() != null) task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null)
            task.setPriority(Task.TaskPriority.valueOf(request.getPriority()));
        if (request.getDueDate() != null) task.setDueDate(request.getDueDate());
        if (request.getTags() != null) task.setTags(request.getTags());

        if (request.getAssigneeId() != null) {
            User assignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            task.setAssignee(assignee);
        }

        Task saved = taskRepository.save(task);
        activityService.logActivity("TASK_UPDATED", "TASK", saved.getId(),
            user, task.getProject(), saved, null, null);

        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public TaskResponse updateTaskStatus(UUID taskId, String newStatus,
                                          UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        String oldStatus = task.getStatus().name();
        task.setStatus(Task.TaskStatus.valueOf(newStatus));
        Task saved = taskRepository.save(task);

        activityService.logActivity("TASK_STATUS_CHANGED", "TASK", saved.getId(),
            user, task.getProject(), saved, oldStatus, newStatus);

        return TaskResponse.fromEntity(saved);
    }

    @Transactional
    public void deleteTask(UUID taskId, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertCanDeleteTask(task, user);

        taskRepository.delete(task);
        log.info("Task deleted: {} by user: {}", taskId, user.getEmail());
    }

    // ── Helpers ────────────────────────────────────────────────────────────────

    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
    }

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private void assertProjectMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new UnauthorizedException("User is not a member of this project");
        }
    }

    private void assertCanModifyTask(Task task, User user) {
        boolean isAssignee = task.getAssignee() != null &&
            task.getAssignee().getId().equals(user.getId());
        boolean isReporter = task.getReporter().getId().equals(user.getId());
        boolean isManager = user.getRole() == User.Role.MANAGER ||
            user.getRole() == User.Role.ADMIN;
        boolean isProjectManager = projectMemberRepository
            .findByProjectIdAndUserId(task.getProject().getId(), user.getId())
            .map(pm -> pm.getRole() == User.Role.MANAGER)
            .orElse(false);

        if (!isAssignee && !isReporter && !isManager && !isProjectManager) {
            throw new UnauthorizedException("You don't have permission to modify this task");
        }
    }

    private void assertCanDeleteTask(Task task, User user) {
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        boolean isProjectManager = projectMemberRepository
            .findByProjectIdAndUserId(task.getProject().getId(), user.getId())
            .map(pm -> pm.getRole() == User.Role.MANAGER)
            .orElse(false);

        if (!isAdmin && !isProjectManager) {
            throw new UnauthorizedException("Only project managers can delete tasks");
        }
    }
}
