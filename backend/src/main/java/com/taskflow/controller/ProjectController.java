package com.taskflow.controller;

import com.taskflow.dto.request.*;
import com.taskflow.dto.response.*;
import com.taskflow.service.ProjectService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/projects")
@RequiredArgsConstructor
public class ProjectController {

    private final ProjectService projectService;

    @GetMapping
    public ResponseEntity<Page<ProjectResponse>> getProjects(
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0")  int page,
            @RequestParam(defaultValue = "20") int size,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(
            projectService.getProjects(status, page, size, currentUser));
    }

    @PostMapping
    public ResponseEntity<ProjectResponse> createProject(
            @Valid @RequestBody CreateProjectRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectService.createProject(request, currentUser));
    }

    @GetMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> getProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(projectService.getById(projectId, currentUser));
    }

    @PutMapping("/{projectId}")
    public ResponseEntity<ProjectResponse> updateProject(
            @PathVariable UUID projectId,
            @Valid @RequestBody UpdateProjectRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(
            projectService.updateProject(projectId, request, currentUser));
    }

    @DeleteMapping("/{projectId}")
    public ResponseEntity<Void> archiveProject(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        projectService.archiveProject(projectId, currentUser);
        return ResponseEntity.noContent().build();
    }

    // ── Members ───────────────────────────────────────────────────────────────

    @GetMapping("/{projectId}/members")
    public ResponseEntity<List<MemberResponse>> getMembers(
            @PathVariable UUID projectId,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(projectService.getMembers(projectId, currentUser));
    }

    @PostMapping("/{projectId}/members")
    public ResponseEntity<MemberResponse> addMember(
            @PathVariable UUID projectId,
            @Valid @RequestBody AddProjectMemberRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(projectService.addMember(projectId, request, currentUser));
    }

    @DeleteMapping("/{projectId}/members/{userId}")
    public ResponseEntity<Void> removeMember(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @AuthenticationPrincipal UserDetails currentUser) {
        projectService.removeMember(projectId, userId, currentUser);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/{projectId}/members/{userId}/role")
    public ResponseEntity<MemberResponse> updateMemberRole(
            @PathVariable UUID projectId,
            @PathVariable UUID userId,
            @Valid @RequestBody UpdateMemberRoleRequest request,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(
            projectService.updateMemberRole(projectId, userId, request, currentUser));
    }
}
