package com.taskflow.dto.response;

import com.taskflow.model.Project;
import com.taskflow.model.Task;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class ProjectResponse {
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
