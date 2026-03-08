package com.taskflow.controller;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskStatusRequest;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.security.UserDetailsServiceImpl;
import com.taskflow.service.TaskService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class TaskController {

    private final TaskService taskService;

    // ── List tasks in a project ────────────────────────────────────────────────
    @GetMapping("/api/v1/projects/{projectId}/tasks")
    public ResponseEntity<Page<TaskResponse>> getProjectTasks(
            @PathVariable UUID projectId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String priority,
            @RequestParam(required = false) UUID assigneeId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        Page<TaskResponse> tasks = taskService.getProjectTasks(
            projectId, status, priority, assigneeId, pageable, currentUser);
        return ResponseEntity.ok(tasks);
    }

    // ── Create task in a project ───────────────────────────────────────────────
    @PostMapping("/api/v1/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        TaskResponse task = taskService.createTask(projectId, request, currentUser);
        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    // ── Get single task ────────────────────────────────────────────────────────
    @GetMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        TaskResponse task = taskService.getTask(taskId, currentUser);
        return ResponseEntity.ok(task);
    }

    // ── Update task ────────────────────────────────────────────────────────────
    @PutMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        TaskResponse task = taskService.updateTask(taskId, request, currentUser);
        return ResponseEntity.ok(task);
    }

    // ── Update task status ─────────────────────────────────────────────────────
    @PatchMapping("/api/v1/tasks/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        TaskResponse task = taskService.updateTaskStatus(taskId, request.getStatus(), currentUser);
        return ResponseEntity.ok(task);
    }

    // ── Delete task ────────────────────────────────────────────────────────────
    @DeleteMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        taskService.deleteTask(taskId, currentUser);
        return ResponseEntity.noContent().build();
    }
}
