package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class CreateProjectRequest {
    @NotBlank @Size(min = 1, max = 255)
    private String name;

    @Size(max = 5000)
    private String description;

    @Pattern(regexp = "PUBLIC|PRIVATE", message = "Visibility must be PUBLIC or PRIVATE")
    private String visibility = "PRIVATE";

    @Pattern(regexp = "ACTIVE|ON_HOLD|COMPLETED")
    private String status = "ACTIVE";
}
