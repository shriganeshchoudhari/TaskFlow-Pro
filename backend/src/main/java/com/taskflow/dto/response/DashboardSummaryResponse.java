package com.taskflow.dto.response;

import lombok.*;

import java.util.Map;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class DashboardSummaryResponse {
    private Map<String, Long> myTaskCounts;
    private long dueThisWeek;
    private long activeProjects;
    private long unreadNotifications;
}
