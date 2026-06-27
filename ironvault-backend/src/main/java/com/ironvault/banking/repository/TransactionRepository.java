package com.ironvault.banking.repository;

import com.ironvault.banking.model.Transaction;
import com.ironvault.banking.model.TransactionStatus;
import com.ironvault.banking.model.TransactionType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    @Query("SELECT t FROM Transaction t WHERE (t.fromAccount.id = :accountId OR t.toAccount.id = :accountId) AND t.timestamp BETWEEN :startDate AND :endDate ORDER BY t.timestamp DESC")
    List<Transaction> findByAccountIdAndTimestampBetween(
            @Param("accountId") Long accountId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate
    );

    @Query("SELECT t FROM Transaction t " +
            "LEFT JOIN t.fromAccount f " +
            "LEFT JOIN t.toAccount toAcct " +
            "WHERE (f.user.id = :userId OR toAcct.user.id = :userId) " +
            "AND t.timestamp BETWEEN :startDate AND :endDate " +
            "AND t.amount BETWEEN :minAmount AND :maxAmount")
    Page<Transaction> findUserTransactions(
            @Param("userId") Long userId,
            @Param("startDate") LocalDateTime startDate,
            @Param("endDate") LocalDateTime endDate,
            @Param("minAmount") BigDecimal minAmount,
            @Param("maxAmount") BigDecimal maxAmount,
            Pageable pageable
    );

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.fromAccount.id = :accountId " +
            "AND t.type = :type AND t.status = :status AND t.timestamp >= :since")
    BigDecimal sumAmountByAccountAndTypeSince(
            @Param("accountId") Long accountId,
            @Param("type") TransactionType type,
            @Param("status") TransactionStatus status,
            @Param("since") LocalDateTime since
    );

    long countByTimestampGreaterThanEqual(LocalDateTime since);

    long countByTimestampBetween(LocalDateTime start, LocalDateTime end);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.timestamp >= :since")
    BigDecimal sumAmountSince(@Param("since") LocalDateTime since);

    @Query("SELECT COALESCE(SUM(t.amount), 0) FROM Transaction t WHERE t.timestamp BETWEEN :start AND :end")
    BigDecimal sumAmountBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);
}
