package com.taskflow;

import com.taskflow.dto.request.CreateCommentRequest;
import com.taskflow.dto.response.CommentResponse;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.model.*;
import com.taskflow.repository.*;
import com.taskflow.service.ActivityService;
import com.taskflow.service.CommentService;
import com.taskflow.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;

import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("CommentService Unit Tests")
class CommentServiceTest {

    @Mock private CommentRepository commentRepository;
    @Mock private TaskRepository taskRepository;
    @Mock private UserRepository userRepository;
    @Mock private ProjectMemberRepository projectMemberRepository;
    @Mock private NotificationService notificationService;
    @Mock private ActivityService activityService;

    @InjectMocks private CommentService commentService;

    private User author;
    private User otherUser;
    private User manager;
    private Project project;
    private Task task;
    private Comment comment;
    private UserDetails authorDetails;
    private UserDetails otherDetails;
    private UserDetails managerDetails;

    @BeforeEach
    void setUp() {
        author = User.builder().id(UUID.randomUUID()).email("author@test.com")
            .fullName("Author").role(User.Role.MEMBER).isActive(true).build();
        otherUser = User.builder().id(UUID.randomUUID()).email("other@test.com")
            .fullName("Other").role(User.Role.MEMBER).isActive(true).build();
        manager = User.builder().id(UUID.randomUUID()).email("mgr@test.com")
            .fullName("Manager").role(User.Role.MEMBER).isActive(true).build();

        project = Project.builder().id(UUID.randomUUID()).name("Proj").build();
        task = Task.builder().id(UUID.randomUUID()).title("Task")
            .project(project).reporter(author).assignee(otherUser).build();

        comment = Comment.builder().id(UUID.randomUUID()).content("Test comment")
            .task(task).author(author).build();

        authorDetails = mock(UserDetails.class);
        lenient().when(authorDetails.getUsername()).thenReturn(author.getEmail());
        otherDetails = mock(UserDetails.class);
        lenient().when(otherDetails.getUsername()).thenReturn(otherUser.getEmail());
        managerDetails = mock(UserDetails.class);
        lenient().when(managerDetails.getUsername()).thenReturn(manager.getEmail());
    }

    @Test
    @DisplayName("addComment: valid request creates comment and notifies")
    void addComment_ValidRequest_CreatesComment() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("A comment");

        when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), author.getId()))
            .thenReturn(true);
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        CommentResponse response = commentService.addComment(task.getId(), req, authorDetails);
        assertThat(response).isNotNull();
        verify(notificationService).notifyCommentAdded(task, author);
    }

    @Test
    @DisplayName("addComment: non-member throws ForbiddenException")
    void addComment_UserNotInProject_ThrowsForbidden() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("Hack");

        lenient().when(taskRepository.findById(task.getId())).thenReturn(Optional.of(task));
        lenient().when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));
        lenient().when(projectMemberRepository.existsByProjectIdAndUserId(project.getId(), otherUser.getId()))
            .thenReturn(false);

        assertThatThrownBy(() -> commentService.addComment(task.getId(), req, otherDetails))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("editComment: by author succeeds")
    void editComment_ByAuthor_Succeeds() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("Updated");

        when(commentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));
        when(commentRepository.save(any(Comment.class))).thenReturn(comment);

        CommentResponse response = commentService.editComment(comment.getId(), req, authorDetails);
        assertThat(response).isNotNull();
    }

    @Test
    @DisplayName("editComment: by non-author throws ForbiddenException")
    void editComment_ByOtherUser_ThrowsForbidden() {
        CreateCommentRequest req = new CreateCommentRequest();
        req.setContent("Hacked");

        lenient().when(commentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));
        lenient().when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));

        assertThatThrownBy(() -> commentService.editComment(comment.getId(), req, otherDetails))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("deleteComment: by author succeeds")
    void deleteComment_ByAuthor_Succeeds() {
        when(commentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(author.getEmail())).thenReturn(Optional.of(author));

        commentService.deleteComment(comment.getId(), authorDetails);
        verify(commentRepository).delete(comment);
    }

    @Test
    @DisplayName("deleteComment: by manager succeeds")
    void deleteComment_ByManager_Succeeds() {
        ProjectMember pm = ProjectMember.builder().role(User.Role.MANAGER).build();

        when(commentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));
        when(userRepository.findByEmail(manager.getEmail())).thenReturn(Optional.of(manager));
        when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), manager.getId()))
            .thenReturn(Optional.of(pm));

        commentService.deleteComment(comment.getId(), managerDetails);
        verify(commentRepository).delete(comment);
    }

    @Test
    @DisplayName("deleteComment: by stranger throws ForbiddenException")
    void deleteComment_ByStranger_ThrowsForbidden() {
        lenient().when(commentRepository.findById(comment.getId())).thenReturn(Optional.of(comment));
        lenient().when(userRepository.findByEmail(otherUser.getEmail())).thenReturn(Optional.of(otherUser));
        lenient().when(projectMemberRepository.findByProjectIdAndUserId(project.getId(), otherUser.getId()))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> commentService.deleteComment(comment.getId(), otherDetails))
            .isInstanceOf(ForbiddenException.class);
    }
}
