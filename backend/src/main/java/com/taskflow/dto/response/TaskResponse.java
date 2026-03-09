package com.taskflow.dto.response;

import com.taskflow.model.Task;
import lombok.*;

import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class TaskResponse {
    private UUID id;
    private String title;
    private String description;
    private String status;
    private String priority;
    private LocalDate dueDate;
    private UserResponse assignee;
    private UserResponse reporter;
    private UUID projectId;
    private String projectName;
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
            .projectName(task.getProject().getName())
            .tags(task.getTags() != null ? task.getTags() : List.of())
            .commentCount(task.getComments() != null ? task.getComments().size() : 0)
            .createdAt(task.getCreatedAt())
            .updatedAt(task.getUpdatedAt())
            .build();
    }
}
