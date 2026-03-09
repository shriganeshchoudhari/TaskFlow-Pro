package com.taskflow.service;

import com.taskflow.dto.request.CreateCommentRequest;
import com.taskflow.dto.response.CommentResponse;
import com.taskflow.exception.*;
import com.taskflow.model.*;
import com.taskflow.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class CommentService {

    private final CommentRepository commentRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationService notificationService;
    private final ActivityService activityService;

    @Transactional(readOnly = true)
    public List<CommentResponse> getTaskComments(UUID taskId, UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User user = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), user.getId());
        return commentRepository.findByTaskIdOrderByCreatedAtAsc(taskId)
            .stream().map(CommentResponse::fromEntity).toList();
    }

    @Transactional
    public CommentResponse addComment(UUID taskId, CreateCommentRequest req,
                                       UserDetails currentUser) {
        Task task = findTaskOrThrow(taskId);
        User author = resolveUser(currentUser);
        assertProjectMember(task.getProject().getId(), author.getId());

        Comment comment = Comment.builder()
            .content(req.getContent())
            .task(task)
            .author(author)
            .build();
        Comment saved = commentRepository.save(comment);

        notificationService.notifyCommentAdded(task, author);
        activityService.logActivity("COMMENT_ADDED", "COMMENT", saved.getId(),
            author, task.getProject(), task, null, null);

        return CommentResponse.fromEntity(saved);
    }

    @Transactional
    public CommentResponse editComment(UUID commentId, CreateCommentRequest req,
                                        UserDetails currentUser) {
        Comment comment = findCommentOrThrow(commentId);
        User user = resolveUser(currentUser);

        if (!comment.getAuthor().getId().equals(user.getId())) {
            throw new ForbiddenException("You can only edit your own comments");
        }

        comment.setContent(req.getContent());
        comment.setEdited(true);
        return CommentResponse.fromEntity(commentRepository.save(comment));
    }

    @Transactional
    public void deleteComment(UUID commentId, UserDetails currentUser) {
        Comment comment = findCommentOrThrow(commentId);
        User user = resolveUser(currentUser);
        UUID projectId = comment.getTask().getProject().getId();

        boolean isAuthor    = comment.getAuthor().getId().equals(user.getId());
        boolean isManager   = projectMemberRepository
            .findByProjectIdAndUserId(projectId, user.getId())
            .map(pm -> pm.getRole() == User.Role.MANAGER).orElse(false);
        boolean isAdmin     = user.getRole() == User.Role.ADMIN;

        if (!isAuthor && !isManager && !isAdmin) {
            throw new ForbiddenException(
                "You don't have permission to delete this comment");
        }
        commentRepository.delete(comment);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Task findTaskOrThrow(UUID taskId) {
        return taskRepository.findById(taskId)
            .orElseThrow(() -> new ResourceNotFoundException("Task not found: " + taskId));
    }

    private Comment findCommentOrThrow(UUID id) {
        return commentRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Comment not found: " + id));
    }

    private User resolveUser(UserDetails u) {
        return userRepository.findByEmail(u.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }

    private void assertProjectMember(UUID projectId, UUID userId) {
        if (!projectMemberRepository.existsByProjectIdAndUserId(projectId, userId)) {
            throw new ForbiddenException("You are not a member of this project");
        }
    }
}
