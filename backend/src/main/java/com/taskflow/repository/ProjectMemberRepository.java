package com.taskflow.repository;

import com.taskflow.model.ProjectMember;
import com.taskflow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ProjectMemberRepository extends JpaRepository<ProjectMember, UUID> {

    boolean existsByProjectIdAndUserId(UUID projectId, UUID userId);

    Optional<ProjectMember> findByProjectIdAndUserId(UUID projectId, UUID userId);

    List<ProjectMember> findByProjectId(UUID projectId);

    @Query("SELECT pm FROM ProjectMember pm JOIN FETCH pm.user WHERE pm.project.id = :projectId")
    List<ProjectMember> findByProjectIdWithUser(@Param("projectId") UUID projectId);

    boolean existsByProjectIdAndUserIdAndRole(UUID projectId, UUID userId, User.Role role);

    void deleteByProjectIdAndUserId(UUID projectId, UUID userId);

    @Query("""
        SELECT COUNT(DISTINCT pm.project.id) FROM ProjectMember pm
        WHERE pm.user.id = :userId
          AND pm.project.status = com.taskflow.model.Project.ProjectStatus.ACTIVE
        """)
    long countActiveProjectsByUserId(@Param("userId") UUID userId);
}
