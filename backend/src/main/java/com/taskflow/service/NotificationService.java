package com.taskflow.service;

import com.taskflow.dto.response.NotificationResponse;
import com.taskflow.exception.ForbiddenException;
import com.taskflow.exception.ResourceNotFoundException;
import com.taskflow.model.*;
import com.taskflow.repository.NotificationRepository;
import com.taskflow.repository.TaskRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final TaskRepository taskRepository;

    // ── Create Notifications ──────────────────────────────────────────────────

    @Transactional
    public void notifyTaskAssigned(User assignee, Task task, User assignedBy) {
        String msg = String.format("%s assigned you to task: \"%s\"",
            assignedBy.getFullName(), task.getTitle());
        createNotification(assignee, Notification.NotificationType.TASK_ASSIGNED.name(),
            msg, task, task.getProject());
    }

    @Transactional
    public void notifyCommentAdded(Task task, User commenter) {
        String msg = String.format("%s commented on task: \"%s\"",
            commenter.getFullName(), task.getTitle());
        // Notify assignee
        if (task.getAssignee() != null &&
                !task.getAssignee().getId().equals(commenter.getId())) {
            createNotification(task.getAssignee(),
                Notification.NotificationType.COMMENT_ADDED.name(),
                msg, task, task.getProject());
        }
        // Notify reporter (if different from commenter and assignee)
        if (!task.getReporter().getId().equals(commenter.getId()) &&
                (task.getAssignee() == null ||
                 !task.getAssignee().getId().equals(task.getReporter().getId()))) {
            createNotification(task.getReporter(),
                Notification.NotificationType.COMMENT_ADDED.name(),
                msg, task, task.getProject());
        }
    }

    @Transactional
    public void notifyStatusChanged(Task task, User changedBy,
                                     String oldStatus, String newStatus) {
        if (task.getAssignee() != null &&
                !task.getAssignee().getId().equals(changedBy.getId())) {
            String msg = String.format("%s changed status of \"%s\" from %s to %s",
                changedBy.getFullName(), task.getTitle(), oldStatus, newStatus);
            createNotification(task.getAssignee(),
                Notification.NotificationType.STATUS_CHANGED.name(),
                msg, task, task.getProject());
        }
    }

    @Transactional
    public void createNotification(User user, String type, String message,
                                    Task task, Project project) {
        Notification n = Notification.builder()
            .user(user)
            .type(type)
            .message(message)
            .task(task)
            .project(project)
            .build();
        notificationRepository.save(n);
    }

    // ── Query ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public Page<NotificationResponse> getNotifications(UUID userId, Boolean isRead,
                                                        Pageable pageable) {
        Page<Notification> page = (isRead != null)
            ? notificationRepository.findByUserIdAndIsReadOrderByCreatedAtDesc(
                userId, isRead, pageable)
            : notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return page.map(NotificationResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public long getUnreadCount(UUID userId) {
        return notificationRepository.countByUserIdAndIsReadFalse(userId);
    }

    @Transactional
    public NotificationResponse markAsRead(UUID notificationId, UUID userId) {
        Notification n = notificationRepository.findById(notificationId)
            .orElseThrow(() -> new ResourceNotFoundException(
                "Notification not found: " + notificationId));
        if (!n.getUser().getId().equals(userId)) {
            throw new ForbiddenException("Not your notification");
        }
        n.setRead(true);
        return NotificationResponse.fromEntity(notificationRepository.save(n));
    }

    @Transactional
    public void markAllAsRead(UUID userId) {
        notificationRepository.markAllReadByUserId(userId);
    }

    // ── Scheduled: Due Date Reminders ─────────────────────────────────────────

    @Scheduled(cron = "0 0 9 * * *") // 9 AM daily
    @Transactional
    public void sendDueDateReminders() {
        List<Task> tasksDueTomorrow = taskRepository.findTasksDueTomorrow();
        for (Task task : tasksDueTomorrow) {
            if (task.getAssignee() != null) {
                String msg = String.format("Task \"%s\" is due tomorrow!", task.getTitle());
                createNotification(task.getAssignee(),
                    Notification.NotificationType.DUE_DATE_REMINDER.name(),
                    msg, task, task.getProject());
            }
        }
        log.info("Due date reminders sent for {} tasks", tasksDueTomorrow.size());
    }
}
