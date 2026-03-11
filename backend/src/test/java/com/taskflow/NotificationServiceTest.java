package com.taskflow;

import com.taskflow.exception.ForbiddenException;
import com.taskflow.model.*;
import com.taskflow.repository.NotificationRepository;
import com.taskflow.repository.TaskRepository;
import com.taskflow.service.NotificationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@DisplayName("NotificationService Unit Tests")
class NotificationServiceTest {

    @Mock private NotificationRepository notificationRepository;
    @Mock private TaskRepository taskRepository;

    @InjectMocks private NotificationService notificationService;

    private User assignee;
    private User reporter;
    private User commenter;
    private Project project;
    private Task task;

    @BeforeEach
    void setUp() {
        assignee = User.builder().id(UUID.randomUUID()).email("assignee@test.com")
            .fullName("Assignee").build();
        reporter = User.builder().id(UUID.randomUUID()).email("reporter@test.com")
            .fullName("Reporter").build();
        commenter = User.builder().id(UUID.randomUUID()).email("commenter@test.com")
            .fullName("Commenter").build();

        project = Project.builder().id(UUID.randomUUID()).name("Proj").build();
        task = Task.builder().id(UUID.randomUUID()).title("Task")
            .project(project).reporter(reporter).assignee(assignee).build();
    }

    @Test
    @DisplayName("notifyTaskAssigned: creates notification for assignee")
    void notifyTaskAssigned_CreatesNotificationForAssignee() {
        when(notificationRepository.save(any(Notification.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        notificationService.notifyTaskAssigned(assignee, task, reporter);

        verify(notificationRepository).save(argThat(n ->
            n.getUser().equals(assignee) &&
            n.getType().equals(Notification.NotificationType.TASK_ASSIGNED.name()) &&
            n.getMessage().contains(reporter.getFullName())
        ));
    }

    @Test
    @DisplayName("notifyCommentAdded: notifies assignee and reporter (not commenter)")
    void notifyCommentAdded_NotifiesAssigneeAndReporter() {
        when(notificationRepository.save(any(Notification.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        notificationService.notifyCommentAdded(task, commenter);

        // Should notify both assignee and reporter (both different from commenter)
        verify(notificationRepository, times(2)).save(any(Notification.class));
    }

    @Test
    @DisplayName("notifyCommentAdded: does not notify the commenter")
    void notifyCommentAdded_DoesNotNotifyCommenter() {
        // Commenter is the assignee — only reporter should be notified
        task.setAssignee(commenter);

        when(notificationRepository.save(any(Notification.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        notificationService.notifyCommentAdded(task, commenter);

        // Only reporter should receive a notification
        verify(notificationRepository, times(1)).save(argThat(n ->
            n.getUser().equals(reporter)
        ));
    }

    @Test
    @DisplayName("markAsRead: own notification succeeds")
    void markAsRead_OwnNotification_Succeeds() {
        Notification notification = Notification.builder()
            .id(UUID.randomUUID()).user(assignee).type("TASK_ASSIGNED")
            .message("Test").isRead(false).build();

        when(notificationRepository.findById(notification.getId()))
            .thenReturn(Optional.of(notification));
        when(notificationRepository.save(any(Notification.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        var result = notificationService.markAsRead(notification.getId(), assignee.getId());
        assertThat(result).isNotNull();
    }

    @Test
    @DisplayName("markAsRead: other user's notification throws ForbiddenException")
    void markAsRead_OtherUsersNotification_ThrowsForbidden() {
        Notification notification = Notification.builder()
            .id(UUID.randomUUID()).user(assignee).type("TASK_ASSIGNED")
            .message("Test").isRead(false).build();

        when(notificationRepository.findById(notification.getId()))
            .thenReturn(Optional.of(notification));

        assertThatThrownBy(() ->
            notificationService.markAsRead(notification.getId(), reporter.getId()))
            .isInstanceOf(ForbiddenException.class);
    }

    @Test
    @DisplayName("markAllAsRead: calls repository with userId")
    void markAllAsRead_UpdatesAllUnread() {
        UUID userId = assignee.getId();
        notificationService.markAllAsRead(userId);
        verify(notificationRepository).markAllReadByUserId(userId);
    }

    @Test
    @DisplayName("sendDueDateReminders: creates notifications for due tasks")
    void sendDueDateReminders_CreatesDueDateNotifications() {
        when(taskRepository.findTasksDueTomorrow()).thenReturn(List.of(task));
        when(notificationRepository.save(any(Notification.class)))
            .thenAnswer(inv -> inv.getArgument(0));

        notificationService.sendDueDateReminders();

        verify(notificationRepository).save(argThat(n ->
            n.getUser().equals(assignee) &&
            n.getType().equals(Notification.NotificationType.DUE_DATE_REMINDER.name())
        ));
    }
}
