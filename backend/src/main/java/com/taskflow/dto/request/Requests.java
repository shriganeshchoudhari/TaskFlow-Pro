package com.taskflow.dto.request;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

// ─── LoginRequest ─────────────────────────────────────────────────────────────
@Data
public class LoginRequest {
    @NotBlank @Email
    private String email;

    @NotBlank @Size(min = 8)
    private String password;
}

// ─── RegisterRequest ──────────────────────────────────────────────────────────
@Data
public class RegisterRequest {
    @NotBlank @Size(min = 2, max = 100)
    private String fullName;

    @NotBlank @Email
    private String email;

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must be at least 8 characters with uppercase, lowercase, digit and special character"
    )
    private String password;
}

// ─── RefreshTokenRequest ──────────────────────────────────────────────────────
@Data
public class RefreshTokenRequest {
    @NotBlank
    private String refreshToken;
}

// ─── CreateProjectRequest ─────────────────────────────────────────────────────
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

// ─── UpdateProjectRequest ─────────────────────────────────────────────────────
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

// ─── AddProjectMemberRequest ──────────────────────────────────────────────────
@Data
public class AddProjectMemberRequest {
    @NotBlank @Email
    private String email;

    @Pattern(regexp = "MANAGER|MEMBER|VIEWER")
    private String role = "MEMBER";
}

// ─── UpdateMemberRoleRequest ──────────────────────────────────────────────────
@Data
public class UpdateMemberRoleRequest {
    @NotBlank
    @Pattern(regexp = "MANAGER|MEMBER|VIEWER")
    private String role;
}

// ─── CreateTaskRequest ────────────────────────────────────────────────────────
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

// ─── UpdateTaskRequest ────────────────────────────────────────────────────────
@Data
public class UpdateTaskRequest {
    @Size(min = 1, max = 500)
    private String title;

    @Size(max = 10000)
    private String description;

    @Pattern(regexp = "LOW|MEDIUM|HIGH|CRITICAL")
    private String priority;

    private LocalDate dueDate;
    private UUID assigneeId;
    private List<String> tags;
}

// ─── UpdateTaskStatusRequest ──────────────────────────────────────────────────
@Data
public class UpdateTaskStatusRequest {
    @NotBlank
    @Pattern(regexp = "TODO|IN_PROGRESS|REVIEW|DONE",
             message = "Status must be one of: TODO, IN_PROGRESS, REVIEW, DONE")
    private String status;
}

// ─── CreateCommentRequest ─────────────────────────────────────────────────────
@Data
public class CreateCommentRequest {
    @NotBlank @Size(min = 1, max = 10000)
    private String content;
}

// ─── UpdateProfileRequest ─────────────────────────────────────────────────────
@Data
public class UpdateProfileRequest {
    @Size(min = 2, max = 100)
    private String fullName;

    @Size(max = 500)
    private String avatarUrl;
}

// ─── UpdatePasswordRequest ────────────────────────────────────────────────────
@Data
public class UpdatePasswordRequest {
    @NotBlank
    private String currentPassword;

    @NotBlank
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$",
        message = "Password must be at least 8 characters with uppercase, lowercase, digit and special character"
    )
    private String newPassword;

    @NotBlank
    private String confirmPassword;
}
