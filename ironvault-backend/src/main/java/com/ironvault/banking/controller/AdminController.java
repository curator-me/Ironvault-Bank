package com.ironvault.banking.controller;

import com.ironvault.banking.dto.AdminSummaryResponse;
import com.ironvault.banking.dto.AuditLogResponse;
import com.ironvault.banking.dto.AdminAccountResponse;
import com.ironvault.banking.dto.SystemHealthResponse;
import com.ironvault.banking.dto.TransactionResponse;
import com.ironvault.banking.dto.UserSummaryResponse;
import com.ironvault.banking.model.Account;
import com.ironvault.banking.model.AuditLog;
import com.ironvault.banking.model.Transaction;
import com.ironvault.banking.model.User;
import com.ironvault.banking.model.UserRole;
import com.ironvault.banking.repository.AccountRepository;
import com.ironvault.banking.repository.AuditLogRepository;
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

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final TransactionRepository transactionRepository;
    private final AccountRepository accountRepository;

    @GetMapping("/health")
    @Transactional(readOnly = true)
    public ResponseEntity<SystemHealthResponse> health() {
        long totalUsers = userRepository.count();
        long lockedUsers = userRepository.countByAccountLocked(true);
        LocalDateTime startOfDay = LocalDate.now().atStartOfDay();

        return ResponseEntity.ok(SystemHealthResponse.builder()
                .totalUsers(totalUsers)
                .activeUsers(totalUsers - lockedUsers)
                .lockedUsers(lockedUsers)
                .transactionCountToday(transactionRepository.countByTimestampGreaterThanEqual(startOfDay))
                .transactionVolumeToday(transactionRepository.sumAmountSince(startOfDay))
                .generatedAt(LocalDateTime.now())
                .build());
    }

    @GetMapping("/summary")
    @Transactional(readOnly = true)
    public ResponseEntity<AdminSummaryResponse> summary() {
        long totalUsers = userRepository.count();
        long lockedUsers = userRepository.countByAccountLocked(true);
        long totalAccounts = accountRepository.count();
        long totalTransactions = transactionRepository.count();

        LocalDateTime now = LocalDateTime.now();
        LocalDateTime startOfToday = LocalDate.now().atStartOfDay();

        // Last month: from the 1st of last month to the 1st of this month
        LocalDateTime startOfLastMonth = LocalDate.now().withDayOfMonth(1).minusMonths(1).atStartOfDay();
        LocalDateTime startOfThisMonth = LocalDate.now().withDayOfMonth(1).atStartOfDay();

        // "All time" volume
        BigDecimal totalVolume = transactionRepository.sumAmountSince(LocalDateTime.of(1970, 1, 1, 0, 0));

        return ResponseEntity.ok(AdminSummaryResponse.builder()
                .totalAccounts(totalAccounts)
                .totalUsers(totalUsers)
                .activeUsers(totalUsers - lockedUsers)
                .lockedUsers(lockedUsers)
                .totalTransactions(totalTransactions)
                .totalTransactionVolume(totalVolume)
                .transactionsLastMonth(transactionRepository.countByTimestampBetween(startOfLastMonth, startOfThisMonth))
                .transactionVolumeLastMonth(transactionRepository.sumAmountBetween(startOfLastMonth, startOfThisMonth))
                .transactionsToday(transactionRepository.countByTimestampGreaterThanEqual(startOfToday))
                .transactionVolumeToday(transactionRepository.sumAmountSince(startOfToday))
                .generatedAt(now)
                .build());
    }

    @GetMapping("/users")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<UserSummaryResponse>> listUsers(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) UserRole role,
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        
        String searchQuery = (search != null && !search.isBlank()) ? search.trim() : null;
        // Search user according to role
        Page<User> users = userRepository.searchUsers(searchQuery, role, pageable);      
        return ResponseEntity.ok(users.map(UserSummaryResponse::from));
    }

    // List of accounts
    @GetMapping("/accounts")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<AdminAccountResponse>> listAccounts(
            @PageableDefault(size = 20, sort = "id") Pageable pageable) {
        Page<Account> accounts = accountRepository.findAll(pageable);
        return ResponseEntity.ok(accounts.map(AdminAccountResponse::from));
    }

    // List of last 20 transactions
    @GetMapping("/transactions")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<TransactionResponse>> listTransactions(
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        Page<Transaction> transactions = transactionRepository.findAll(pageable);
        return ResponseEntity.ok(transactions.map(TransactionResponse::from));
    }

    // To Lock an user
    @PutMapping("/users/{id}/lock")
    @Transactional
    public ResponseEntity<UserSummaryResponse> lockUser(@PathVariable Long id, Principal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        user.setAccountLocked(true);
        user.setLockedUntil(null);
        userRepository.save(user);

        logAudit(principal.getName(), "ADMIN_LOCK_USER",
                "Admin manually locked account for user: " + user.getEmail() + " (id=" + user.getId() + ")");
        
        return ResponseEntity.ok(UserSummaryResponse.from(user));
    }

    // Unlock and user
    @PutMapping("/users/{id}/unlock")
    @Transactional
    public ResponseEntity<UserSummaryResponse> unlockUser(@PathVariable Long id, Principal principal) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("User not found with id: " + id));
        
        user.setAccountLocked(false);
        user.setFailedAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);

        logAudit(principal.getName(), "ADMIN_UNLOCK_USER",
                "Admin manually unlocked account for user: " + user.getEmail() + " (id=" + user.getId() + ")");
        
        return ResponseEntity.ok(UserSummaryResponse.from(user));
    }

    // Store login information
    @GetMapping("/audit-logs")
    @Transactional(readOnly = true)
    public ResponseEntity<Page<AuditLogResponse>> auditLogs(
            @RequestParam(required = false) String action,
            @RequestParam(required = false) Long userId,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate,
            @PageableDefault(size = 20, sort = "timestamp", direction = Sort.Direction.DESC) Pageable pageable) {
        LocalDateTime start = startDate != null ? startDate : LocalDateTime.of(1970, 1, 1, 0, 0);
        LocalDateTime end = endDate != null ? endDate : LocalDateTime.now().plusYears(100);
        String actionFilter = (action == null || action.isBlank()) ? null : action.trim();

        return ResponseEntity.ok(auditLogRepository.findWithFilters(actionFilter, userId, start, end, pageable)
                .map(AuditLogResponse::from));
    }

    @PostMapping("/backup")
    @Transactional
    public ResponseEntity<Map<String, String>> triggerBackup(Principal principal) {
        String backupId = "BACKUP-" + UUID.randomUUID().toString().replace("-", "").toUpperCase();
        logAudit(principal.getName(), "ADMIN_DB_BACKUP",
                "Admin triggered manual database backup (placeholder). Backup reference: " + backupId);
        
        return ResponseEntity.accepted().body(Map.of(
                "status", "BACKUP_INITIATED",
                "backupId", backupId,
                "message", "Database backup has been queued (placeholder)."
        ));
    }

    // Private methods
    private void logAudit(String adminUsername, String action, String details) {
        User admin = userRepository.findByUsername(adminUsername).orElse(null);
        AuditLog log = AuditLog.builder()
                .performedBy(admin)
                .action(action)
                .details(details)
                .build();
        auditLogRepository.save(log);
    }
}
