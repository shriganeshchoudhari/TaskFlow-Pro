package com.taskflow.dto.response;

import com.taskflow.model.ProjectMember;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class MemberResponse {
    private UUID userId;
    private String fullName;
    private String email;
    private String avatarUrl;
    private String role;
    private OffsetDateTime joinedAt;

    public static MemberResponse fromEntity(ProjectMember pm) {
        return MemberResponse.builder()
            .userId(pm.getUser().getId())
            .fullName(pm.getUser().getFullName())
            .email(pm.getUser().getEmail())
            .avatarUrl(pm.getUser().getAvatarUrl())
            .role(pm.getRole().name())
            .joinedAt(pm.getJoinedAt())
            .build();
    }
}
