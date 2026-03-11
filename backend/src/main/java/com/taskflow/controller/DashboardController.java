package com.taskflow.controller;

import com.taskflow.exception.UnauthorizedException;
import com.taskflow.model.User;
import com.taskflow.repository.NotificationRepository;
import com.taskflow.repository.ProjectMemberRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.repository.UserRepository;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/dashboard")
@RequiredArgsConstructor
@Tag(name = "Dashboard", description = "Aggregated dashboard metrics")
public class DashboardController {

    private final UserRepository         userRepository;
    private final TaskRepository         taskRepository;
    private final ProjectMemberRepository projectMemberRepository;
    private final NotificationRepository notificationRepository;

    @Operation(summary = "Get dashboard summary", description = "Aggregate counts: active tasks, due this week, projects, unread notifications")
    @GetMapping("/summary")
    public ResponseEntity<Map<String, Object>> getSummary(
            @AuthenticationPrincipal UserDetails currentUser) {

        User user = userRepository.findByEmail(currentUser.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User not found"));

        long myActiveTasks      = taskRepository.countActiveTasksByUserId(user.getId());
        long dueThisWeek        = taskRepository.countDueThisWeekByUserId(user.getId());
        long activeProjects     = projectMemberRepository.countActiveProjectsByUserId(user.getId());
        long unreadNotifications = notificationRepository.countByUserIdAndIsReadFalse(user.getId());

        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("myActiveTasks",       myActiveTasks);
        summary.put("dueThisWeek",         dueThisWeek);
        summary.put("activeProjects",      activeProjects);
        summary.put("unreadNotifications", unreadNotifications);

        return ResponseEntity.ok(summary);
    }
}
