package com.ironvault.banking.dto;

import com.ironvault.banking.model.Account;
import com.ironvault.banking.model.AccountStatus;
import com.ironvault.banking.model.AccountType;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AdminAccountResponse {
    private Long id;
    private String accountNumber;
    private AccountType type;
    private BigDecimal balance;
    private AccountStatus status;
    private Long userId;

    public static AdminAccountResponse from(Account account) {
        return AdminAccountResponse.builder()
                .id(account.getId())
                .accountNumber(account.getAccountNumber())
                .type(account.getType())
                .balance(account.getBalance())
                .status(account.getStatus())
                .userId(account.getUser() != null ? account.getUser().getId() : null)
                .build();
    }
}
