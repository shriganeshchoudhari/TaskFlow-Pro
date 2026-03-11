package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateMemberRoleRequest {
    @NotBlank
    @Pattern(regexp = "MANAGER|MEMBER|VIEWER")
    private String role;
}
