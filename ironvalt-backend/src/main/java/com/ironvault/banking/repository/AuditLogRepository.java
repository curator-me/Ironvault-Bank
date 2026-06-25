package com.ironvault.banking.repository;

import com.ironvault.banking.model.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {
    List<AuditLog> findByPerformedByIdOrderByTimestampDesc(Long userId);

    @Query("SELECT a FROM AuditLog a WHERE (:action IS NULL OR a.action = :action) " +
            "AND (:userId IS NULL OR a.performedBy.id = :userId) " +
            "AND a.timestamp BETWEEN :startDate AND :endDate")
    Page<AuditLog> findWithFilters(
            @Param("action") String action,
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            Pageable pageable
    );
}
