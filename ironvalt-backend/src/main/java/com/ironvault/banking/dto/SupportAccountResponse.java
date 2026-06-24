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

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SupportAccountResponse {
    private Long id;
    private String accountNumber;
    private AccountType type;
    private BigDecimal balance;
    private AccountStatus status;
    private LocalDateTime createdDate;
    private Long ownerId;
    private String ownerUsername;
    private String ownerEmail;

    public static SupportAccountResponse from(Account account) {
        return SupportAccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .type(account.getType())
                .balance(account.getBalance())
                .status(account.getStatus())
                .createdDate(account.getCreatedDate())
                .ownerId(account.getUser() != null ? account.getUser().getId() : null)
                .ownerUsername(account.getUser() != null ? account.getUser().getUsername() : null)
                .ownerEmail(account.getUser() != null ? account.getUser().getEmail() : null)
                .build();
    }
}
