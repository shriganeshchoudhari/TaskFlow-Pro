package com.taskflow.dto.response;

import com.taskflow.model.*;
import lombok.*;

import java.time.*;
import java.util.*;

// ─── UserResponse ─────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String role;
    private String avatarUrl;
    private boolean isActive;
    private OffsetDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .avatarUrl(user.getAvatarUrl())
            .isActive(user.isActive())
            .createdAt(user.getCreatedAt())
            .build();
    }
}

// ─── AuthResponse ─────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class AuthResponse {
    private String accessToken;
    private String refreshToken;
    private String tokenType;
    private Long expiresIn;
    private UserResponse user;
}

// ─── ProjectResponse ──────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ProjectResponse {
    private UUID id;
    private String name;
    private String description;
    private String status;
    private String visibility;
    private UserResponse owner;
    private int memberCount;
    private long taskCount;
    private long completedTaskCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static ProjectResponse fromEntity(Project project) {
        return ProjectResponse.builder()
            .id(project.getId())
            .name(project.getName())
            .description(project.getDescription())
            .status(project.getStatus().name())
            .visibility(project.getVisibility().name())
            .owner(UserResponse.fromEntity(project.getOwner()))
            .memberCount(project.getMembers().size())
            .taskCount(project.getTasks().size())
            .completedTaskCount(project.getTasks().stream()
                .filter(t -> t.getStatus() == Task.TaskStatus.DONE).count())
            .createdAt(project.getCreatedAt())
            .updatedAt(project.getUpdatedAt())
            .build();
    }
}

// ─── TaskResponse ─────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private UserResponse assignee;
    private UserResponse reporter;
    private UUID projectId;
    private List<String> tags;
    private int commentCount;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static TaskResponse fromEntity(Task task) {
        return TaskResponse.builder()
            .id(task.getId())
            .title(task.getTitle())
            .description(task.getDescription())
            .status(task.getStatus().name())
            .priority(task.getPriority().name())
            .dueDate(task.getDueDate())
            .assignee(task.getAssignee() != null
                ? UserResponse.fromEntity(task.getAssignee()) : null)
            .reporter(UserResponse.fromEntity(task.getReporter()))
            .projectId(task.getProject().getId())
            .tags(task.getTags())
            .commentCount(task.getComments() != null ? task.getComments().size() : 0)
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .build();
    }
}

// ─── NotificationResponse ─────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class NotificationResponse {
    private UUID id;
    private String type;
    private String message;
    private boolean isRead;
    private UUID taskId;
    private String taskTitle;
    private UUID projectId;
    private OffsetDateTime createdAt;
}

// ─── ActivityResponse ─────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ActivityResponse {
    private UUID id;
    private String action;
    private String entityType;
    private UUID entityId;
    private UserResponse actor;
    private String oldValue;
    private String newValue;
    private UUID taskId;
    private String taskTitle;
    private OffsetDateTime createdAt;
}

// ─── PagedResponse ────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class PagedResponse<T> {
    private List<T> content;
    private int page;
    private int size;
    private long totalElements;
    private int totalPages;
    private boolean last;
}

// ─── ErrorResponse ────────────────────────────────────────────────────────────
@Data @Builder @NoArgsConstructor @AllArgsConstructor
class ErrorResponse {
    private int status;
    private String error;
    private String message;
    private List<FieldError> details;
    private String path;
    private OffsetDateTime timestamp;
    private String traceId;

    @Data @AllArgsConstructor
    static class FieldError {
        private String field;
        private String message;
    }
}
