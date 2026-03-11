package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class AddProjectMemberRequest {
    @NotBlank @Email
    private String email;

    @Pattern(regexp = "MANAGER|MEMBER|VIEWER")
    private String role = "MEMBER";
}
