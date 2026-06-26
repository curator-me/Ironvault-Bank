package com.ironvault.banking.dto;

import com.ironvault.banking.model.Account;
import com.ironvault.banking.model.AccountStatus;
import com.ironvault.banking.model.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Response DTO for safely exposing account information to the
 * frontend while hiding the internal Account entity structure.
 */

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AccountResponse {
    private Long id;
    private String accountNumber;
    private AccountType type;
    private BigDecimal balance;
    private AccountStatus status;
    private LocalDateTime createdDate;

    public static AccountResponse from(Account account) {
        return AccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .type(account.getType())
                .balance(account.getBalance())
                .status(account.getStatus())
                .createdDate(account.getCreatedDate())
                .build();
    }
}
