package com.taskflow.repository;

import com.taskflow.model.Task;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface TaskRepository extends JpaRepository<Task, UUID> {

    @Query("""
        SELECT t FROM Task t
        LEFT JOIN FETCH t.assignee
        LEFT JOIN FETCH t.reporter
        WHERE (:projectId IS NULL OR t.project.id = :projectId)
          AND (:status   IS NULL OR CAST(t.status   AS string) = :status)
          AND (:priority IS NULL OR CAST(t.priority AS string) = :priority)
          AND (:assigneeId IS NULL OR t.assignee.id = :assigneeId)
        ORDER BY t.createdAt DESC
        """)
    Page<Task> findByProjectIdWithFilters(
        @Param("projectId")  UUID projectId,
        @Param("status")     String status,
        @Param("priority")   String priority,
        @Param("assigneeId") UUID assigneeId,
        Pageable pageable
    );

    @Query("""
        SELECT t FROM Task t
        JOIN FETCH t.project
        LEFT JOIN FETCH t.assignee
        WHERE t.assignee.id = :userId
        ORDER BY t.createdAt DESC
        """)
    Page<Task> findByAssigneeId(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
        SELECT t FROM Task t
        WHERE t.status != 'DONE'
          AND t.assignee IS NOT NULL
          AND t.dueDate = CURRENT_DATE + 1
        """)
    List<Task> findTasksDueTomorrow();

    @Query("""
        SELECT COUNT(t) FROM Task t
        WHERE t.assignee.id = :userId
          AND t.status != 'DONE'
          AND t.dueDate BETWEEN CURRENT_DATE AND CURRENT_DATE + 7
        """)
    long countDueThisWeekByUserId(@Param("userId") UUID userId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.project.id = :projectId")
    long countByProjectId(@Param("projectId") UUID projectId);

    @Query("SELECT COUNT(t) FROM Task t WHERE t.assignee.id = :userId AND t.status != 'DONE'")
    long countActiveTasksByUserId(@Param("userId") UUID userId);
}
