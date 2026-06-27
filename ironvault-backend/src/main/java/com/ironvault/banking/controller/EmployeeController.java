package com.ironvault.banking.controller;

import com.ironvault.banking.dto.AuditLogResponse;
import com.ironvault.banking.dto.LoanResponse;
import com.ironvault.banking.dto.SupportAccountResponse;
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
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/employee")
@RequiredArgsConstructor
public class EmployeeController {

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final LoanRepository loanRepository;
    private final AuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;

    @GetMapping("/accounts") 
    @Transactional(readOnly = true)
    public ResponseEntity<Page<SupportAccountResponse>> listAccounts(
            @RequestParam(required = false) String accountNumber,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        Page<com.ironvault.banking.model.Account> accounts =
                (accountNumber == null || accountNumber.isBlank())
                        ? accountRepository.findAll(pageable)
                        : accountRepository.findByAccountNumberContaining(accountNumber.trim(), pageable);
        return ResponseEntity.ok(accounts.map(SupportAccountResponse::from));
    }

    @GetMapping("/accounts/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<SupportAccountResponse> getAccount(@PathVariable Long id) {
        return accountRepository.findById(id)
                .map(account -> ResponseEntity.ok(SupportAccountResponse.from(account)))
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));
    }

    // List of last 20 transactions
    @GetMapping("/transactions")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<TransactionResponse>> listTransactions(
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Transaction> transactions = transactionRepository.findAll(pageable);
        return ResponseEntity.ok(transactions.map(TransactionResponse::from));
    }

    @GetMapping("/customers/{userId}/accounts")
    @Transactional(readOnly = true)
    public ResponseEntity<List<SupportAccountResponse>> getCustomerAccounts(@PathVariable Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User not found with id: " + userId);
        }
        List<SupportAccountResponse> accounts = accountRepository.findByUserIdOrderByCreatedDateDesc(userId)
                .stream()
                .map(SupportAccountResponse::from)
                .toList();
        return ResponseEntity.ok(accounts);
    }

    @GetMapping("/loans")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<LoanResponse>> listLoans(
            @RequestParam(required = false) LoanStatus status,
            @PageableDefault(size = 100, sort = "createdDate", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        Page<Loan> loans = (status == null)
                ? loanRepository.findAll(pageable)
                : loanRepository.findByStatus(status, pageable);
        return ResponseEntity.ok(loans.map(LoanResponse::from));
    }

    @PutMapping("/loans/{id}/status")
    @Transactional
    public ResponseEntity<LoanResponse> updateLoanStatus(@PathVariable Long id, @RequestParam LoanStatus status) {
        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan not found"));

        if (status == loan.getStatus()) {
            return ResponseEntity.ok(LoanResponse.from(loan));
        }

        loan.setStatus(status);
        return ResponseEntity.ok(LoanResponse.from(loanRepository.save(loan)));
    }

    @PostMapping("/loans/{id}/deposit")
    @Transactional
    public ResponseEntity<LoanResponse> depositLoanAmount(@PathVariable Long id, Principal principal) {
        User employee = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));

        Loan loan = loanRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Loan not found"));

        if (loan.getStatus() != LoanStatus.APPROVED) {
            throw new IllegalStateException("Loan must be APPROVED before depositing funds.");
        }

        Account account = loan.getAccount();
        account.setBalance(account.getBalance().add(loan.getAmount()));
        accountRepository.save(account);

        Transaction transaction = persistTransaction(TransactionType.DEPOSIT, loan.getAmount(), null, account);
        logAudit(employee, "LOAN_DEPOSIT",
                "Deposited loan amount $" + loan.getAmount() + " to account " + account.getAccountNumber()
                        + " for loan " + loan.getId() + " [txn=" + transaction.getTransactionId() + "]");

        loan.setStatus(LoanStatus.ACTIVE);
        loan.setStartDate(LocalDateTime.now());
        loan.setInterestRate(new java.math.BigDecimal("5.0"));

        return ResponseEntity.ok(LoanResponse.from(loanRepository.save(loan)));
    }

    @GetMapping("/audit-logs")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<AuditLogResponse>> auditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "timestamp", direction = org.springframework.data.domain.Sort.Direction.DESC) Pageable pageable) {
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now().plusYears(100);
        String actionFilter = (action == null || action.isBlank()) ? null : action.trim();

        return ResponseEntity.ok(auditLogRepository.findWithFilters(actionFilter, userId, start, end, pageable)
                .map(AuditLogResponse::from));
    }

    private Transaction persistTransaction(TransactionType type, java.math.BigDecimal amount, Account from, Account to) {
        String random = UUID.randomUUID().toString().replace("-", "").toUpperCase().substring(0, 12);
        Transaction transaction = Transaction.builder()
                .transactionId("TXN-" + random)
                .type(type)
                .amount(amount)
                .fromAccount(from)
                .toAccount(to)
                .status(TransactionStatus.COMPLETED)
                .build();
        return transactionRepository.save(transaction);
    }

    private void logAudit(User user, String action, String details) {
        AuditLog log = AuditLog.builder()
                .performedBy(user)
                .action(action)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
