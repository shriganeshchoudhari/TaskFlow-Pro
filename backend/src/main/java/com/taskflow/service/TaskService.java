package com.taskflow.service;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.dto.request.CreateSubtaskRequest;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.dto.response.SubtaskResponse;
import com.taskflow.exception.*;
import com.taskflow.model.*;
import com.taskflow.repository.*;
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
    private final org.springframework.messaging.simp.SimpMessagingTemplate messagingTemplate;
    private final SubtaskRepository subtaskRepository;

    // ── Queries ───────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<TaskResponse> getProjectTasks(UUID projectId, String status, String priority,
                                               UUID assigneeId, Pageable pageable,
                                               UserDetails currentUser) {
        User user = resolveUser(currentUser);
        assertProjectMember(projectId, user.getId());
        return taskRepository
            .findByProjectIdWithFilters(projectId, status, priority, assigneeId, pageable)
            .map(TaskResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<TaskResponse> getMyTasks(Pageable pageable, UserDetails currentUser) {
        User user = resolveUser(currentUser);
        return taskRepository.findByAssigneeId(user.getId(), pageable)
            .map(TaskResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public TaskResponse getTask(UUID taskId, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());
        return TaskResponse.fromEntity(task);
    }

    // ── Mutations ─────────────────────────────────────────────────────────────

    @Transactional
    public TaskResponse createTask(UUID projectId, CreateTaskRequest request,
                                    UserDetails currentUser) {
        User reporter = resolveUser(currentUser);
        assertProjectMember(projectId, reporter.getId());

        Project project = projectRepository.findById(projectId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Project not found: " + projectId));

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
            .estimatedHours(request.getEstimatedHours())
            .tags(request.getTags() != null ? request.getTags() : new java.util.ArrayList<>())
            .build();

        Task saved = taskRepository.save(task);

        activityService.logActivity("TASK_CREATED", "TASK", saved.getId(),
            reporter, project, saved, null, null);

        if (assignee != null && !assignee.getId().equals(reporter.getId())) {
            notificationService.notifyTaskAssigned(assignee, saved, reporter);
        }

        log.info("Task created: {} in project: {}", saved.getId(), projectId);
        TaskResponse response = TaskResponse.fromEntity(saved);
        broadcastTaskUpdate(projectId, response, "TASK_CREATED");
        return response;
    }

    @Transactional
    public TaskResponse updateTask(UUID taskId, UpdateTaskRequest request,
                                    UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertCanModifyTask(task, user);

        if (request.getTitle() != null)       task.setTitle(request.getTitle());
        if (request.getDescription() != null) task.setDescription(request.getDescription());
        if (request.getPriority() != null)
            task.setPriority(Task.TaskPriority.valueOf(request.getPriority()));
        if (request.getDueDate() != null)     task.setDueDate(request.getDueDate());
        if (request.getTags() != null)        task.setTags(request.getTags());
        if (request.getEstimatedHours() != null) task.setEstimatedHours(request.getEstimatedHours());

        if (request.getAssigneeId() != null) {
            User newAssignee = userRepository.findById(request.getAssigneeId())
                .orElseThrow(() -> new ResourceNotFoundException("Assignee not found"));
            assertProjectMember(task.getProject().getId(), newAssignee.getId());
            task.setAssignee(newAssignee);
        }

        Task saved = taskRepository.save(task);
        activityService.logActivity("TASK_UPDATED", "TASK", saved.getId(),
            user, task.getProject(), saved, null, null);
        
        TaskResponse response = TaskResponse.fromEntity(saved);
        broadcastTaskUpdate(task.getProject().getId(), response, "TASK_UPDATED");
        return response;
    }

    @Transactional
    public TaskResponse updateTaskStatus(UUID taskId, String newStatus,
                                          UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        Task.TaskStatus current = task.getStatus();
        Task.TaskStatus next    = Task.TaskStatus.valueOf(newStatus);

        if (!isValidTransition(current, next)) {
            throw new InvalidStatusTransitionException(current.name(), next.name());
        }

        String oldStatusName = current.name();
        task.setStatus(next);
        Task saved = taskRepository.save(task);

        activityService.logActivity("TASK_STATUS_CHANGED", "TASK", saved.getId(),
            user, task.getProject(), saved, oldStatusName, newStatus);

        notificationService.notifyStatusChanged(saved, user, oldStatusName, newStatus);

        TaskResponse response = TaskResponse.fromEntity(saved);
        broadcastTaskUpdate(task.getProject().getId(), response, "TASK_STATUS_CHANGED");
        return response;
    }

    @Transactional
    public void deleteTask(UUID taskId, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertCanDeleteTask(task, user);
        
        UUID projectId = task.getProject().getId();
        taskRepository.delete(task);
        log.info("Task deleted: {} by user: {}", taskId, user.getEmail());
        
        try {
            messagingTemplate.convertAndSend(
                "/topic/project/" + projectId + "/tasks",
                java.util.Map.of("taskId", taskId, "action", "TASK_DELETED")
            );
        } catch (Exception e) {
            log.warn("Failed to broadcast task deletion: {}", e.getMessage());
        }
    }

    // ── Subtasks & Time Tracking ─────────────────────────────────────────────

    @Transactional
    public SubtaskResponse addSubtask(UUID taskId, CreateSubtaskRequest request, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        Subtask subtask = Subtask.builder()
            .title(request.getTitle())
            .task(task)
            .isCompleted(false)
            .build();
            
        Subtask saved = subtaskRepository.save(subtask);
        
        TaskResponse response = TaskResponse.fromEntity(task);
        broadcastTaskUpdate(task.getProject().getId(), response, "SUBTASK_ADDED");
        
        return SubtaskResponse.builder()
            .id(saved.getId())
            .title(saved.getTitle())
            .isCompleted(saved.getIsCompleted())
            .taskId(task.getId())
            .createdAt(saved.getCreatedAt())
            .build();
    }

    @Transactional
    public SubtaskResponse toggleSubtask(UUID subtaskId, UserDetails currentUser) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
            .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        Task task = subtask.getTask();
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        subtask.setIsCompleted(!subtask.getIsCompleted());
        Subtask saved = subtaskRepository.save(subtask);
        
        TaskResponse response = TaskResponse.fromEntity(task);
        broadcastTaskUpdate(task.getProject().getId(), response, "SUBTASK_TOGGLED");

        return SubtaskResponse.builder()
            .id(saved.getId())
            .title(saved.getTitle())
            .isCompleted(saved.getIsCompleted())
            .taskId(task.getId())
            .createdAt(saved.getCreatedAt())
            .build();
    }

    @Transactional
    public void deleteSubtask(UUID subtaskId, UserDetails currentUser) {
        Subtask subtask = subtaskRepository.findById(subtaskId)
            .orElseThrow(() -> new ResourceNotFoundException("Subtask not found"));
        Task task = subtask.getTask();
        User user = resolveUser(currentUser);
        assertCanModifyTask(task, user);

        subtaskRepository.delete(subtask);
        
        TaskResponse response = TaskResponse.fromEntity(task);
        broadcastTaskUpdate(task.getProject().getId(), response, "SUBTASK_DELETED");
    }

    @Transactional
    public TaskResponse logTime(UUID taskId, Double hours, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        Double currentLogged = task.getLoggedHours() != null ? task.getLoggedHours() : 0.0;
        task.setLoggedHours(currentLogged + hours);
        
        Task saved = taskRepository.save(task);
        
        TaskResponse response = TaskResponse.fromEntity(saved);
        broadcastTaskUpdate(task.getProject().getId(), response, "TIME_LOGGED");
        return response;
    }

    // ── Status Transition Rules ───────────────────────────────────────────────

    private boolean isValidTransition(Task.TaskStatus from, Task.TaskStatus to) {
        if (from == to) return true;
        return switch (from) {
            case TODO        -> to == Task.TaskStatus.IN_PROGRESS;
            case IN_PROGRESS -> to == Task.TaskStatus.REVIEW || to == Task.TaskStatus.TODO;
            case REVIEW      -> to == Task.TaskStatus.DONE   || to == Task.TaskStatus.IN_PROGRESS;
            case DONE        -> to == Task.TaskStatus.REVIEW; // allow re-open to review
        };
    }

    // ── Permission Helpers ────────────────────────────────────────────────────

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
            throw new ForbiddenException("You are not a member of this project");
        }
    }

    private void assertCanModifyTask(Task task, User user) {
        boolean isAssignee = task.getAssignee() != null &&
            task.getAssignee().getId().equals(user.getId());
        boolean isReporter = task.getReporter().getId().equals(user.getId());
        boolean isGlobalAdmin = user.getRole() == User.Role.ADMIN;
        boolean isProjectManager = projectMemberRepository
            .findByProjectIdAndUserId(task.getProject().getId(), user.getId())
            .map(pm -> pm.getRole() == User.Role.MANAGER).orElse(false);

        if (!isAssignee && !isReporter && !isGlobalAdmin && !isProjectManager) {
            throw new ForbiddenException(
                "You don't have permission to modify this task");
        }
    }

    private void assertCanDeleteTask(Task task, User user) {
        boolean isAdmin = user.getRole() == User.Role.ADMIN;
        boolean isProjectManager = projectMemberRepository
            .findByProjectIdAndUserId(task.getProject().getId(), user.getId())
            .map(pm -> pm.getRole() == User.Role.MANAGER).orElse(false);

        if (!isAdmin && !isProjectManager) {
            throw new ForbiddenException("Only project managers can delete tasks");
        }
    }

    private void broadcastTaskUpdate(UUID projectId, TaskResponse task, String action) {
        try {
            java.util.Map<String, Object> payload = new java.util.HashMap<>();
            payload.put("action", action);
            payload.put("task", task);
            messagingTemplate.convertAndSend("/topic/project/" + projectId + "/tasks", payload);
        } catch (Exception e) {
            log.warn("Failed to broadcast task update: {}", e.getMessage());
        }
    }
}
