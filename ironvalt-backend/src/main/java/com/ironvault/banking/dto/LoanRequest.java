package com.ironvault.banking.dto;

import com.ironvault.banking.model.LoanType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LoanRequest {

    @NotNull(message = "Amount is required")
    @DecimalMin(value = "100.00", message = "Minimum loan amount is 100")
    private BigDecimal amount;

    @NotBlank(message = "Reason is required")
    private String reason;

    @NotNull(message = "Loan type is required")
    private LoanType loanType;

    @NotNull(message = "Account ID is required")
    private Long accountId;
}
