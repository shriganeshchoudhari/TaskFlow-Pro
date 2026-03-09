package com.taskflow.repository;

import com.taskflow.model.Activity;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, UUID> {

    @Query("""
        SELECT a FROM Activity a
        JOIN FETCH a.actor
        WHERE a.project.id = :projectId
        ORDER BY a.createdAt DESC
        """)
    Page<Activity> findByProjectIdOrderByCreatedAtDesc(
        @Param("projectId") UUID projectId, Pageable pageable);

    @Query("""
        SELECT a FROM Activity a
        JOIN FETCH a.actor
        WHERE a.task.id = :taskId
        ORDER BY a.createdAt DESC
        """)
    Page<Activity> findByTaskIdOrderByCreatedAtDesc(
        @Param("taskId") UUID taskId, Pageable pageable);
}
