package com.ironvault.banking.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SystemHealthResponse {
    private long totalUsers;
    private long activeUsers;
    private long lockedUsers;
    private long transactionCountToday;
    private BigDecimal transactionVolumeToday;
    private LocalDateTime generatedAt;
}
