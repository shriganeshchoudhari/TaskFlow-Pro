package com.taskflow.repository;

import com.taskflow.model.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface CommentRepository extends JpaRepository<Comment, UUID> {

    @Query("""
        SELECT c FROM Comment c
        JOIN FETCH c.author
        WHERE c.task.id = :taskId
        ORDER BY c.createdAt ASC
        """)
    List<Comment> findByTaskIdOrderByCreatedAtAsc(@Param("taskId") UUID taskId);

    long countByTaskId(UUID taskId);
}
