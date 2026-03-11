package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateProjectRequest {
    @Size(min = 1, max = 255)
    private String name;

    @Size(max = 5000)
    private String description;

    @Pattern(regexp = "ACTIVE|ON_HOLD|COMPLETED|ARCHIVED")
    private String status;

    @Pattern(regexp = "PUBLIC|PRIVATE")
    private String visibility;
}
