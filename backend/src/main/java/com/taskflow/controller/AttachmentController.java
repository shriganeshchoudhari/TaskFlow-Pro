package com.taskflow.controller;

import com.taskflow.dto.response.AttachmentResponse;
import com.taskflow.model.Attachment;
import com.taskflow.service.AttachmentService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
@Tag(name = "Attachments", description = "Endpoints for managing task file attachments")
public class AttachmentController {

    private final AttachmentService attachmentService;

    @Operation(summary = "Upload an attachment to a task")
    @PostMapping(value = "/tasks/{taskId}/attachments", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public AttachmentResponse uploadFile(
            @PathVariable UUID taskId,
            @RequestParam("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails currentUser) {
        return attachmentService.uploadAttachment(taskId, file, currentUser);
    }

    @Operation(summary = "Get all attachments for a task")
    @GetMapping("/tasks/{taskId}/attachments")
    public List<AttachmentResponse> getTaskAttachments(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return attachmentService.getTaskAttachments(taskId, currentUser);
    }

    @Operation(summary = "Download an attachment")
    @GetMapping("/attachments/{attachmentId}/download")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal UserDetails currentUser) {
        
        Resource resource = attachmentService.downloadAttachment(attachmentId, currentUser);
        Attachment attachment = attachmentService.getAttachment(attachmentId);

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(attachment.getFileType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + attachment.getFileName() + "\"")
                .body(resource);
    }

    @Operation(summary = "Delete an attachment")
    @DeleteMapping("/attachments/{attachmentId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteAttachment(
            @PathVariable UUID attachmentId,
            @AuthenticationPrincipal UserDetails currentUser) {
        attachmentService.deleteAttachment(attachmentId, currentUser);
    }
}
