package com.ironvault.banking.controller;

import com.ironvault.banking.dto.DepositRequest;
import com.ironvault.banking.dto.TransactionResponse;
import com.ironvault.banking.dto.TransferRequest;
import com.ironvault.banking.dto.WithdrawRequest;
import com.ironvault.banking.model.Account;
import com.ironvault.banking.model.AccountStatus;
import com.ironvault.banking.model.AuditLog;
import com.ironvault.banking.model.Transaction;
import com.ironvault.banking.model.TransactionStatus;
import com.ironvault.banking.model.TransactionType;
import com.ironvault.banking.model.User;
import com.ironvault.banking.repository.AccountRepository;
import com.ironvault.banking.repository.AuditLogRepository;
import com.ironvault.banking.repository.TransactionRepository;
import com.ironvault.banking.repository.UserRepository;
import com.ironvault.banking.util.StatementPdfGenerator;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private static final BigDecimal DAILY_WITHDRAWAL_LIMIT = new BigDecimal("10000.00");

    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final StatementPdfGenerator statementPdfGenerator;

    @PostMapping("/deposit")
    @Transactional
    public ResponseEntity<TransactionResponse> deposit(@Valid @RequestBody DepositRequest request,
                                                       Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + request.getAccountId()));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to access this account");
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active (status: " + account.getStatus() + ")");
        }

        account.setBalance(account.getBalance().add(request.getAmount()));
        accountRepository.save(account);

        Transaction transaction = persistTransaction(TransactionType.DEPOSIT, request.getAmount(), null, account);
        logAudit(user, "DEPOSIT",
                "Deposited $" + request.getAmount() + " to account " + account.getAccountNumber()
                        + " [txn=" + transaction.getTransactionId() + "]");

        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    @PostMapping("/withdraw")
    @Transactional
    public ResponseEntity<TransactionResponse> withdraw(@Valid @RequestBody WithdrawRequest request,
                                                        Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Account account = accountRepository.findById(request.getAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + request.getAccountId()));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to access this account");
        }
        if (account.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active (status: " + account.getStatus() + ")");
        }

        if (account.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds. Current balance: " + account.getBalance());
        }

        BigDecimal withdrawnToday = transactionRepository.sumAmountByAccountAndTypeSince(
                account.getId(), TransactionType.WITHDRAWAL, TransactionStatus.COMPLETED,
                LocalDate.now().atStartOfDay());
        if (withdrawnToday.add(request.getAmount()).compareTo(DAILY_WITHDRAWAL_LIMIT) > 0) {
            throw new IllegalArgumentException(
                    "Daily withdrawal limit of $" + DAILY_WITHDRAWAL_LIMIT.toPlainString()
                            + " exceeded. Already withdrawn today: $" + withdrawnToday.toPlainString());
        }

        account.setBalance(account.getBalance().subtract(request.getAmount()));
        accountRepository.save(account);

        Transaction transaction = persistTransaction(TransactionType.WITHDRAWAL, request.getAmount(), account, null);
        logAudit(user, "WITHDRAWAL",
                "Withdrew $" + request.getAmount() + " from account " + account.getAccountNumber()
                        + " [txn=" + transaction.getTransactionId() + "]");

        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    @PostMapping("/transfer")
    @Transactional
    public ResponseEntity<TransactionResponse> transfer(@Valid @RequestBody TransferRequest request,
                                                        Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Account fromAccount = accountRepository.findById(request.getFromAccountId())
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + request.getFromAccountId()));

        if (!fromAccount.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to access this account");
        }
        if (fromAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Account is not active (status: " + fromAccount.getStatus() + ")");
        }

        Account toAccount = accountRepository.findByAccountNumber(request.getToAccountNumber())
                .orElseThrow(() -> new IllegalArgumentException(
                        "Destination account not found: " + request.getToAccountNumber()));

        if (fromAccount.getId().equals(toAccount.getId())) {
            throw new IllegalArgumentException("Cannot transfer to the same account");
        }
        if (toAccount.getStatus() != AccountStatus.ACTIVE) {
            throw new IllegalArgumentException("Destination account is not active");
        }
        if (fromAccount.getBalance().compareTo(request.getAmount()) < 0) {
            throw new IllegalArgumentException("Insufficient funds. Current balance: " + fromAccount.getBalance());
        }

        fromAccount.setBalance(fromAccount.getBalance().subtract(request.getAmount()));
        toAccount.setBalance(toAccount.getBalance().add(request.getAmount()));
        accountRepository.save(fromAccount);
        accountRepository.save(toAccount);

        Transaction transaction = persistTransaction(TransactionType.TRANSFER, request.getAmount(), fromAccount, toAccount);

        boolean internal = toAccount.getUser().getId().equals(user.getId());
        logAudit(user, "TRANSFER",
                (internal ? "Internal" : "External") + " transfer of $" + request.getAmount()
                        + " from " + fromAccount.getAccountNumber() + " to " + toAccount.getAccountNumber()
                        + " [txn=" + transaction.getTransactionId() + "]");

        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<Page<TransactionResponse>> history(
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @RequestParam(required = false) BigDecimal minAmount,
            @RequestParam(required = false) BigDecimal maxAmount,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable,
            Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));

        LocalDateTime start = startDate != null ? startDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now().plusYears(100);
        BigDecimal min = minAmount != null ? minAmount : BigDecimal.ZERO;
        BigDecimal max = maxAmount != null ? maxAmount : new BigDecimal("99999999999999.99");

        if (start.isAfter(end)) {
            throw new IllegalArgumentException("startDate must be before endDate");
        }
        if (min.compareTo(max) > 0) {
            throw new IllegalArgumentException("minAmount must not be greater than maxAmount");
        }

        Page<TransactionResponse> transactions = transactionRepository
                .findUserTransactions(user.getId(), start, end, min, max, pageable)
                .map(TransactionResponse::from);
        
        return ResponseEntity.ok(transactions);
    }

    // Download Transaction statement
    @GetMapping("/{id}/statement")
    @Transactional
    public ResponseEntity<byte[]> statement(@PathVariable Long id, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Transaction transaction = transactionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Transaction not found with id: " + id));

        boolean ownsFrom = transaction.getFromAccount() != null
                && transaction.getFromAccount().getUser().getId().equals(user.getId());
        boolean ownsTo = transaction.getToAccount() != null
                && transaction.getToAccount().getUser().getId().equals(user.getId());
        if (!ownsFrom && !ownsTo) {
            throw new IllegalArgumentException("You are not authorized to access this transaction");
        }

        byte[] pdf = statementPdfGenerator.generate(transaction, user.getUsername());
        logAudit(user, "STATEMENT_GENERATED",
                "Generated PDF statement for transaction " + transaction.getTransactionId());

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"statement-" + transaction.getTransactionId() + ".pdf\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(pdf);
    }

    private Transaction persistTransaction(TransactionType type, BigDecimal amount, Account from, Account to) {
        Transaction transaction = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(type)
                .amount(amount)
                .fromAccount(from)
                .toAccount(to)
                .status(TransactionStatus.COMPLETED)
                .build();
        return transactionRepository.save(transaction);
    }

    private String generateTransactionId() {
        String random = UUID.randomUUID()
                                .toString()
                                .replace("-", "")
                                .toUpperCase()
                                .substring(0, 12);

        return "TXN-" + random;
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
