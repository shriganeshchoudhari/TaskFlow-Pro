package com.taskflow.dto.response;

import com.taskflow.model.Comment;
import lombok.*;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class CommentResponse {
    private UUID id;
    private String content;
    private boolean isEdited;
    private UserResponse author;
    private UUID taskId;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public static CommentResponse fromEntity(Comment comment) {
        return CommentResponse.builder()
            .id(comment.getId())
            .content(comment.getContent())
            .isEdited(comment.isEdited())
            .author(UserResponse.fromEntity(comment.getAuthor()))
            .taskId(comment.getTask().getId())
            .createdAt(comment.getCreatedAt())
            .updatedAt(comment.getUpdatedAt())
            .build();
    }
}
