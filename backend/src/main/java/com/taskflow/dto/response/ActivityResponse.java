package com.taskflow.dto.response;

import com.taskflow.model.Activity;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ActivityResponse {
    private UUID id;
    private String action;
    private String entityType;
    private UUID entityId;
    private UserResponse actor;
    private String oldValue;
    private String newValue;
    private UUID taskId;
    private String taskTitle;
    private UUID projectId;
    private OffsetDateTime createdAt;

    public static ActivityResponse fromEntity(Activity a) {
        return ActivityResponse.builder()
            .id(a.getId())
            .action(a.getAction())
            .entityType(a.getEntityType())
            .entityId(a.getEntityId())
            .actor(UserResponse.fromEntity(a.getActor()))
            .oldValue(a.getOldValue())
            .newValue(a.getNewValue())
            .taskId(a.getTask() != null ? a.getTask().getId() : null)
            .taskTitle(a.getTask() != null ? a.getTask().getTitle() : null)
            .projectId(a.getProject() != null ? a.getProject().getId() : null)
            .createdAt(a.getCreatedAt())
            .build();
    }
}
