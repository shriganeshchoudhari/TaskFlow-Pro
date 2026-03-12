package com.taskflow;

import com.taskflow.dto.response.AttachmentResponse;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.model.Attachment;
import com.taskflow.model.Project;
import com.taskflow.model.Task;
import com.taskflow.model.User;
import com.taskflow.repository.AttachmentRepository;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import com.taskflow.service.StorageService;
import com.taskflow.service.ActivityService;
import com.taskflow.service.AttachmentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.Resource;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.userdetails.UserDetails;

import java.time.ZonedDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("AttachmentService Unit Tests")
class AttachmentServiceTest {

    @Mock private AttachmentRepository attachmentRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private StorageService storageService;
    @Mock private ActivityService activityService;

    @InjectMocks private AttachmentServiceImpl attachmentService;

    private User uploader;
    private User stranger;
    private Project project;
    private Task task;
    private Attachment attachment;
    private UserDetails uploaderDetails;
    private UserDetails strangerDetails;

    @BeforeEach
    void setUp() {
        uploader = User.builder().id(UUID.randomUUID()).email("uploader@test.com").isActive(true).build();
        stranger = User.builder().id(UUID.randomUUID()).email("stranger@test.com").isActive(true).build();
        project = Project.builder().id(UUID.randomUUID()).name("Test Project").build();
        task = Task.builder().id(UUID.randomUUID()).project(project).build();
        
        attachment = Attachment.builder()
            .id(UUID.randomUUID())
            .fileName("test.pdf")
            .fileType("application/pdf")
            .fileSize(1024L)
            .storageUrl("/uploads/test.pdf")
            .task(task)
            .uploader(uploader)
            .createdAt(ZonedDateTime.now())
            .build();

        uploaderDetails = mock(UserDetails.class);
        lenient().when(uploaderDetails.getUsername()).thenReturn(uploader.getEmail());
        
        strangerDetails = mock(UserDetails.class);
        lenient().when(strangerDetails.getUsername()).thenReturn(stranger.getEmail());
    }

    @Test
    @DisplayName("uploadAttachment: valid request succeeds")
    void uploadAttachment_ValidRequest_Succeeds() throws Exception {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());
        
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(uploader.getEmail())).thenReturn(Optional.of(uploader));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), uploader.getId())).thenReturn(true);
        when(storageService.storeFile(file)).thenReturn("/uploads/test.pdf");
        
        when(attachmentRepository.save(any(Attachment.class))).thenAnswer(inv -> {
            Attachment a = inv.getArgument(0);
            a.setId(UUID.randomUUID());
            return a;
        });

        AttachmentResponse response = attachmentService.uploadAttachment(task.getId(), file, uploaderDetails);
        
        assertThat(response).isNotNull();
        assertThat(response.getFileName()).isEqualTo("test.pdf");
        verify(storageService).storeFile(file);
    }

    @Test
    @DisplayName("uploadAttachment: user not in project throws Forbidden")
    void uploadAttachment_UserNotInProject_ThrowsForbidden() {
        MockMultipartFile file = new MockMultipartFile("file", "test.pdf", "application/pdf", "dummy content".getBytes());
        
        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), stranger.getId())).thenReturn(false);

        assertThatThrownBy(() -> attachmentService.uploadAttachment(task.getId(), file, strangerDetails))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("deleteAttachment: uploader can delete")
    void deleteAttachment_Uploader_Succeeds() {
        when(attachmentRepository.findById(attachment.getId())).thenReturn(Optional.of(attachment));
        when(userRepository.findByEmail(uploader.getEmail())).thenReturn(Optional.of(uploader));
        
        attachmentService.deleteAttachment(attachment.getId(), uploaderDetails);
        
        verify(storageService).deleteFile(attachment.getStorageUrl());
        verify(attachmentRepository).delete(attachment);
    }

    @Test
    @DisplayName("deleteAttachment: stranger cannot delete")
    void deleteAttachment_Stranger_ThrowsForbidden() {
        when(attachmentRepository.findById(attachment.getId())).thenReturn(Optional.of(attachment));
        when(userRepository.findByEmail(stranger.getEmail())).thenReturn(Optional.of(stranger));
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), stranger.getId())).thenReturn(Optional.empty());
        
        assertThatThrownBy(() -> attachmentService.deleteAttachment(attachment.getId(), strangerDetails))
            .isInstanceOf(ForbiddenException.class);
    }
}
