package com.ironvault.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminSummaryResponse {
    private long totalAccounts;
    private long totalUsers;
    private long activeUsers;
    private long lockedUsers;
    private long totalTransactions;
    private BigDecimal totalTransactionVolume;
    private long transactionsLastMonth;
    private BigDecimal transactionVolumeLastMonth;
    private long transactionsToday;
    private BigDecimal transactionVolumeToday;
    private LocalDateTime generatedAt;
}
