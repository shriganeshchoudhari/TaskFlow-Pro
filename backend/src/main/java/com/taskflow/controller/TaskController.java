package com.taskflow.controller;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.dto.request.UpdateTaskStatusRequest;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // ── My Tasks (must appear before /{taskId} to avoid route conflicts) ──────
    @GetMapping("/api/v1/tasks/my-tasks")
    public ResponseEntity<Page<TaskResponse>> getMyTasks(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.getMyTasks(pageable, currentUser));
    }

    // ── Project-scoped task endpoints ─────────────────────────────────────────
    @GetMapping("/api/v1/projects/{projectId}/tasks")
    public ResponseEntity<Page<TaskResponse>> getProjectTasks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID assigneeId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.getProjectTasks(
            projectId, status, priority, assigneeId, pageable, currentUser));
    }

    @PostMapping("/api/v1/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.createTask(projectId, request, currentUser));
    }

    // ── Single task endpoints ─────────────────────────────────────────────────
    @GetMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.getTask(taskId, currentUser));
    }

    @PutMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, currentUser));
    }

    @PatchMapping("/api/v1/tasks/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(
            taskService.updateTaskStatus(taskId, request.getStatus(), currentUser));
    }

    @DeleteMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        taskService.deleteTask(taskId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
