package com.ironvault.banking.dto;

import com.ironvault.banking.model.AccountType;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class OpenAccountRequest {

    @NotNull(message = "Account type is required (CHECKING or SAVINGS)")
    private AccountType type;
}
