package com.taskflow.repository;

import com.taskflow.model.Project;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectRepository extends JpaRepository<Project, UUID> {

    /**
     * Projects the user owns OR is a member of, optionally filtered by status.
     *
     * Fix: removed inline ORDER BY from the JPQL body.
     * Hibernate 6 (Spring Boot 3.x) cannot auto-generate the COUNT query when
     * the main query combines DISTINCT + LEFT JOIN on a collection + inline ORDER BY.
     * Sorting is now delegated entirely to the Pageable argument (passed as
     * Sort.by("updatedAt").descending() from ProjectService).
     *
     * A separate countQuery is provided so Hibernate doesn't try to wrap the
     * DISTINCT fetch query in a COUNT(*) — instead it counts IDs directly,
     * which avoids the "cannot use DISTINCT with collection fetch" exception.
     */
    @Query(
        value = """
            SELECT DISTINCT p FROM Project p
            LEFT JOIN p.members m
            WHERE (p.owner.id = :userId OR m.user.id = :userId)
              AND (:status IS NULL OR CAST(p.status AS string) = :status)
            """,
        countQuery = """
            SELECT COUNT(DISTINCT p.id) FROM Project p
            LEFT JOIN p.members m
            WHERE (p.owner.id = :userId OR m.user.id = :userId)
              AND (:status IS NULL OR CAST(p.status AS string) = :status)
            """
    )
    Page<Project> findAccessibleByUserId(
        @Param("userId") UUID userId,
        @Param("status") String status,
        Pageable pageable
    );

    /**
     * Fetch a project only if the requesting user is a member (membership-gated GET).
     */
    @Query("""
        SELECT DISTINCT p FROM Project p
        LEFT JOIN p.members m
        WHERE p.id = :projectId
          AND (p.visibility = 'PUBLIC'
               OR p.owner.id = :userId
               OR m.user.id = :userId)
        """)
    Optional<Project> findByIdAndAccessibleByUser(
        @Param("projectId") UUID projectId,
        @Param("userId") UUID userId
    );

    boolean existsByIdAndOwnerId(UUID projectId, UUID ownerId);
}
