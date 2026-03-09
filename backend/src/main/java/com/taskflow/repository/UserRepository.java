package com.taskflow.repository;

import com.taskflow.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserRepository extends JpaRepository<User, UUID> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    @Query("""
        SELECT DISTINCT t.assignee FROM Task t
        WHERE t.dueDate = :date AND t.assignee IS NOT NULL
          AND t.status != 'DONE'
        """)
    List<User> findUsersWithTasksDueSoon(@Param("date") LocalDate date);
}
