package com.taskflow.controller;

import com.taskflow.dto.response.ActivityResponse;
import com.taskflow.service.ActivityService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class ActivityController {

    private final ActivityService activityService;

    @GetMapping("/api/v1/projects/{projectId}/activities")
    public ResponseEntity<Page<ActivityResponse>> getProjectActivities(
            @PathVariable UUID projectId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(activityService.getProjectActivities(projectId, pageable));
    }

    @GetMapping("/api/v1/tasks/{taskId}/activities")
    public ResponseEntity<Page<ActivityResponse>> getTaskActivities(
            @PathVariable UUID taskId,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        return ResponseEntity.ok(activityService.getTaskActivities(taskId, pageable));
    }
}
