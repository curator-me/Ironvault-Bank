package com.ironvault.banking.dto;

import com.ironvault.banking.model.AccountStatus;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateAccountStatusRequest {

    @NotNull(message = "Account status is required (ACTIVE, SUSPENDED or CLOSED)")
    private AccountStatus status;
}
