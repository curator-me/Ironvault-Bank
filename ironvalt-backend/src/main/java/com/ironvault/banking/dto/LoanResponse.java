package com.ironvault.banking.dto;

import com.ironvault.banking.model.Loan;
import com.ironvault.banking.model.LoanStatus;
import com.ironvault.banking.model.LoanType;
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
public class LoanResponse {
    private Long id;
    private BigDecimal amount;
    private String reason;
    private LoanType loanType;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private BigDecimal interestRate;
    private LoanStatus status;
    private Long accountId;
    private Long customerId;
    private LocalDateTime createdDate;

    public static LoanResponse from(Loan loan) {
        return LoanResponse.builder()
                .id(loan.getId())
                .amount(loan.getAmount())
                .reason(loan.getReason())
                .loanType(loan.getLoanType())
                .startDate(loan.getStartDate())
                .endDate(loan.getEndDate())
                .interestRate(loan.getInterestRate())
                .status(loan.getStatus())
                .accountId(loan.getAccount().getId())
                .customerId(loan.getCustomer().getId())
                .createdDate(loan.getCreatedDate())
                .build();
    }
}
