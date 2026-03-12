package com.taskflow.dto.response;

import com.taskflow.model.Attachment;
import lombok.Builder;
import lombok.Data;

import java.time.ZonedDateTime;
import java.util.UUID;

@Data
@Builder
public class AttachmentResponse {
    private UUID id;
    private UUID taskId;
    private UserResponse uploader;
    private String fileName;
    private String fileType;
    private Long fileSize;
    private String storageUrl;
    private ZonedDateTime createdAt;

    public static AttachmentResponse fromEntity(Attachment attachment) {
        if (attachment == null) return null;
        return AttachmentResponse.builder()
                .id(attachment.getId())
                .taskId(attachment.getTask() != null ? attachment.getTask().getId() : null)
                .uploader(UserResponse.fromEntity(attachment.getUploader()))
                .fileName(attachment.getFileName())
                .fileType(attachment.getFileType())
                .fileSize(attachment.getFileSize())
                .storageUrl(attachment.getStorageUrl())
                .createdAt(attachment.getCreatedAt())
                .build();
    }
}
