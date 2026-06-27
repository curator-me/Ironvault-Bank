package com.ironvault.banking.controller;

import com.ironvault.banking.dto.LoanRequest;
import com.ironvault.banking.dto.LoanResponse;
import com.ironvault.banking.dto.TransactionResponse;
import com.ironvault.banking.model.Account;
import com.ironvault.banking.model.AuditLog;
import com.ironvault.banking.model.Loan;
import com.ironvault.banking.model.LoanStatus;
import com.ironvault.banking.model.Transaction;
import com.ironvault.banking.model.TransactionStatus;
import com.ironvault.banking.model.TransactionType;
import com.ironvault.banking.model.User;
import com.ironvault.banking.repository.AccountRepository;
import com.ironvault.banking.repository.AuditLogRepository;
import com.ironvault.banking.repository.LoanRepository;
import com.ironvault.banking.repository.TransactionRepository;
import com.ironvault.banking.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/customer/loans")
@RequiredArgsConstructor
public class LoanController {

    private final LoanRepository loanRepository;
    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final AuditLogRepository auditLogRepository;

    @PostMapping
    @Transactional
    public ResponseEntity<LoanResponse> applyForLoan(@Valid @RequestBody LoanRequest request, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found"));

        if (!account.getUser().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        Loan loan = Loan.builder()
                .amount(request.getAmount())
                .reason(request.getReason())
                .loanType(request.getLoanType())
                .account(account)
                .customer(user)
                .status(LoanStatus.PENDING)
                .build();

        Loan savedLoan = loanRepository.save(loan);
        return ResponseEntity.status(HttpStatus.CREATED).body(LoanResponse.from(savedLoan));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<LoanResponse>> getMyLoans(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        List<LoanResponse> loans = loanRepository.findByCustomerIdOrderByCreatedDateDesc(user.getId())
                .stream()
                .map(LoanResponse::from)
                .toList();

        return ResponseEntity.ok(loans);
    }
    
    @PostMapping("/{loanId}/pay")
    @Transactional
    public ResponseEntity<TransactionResponse> payLoan(@PathVariable Long loanId, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Loan loan = loanRepository.findById(loanId)
                .orElseThrow(() -> new IllegalArgumentException("Loan not found"));

        if (!loan.getCustomer().getId().equals(user.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        if (loan.getStatus() != LoanStatus.ACTIVE) {
            return ResponseEntity.badRequest().body(null);
        }

        Account account = loan.getAccount();
        if (account.getBalance().compareTo(loan.getAmount()) < 0) {
            return ResponseEntity.badRequest().body(null);
        }

        account.setBalance(account.getBalance().subtract(loan.getAmount()));
        accountRepository.save(account);

        Transaction transaction = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.WITHDRAWAL)
                .amount(loan.getAmount())
                .fromAccount(account)
                .toAccount(null)
                .status(TransactionStatus.COMPLETED)
                .build();
        transaction = transactionRepository.save(transaction);

        loan.setStatus(LoanStatus.CLOSED);
        loanRepository.save(loan);

        AuditLog auditLog = AuditLog.builder()
                .performedBy(user)
                .action("LOAN_PAYMENT")
                .details("Paid off loan " + loan.getId() + " (" + loan.getLoanType() + ") from account "
                        + account.getAccountNumber() + " for $" + loan.getAmount().toPlainString()
                        + " [txn=" + transaction.getTransactionId() + "]")
                .build();
        auditLogRepository.save(auditLog);

        return ResponseEntity.ok(TransactionResponse.from(transaction));
    }

    private String generateTransactionId() {
        String random = UUID.randomUUID()
                .toString()
                .replace("-", "")
                .toUpperCase()
                .substring(0, 12);
        return "TXN-" + random;
    }
}
