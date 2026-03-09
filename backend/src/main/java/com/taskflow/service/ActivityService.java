package com.taskflow.service;

import com.taskflow.dto.response.ActivityResponse;
import com.taskflow.model.*;
import com.taskflow.repository.ActivityRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class ActivityService {

    private final ActivityRepository activityRepository;

    @Transactional
    public void logActivity(String action, String entityType, UUID entityId,
                             User actor, Project project, Task task,
                             String oldValue, String newValue) {
        Activity activity = Activity.builder()
            .action(action)
            .entityType(entityType)
            .entityId(entityId)
            .actor(actor)
            .project(project)
            .task(task)
            .oldValue(oldValue)
            .newValue(newValue)
            .build();
        activityRepository.save(activity);
        log.debug("Activity logged: {} on {} by {}", action, entityType, actor.getEmail());
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getProjectActivities(UUID projectId, Pageable pageable) {
        return activityRepository
            .findByProjectIdOrderByCreatedAtDesc(projectId, pageable)
            .map(ActivityResponse::fromEntity);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> getTaskActivities(UUID taskId, Pageable pageable) {
        return activityRepository
            .findByTaskIdOrderByCreatedAtDesc(taskId, pageable)
            .map(ActivityResponse::fromEntity);
    }
}
