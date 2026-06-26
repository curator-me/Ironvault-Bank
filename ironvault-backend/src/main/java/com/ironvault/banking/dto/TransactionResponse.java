package com.ironvault.banking.dto;

import com.ironvault.banking.model.Transaction;
import com.ironvault.banking.model.TransactionStatus;
import com.ironvault.banking.model.TransactionType;
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
public class TransactionResponse {
    private Long id;
    private String transactionId;
    private TransactionType type;
    private BigDecimal amount;
    private TransactionStatus status;
    private LocalDateTime timestamp;
    private String fromAccountNumber;
    private String toAccountNumber;

    public static TransactionResponse from(Transaction transaction) {
        return TransactionResponse.builder()
                .id(transaction.getId())
                .transactionId(transaction.getTransactionId())
                .type(transaction.getType())
                .amount(transaction.getAmount())
                .status(transaction.getStatus())
                .timestamp(transaction.getTimestamp())
                .fromAccountNumber(transaction.getFromAccount() != null ? transaction.getFromAccount().getAccountNumber() : null)
                .toAccountNumber(transaction.getToAccount() != null ? transaction.getToAccount().getAccountNumber() : null)
                .build();
    }
}
