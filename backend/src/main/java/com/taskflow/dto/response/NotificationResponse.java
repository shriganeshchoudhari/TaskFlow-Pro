package com.taskflow.dto.response;

import com.taskflow.model.Notification;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationResponse {
    private UUID id;
    private String type;
    private String message;
    private boolean isRead;
    private UUID taskId;
    private String taskTitle;
    private UUID projectId;
    private OffsetDateTime createdAt;

    public static NotificationResponse fromEntity(Notification n) {
        return NotificationResponse.builder()
            .id(n.getId())
            .type(n.getType())
            .message(n.getMessage())
            .isRead(n.isRead())
            .taskId(n.getTask() != null ? n.getTask().getId() : null)
            .taskTitle(n.getTask() != null ? n.getTask().getTitle() : null)
            .projectId(n.getProject() != null ? n.getProject().getId() : null)
            .createdAt(n.getCreatedAt())
            .build();
    }
}
