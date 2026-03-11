package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateTaskStatusRequest {
    @NotBlank
    @Pattern(regexp = "TODO|IN_PROGRESS|REVIEW|DONE",
             message = "Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE")
    private String status;
}
