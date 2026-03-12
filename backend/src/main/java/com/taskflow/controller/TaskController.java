package com.taskflow.controller;

import com.taskflow.dto.request.CreateTaskRequest;
import com.taskflow.dto.request.UpdateTaskRequest;
import com.taskflow.dto.request.UpdateTaskStatusRequest;
import com.taskflow.dto.request.CreateSubtaskRequest;
import com.taskflow.dto.request.LogTimeRequest;
import com.taskflow.dto.response.TaskResponse;
import com.taskflow.dto.response.SubtaskResponse;
import com.taskflow.service.TaskService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
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
@Tag(name = "Tasks", description = "Task CRUD and status management")
public class TaskController {

    private final TaskService taskService;

    // ── My Tasks (must appear before /{taskId} to avoid route conflicts) ──────
    @Operation(summary = "Get my tasks", description = "List all tasks assigned to the current user")
    @GetMapping("/api/v1/tasks/my-tasks")
    public ResponseEntity<Page<TaskResponse>> getMyTasks(
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.getMyTasks(pageable, currentUser));
    }

    // ── Project-scoped task endpoints ─────────────────────────────────────────
    @Operation(summary = "Get project tasks", description = "List tasks in a project with optional filters")
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

    @Operation(summary = "Create task", description = "Create a new task in a project")
    @PostMapping("/api/v1/projects/{projectId}/tasks")
    public ResponseEntity<TaskResponse> createTask(
            @PathVariable UUID projectId,
            @Valid @RequestBody CreateTaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.createTask(projectId, request, currentUser));
    }

    // ── Single task endpoints ─────────────────────────────────────────────────
    @Operation(summary = "Get task", description = "Retrieve a single task by ID")
    @GetMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<TaskResponse> getTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.getTask(taskId, currentUser));
    }

    @Operation(summary = "Update task", description = "Update task title, description, priority, assignee, etc.")
    @PutMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<TaskResponse> updateTask(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.updateTask(taskId, request, currentUser));
    }

    @Operation(summary = "Update task status", description = "Transition task status (enforces valid state machine)")
    @PatchMapping("/api/v1/tasks/{taskId}/status")
    public ResponseEntity<TaskResponse> updateTaskStatus(
            @PathVariable UUID taskId,
            @Valid @RequestBody UpdateTaskStatusRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(
            taskService.updateTaskStatus(taskId, request.getStatus(), currentUser));
    }

    @Operation(summary = "Delete task", description = "Delete a task (managers only)")
    @DeleteMapping("/api/v1/tasks/{taskId}")
    public ResponseEntity<Void> deleteTask(
            @PathVariable UUID taskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        taskService.deleteTask(taskId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ── Subtasks & Time Tracking ──────────────────────────────────────────────

    @Operation(summary = "Add subtask", description = "Add a checklist item to a task")
    @PostMapping("/api/v1/tasks/{taskId}/subtasks")
    public ResponseEntity<SubtaskResponse> addSubtask(
            @PathVariable UUID taskId,
            @Valid @RequestBody CreateSubtaskRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(taskService.addSubtask(taskId, request, currentUser));
    }

    @Operation(summary = "Toggle subtask", description = "Toggle checklist item completion")
    @PatchMapping("/api/v1/subtasks/{subtaskId}/toggle")
    public ResponseEntity<SubtaskResponse> toggleSubtask(
            @PathVariable UUID subtaskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.toggleSubtask(subtaskId, currentUser));
    }

    @Operation(summary = "Delete subtask", description = "Remove a checklist item")
    @DeleteMapping("/api/v1/subtasks/{subtaskId}")
    public ResponseEntity<Void> deleteSubtask(
            @PathVariable UUID subtaskId,
            @AuthenticationPrincipal UserDetails currentUser) {
        taskService.deleteSubtask(subtaskId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Log time", description = "Add hours to the task's logged time")
    @PostMapping("/api/v1/tasks/{taskId}/time")
    public ResponseEntity<TaskResponse> logTime(
            @PathVariable UUID taskId,
            @Valid @RequestBody LogTimeRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(taskService.logTime(taskId, request.getHours(), currentUser));
    }
}
