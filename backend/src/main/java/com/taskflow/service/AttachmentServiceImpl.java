package com.taskflow.service;

import com.taskflow.dto.response.AttachmentResponse;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.model.Attachment;
import com.taskflow.model.Project;
import com.taskflow.model.ProjectMember;
import com.taskflow.model.Task;
import com.taskflow.model.User;
import com.taskflow.repository.AttachmentRepository;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AttachmentServiceImpl implements AttachmentService {

    private final AttachmentRepository attachmentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final StorageService storageService;
    private final ActivityService activityService;

    @Override
    @Transactional
    public AttachmentResponse uploadAttachment(UUID taskId, MultipartFile file, UserDetails currentUser) {
        Task task = findTask(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        // Store file physically
        String storedFileName = storageService.storeFile(file);

        // Save DB record
        Attachment attachment = Attachment.builder()
                .task(task)
                .uploader(user)
                .fileName(file.getOriginalFilename() != null ? file.getOriginalFilename() : storedFileName)
                .fileType(file.getContentType() != null ? file.getContentType() : "application/octet-stream")
                .fileSize(file.getSize())
                .storageUrl(storedFileName) // for local, just use the stored name. for S3, this would be the absolute URL
                .build();

        Attachment saved = attachmentRepository.save(attachment);

        activityService.logActivity("ATTACHMENT_ADDED", "ATTACHMENT", saved.getId(),
                user, task.getProject(), task, null, saved.getFileName());

        return AttachmentResponse.fromEntity(saved);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttachmentResponse> getTaskAttachments(UUID taskId, UserDetails currentUser) {
        Task task = findTask(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());

        return attachmentRepository.findByTaskIdOrderByCreatedAtDesc(taskId)
                .stream()
                .map(AttachmentResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadAttachment(UUID attachmentId, UserDetails currentUser) {
        Attachment attachment = getAttachment(attachmentId);
        User user = resolveUser(currentUser);
        assertProjectMember(attachment.getTask().getProject().getId(), user.getId());

        return storageService.loadFileAsResource(attachment.getStorageUrl());
    }

    @Override
    @Transactional
    public void deleteAttachment(UUID attachmentId, UserDetails currentUser) {
        Attachment attachment = getAttachment(attachmentId);
        User user = resolveUser(currentUser);
        
        // Only uploader or project manager/admin can delete
        boolean isUploader = attachment.getUploader().getId().equals(user.getId());
        boolean isProjectManager = projectMemberRepository
                .findByProjectIdAndUserId(attachment.getTask().getProject().getId(), user.getId())
                .map(pm -> pm.getRole() == User.Role.MANAGER).orElse(false);
        boolean isAdmin = user.getRole() == User.Role.ADMIN;

        if (!isUploader && !isProjectManager && !isAdmin) {
            throw new ForbiddenException("You don't have permission to delete this attachment");
        }

        storageService.deleteFile(attachment.getStorageUrl());
        attachmentRepository.delete(attachment);
        
        activityService.logActivity("ATTACHMENT_DELETED", "ATTACHMENT", attachmentId,
                user, attachment.getTask().getProject(), attachment.getTask(), attachment.getFileName(), null);
    }

    @Override
    @Transactional(readOnly = true)
    public Attachment getAttachment(UUID attachmentId) {
        return attachmentRepository.findById(attachmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Attachment not found: " + attachmentId));
    }

    // ── Helpers ─────────────────────────────────────────────────────────────────

    private Task findTask(UUID taskId) {
        return taskRepository.findById(taskId)
                .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
    }

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
                .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private void assertProjectMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ForbiddenException("You are not a member of this project");
        }
    }
}
