package com.taskflow.service;

import com.taskflow.dto.response.AttachmentResponse;
import com.taskflow.model.Attachment;
import org.springframework.core.io.Resource;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.List;
import java.util.UUID;

public interface AttachmentService {
    AttachmentResponse uploadAttachment(UUID taskId, MultipartFile file, UserDetails currentUser);
    List<AttachmentResponse> getTaskAttachments(UUID taskId, UserDetails currentUser);
    Resource downloadAttachment(UUID attachmentId, UserDetails currentUser);
    void deleteAttachment(UUID attachmentId, UserDetails currentUser);
    Attachment getAttachment(UUID attachmentId);
}
