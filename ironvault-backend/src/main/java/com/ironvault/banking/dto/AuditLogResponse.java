package com.ironvault.banking.dto;

import com.ironvault.banking.model.AuditLog;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLogResponse {
    private Long id;
    private String action;
    private String performedBy;
    private Long performedByUserId;
    private LocalDateTime timestamp;
    private String details;

    public static AuditLogResponse from(AuditLog log) {
        return AuditLogResponse.builder()
                .id(log.getId())
                .action(log.getAction())
                .performedBy(log.getPerformedBy() != null ? log.getPerformedBy().getUsername() : "SYSTEM")
                .performedByUserId(log.getPerformedBy() != null ? log.getPerformedBy().getId() : null)
                .timestamp(log.getTimestamp())
                .details(log.getDetails())
                .build();
    }
}
