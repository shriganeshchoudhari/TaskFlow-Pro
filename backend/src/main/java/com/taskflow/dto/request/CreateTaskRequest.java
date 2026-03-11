package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

@Data
public class CreateTaskRequest {
    @NotBlank @Size(min = 1, max = 500)
    private String title;

    @Size(max = 10000)
    private String description;

    @Pattern(regexp = "TODO|IN_PROGRESS|REVIEW|DONE")
    private String status;

    @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL")
    private String priority;

    private LocalDate dueDate;
    private UUID assigneeId;
    private List<String> tags;
}
