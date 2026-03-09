package com.taskflow.controller;

import com.taskflow.dto.response.NotificationResponse;
import com.taskflow.exception.UnauthorizedException;
import com.taskflow.model.User;
import com.taskflow.repository.UserRepository;
import com.taskflow.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Map<String, Object>> getNotifications(
            @RequestParam(required = false) Boolean isRead,
            @PageableDefault(size = 20) Pageable pageable,
            @AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        Page<NotificationResponse> page = notificationService
            .getNotifications(user.getId(), isRead, pageable);
        long unreadCount = notificationService.getUnreadCount(user.getId());

        return ResponseEntity.ok(Map.of(
            "notifications", page,
            "unreadCount",   unreadCount
        ));
    }

    @PatchMapping("/{notificationId}/read")
    public ResponseEntity<NotificationResponse> markAsRead(
            @PathVariable UUID notificationId,
            @AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        return ResponseEntity.ok(notificationService.markAsRead(notificationId, user.getId()));
    }

    @PatchMapping("/read-all")
    public ResponseEntity<Void> markAllAsRead(
            @AuthenticationPrincipal UserDetails currentUser) {
        User user = resolveUser(currentUser);
        notificationService.markAllAsRead(user.getId());
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(UserDetails userDetails) {
        return userRepository.findByEmail(userDetails.getUsername())
            .orElseThrow(() -> new UnauthorizedException("User not found"));
    }
}
