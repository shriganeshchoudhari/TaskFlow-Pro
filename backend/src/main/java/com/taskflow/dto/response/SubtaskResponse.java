package com.taskflow.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SubtaskResponse {
    private UUID id;
    private String title;
    private Boolean isCompleted;
    private UUID taskId;
    private OffsetDateTime createdAt;
}
