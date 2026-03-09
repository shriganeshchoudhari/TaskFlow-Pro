package com.taskflow.dto.response;

import com.taskflow.model.User;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class UserResponse {
    private UUID id;
    private String fullName;
    private String email;
    private String role;
    private String avatarUrl;
    private boolean isActive;
    private OffsetDateTime createdAt;

    public static UserResponse fromEntity(User user) {
        return UserResponse.builder()
            .id(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .role(user.getRole().name())
            .avatarUrl(user.getAvatarUrl())
            .isActive(user.isActive())
            .createdAt(user.getCreatedAt())
            .build();
    }
}
