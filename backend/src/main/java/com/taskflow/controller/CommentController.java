package com.taskflow.controller;

import com.taskflow.dto.request.CreateCommentRequest;
import com.taskflow.dto.response.CommentResponse;
import com.taskflow.service.CommentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class CommentController {

    private final CommentService commentService;

    @GetMapping("/api/v1/tasks/{taskId}/comments")
    public ResponseEntity<List<CommentResponse>> getComments(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(commentService.getTaskComments(taskId, currentUser));
    }

    @PostMapping("/api/v1/tasks/{taskId}/comments")
    public ResponseEntity<CommentResponse> addComment(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(commentService.addComment(taskId, request, currentUser));
    }

    @PutMapping("/api/v1/comments/{commentId}")
    public ResponseEntity<CommentResponse> editComment(
            @PathVariable UUID commentId,
            @Valid @RequestBody CreateCommentRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(commentService.editComment(commentId, request, currentUser));
    }

    @DeleteMapping("/api/v1/comments/{commentId}")
    public ResponseEntity<Void> deleteComment(
            @PathVariable UUID commentId,
            @AuthenticationPrincipal UserDetails currentUser) {
        commentService.deleteComment(commentId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
