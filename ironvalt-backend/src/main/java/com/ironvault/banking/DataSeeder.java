package com.ironvault.banking;

import com.ironvault.banking.model.*;
import com.ironvault.banking.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/**
 * DataSeeder populates the database with demo users, accounts, and transactions.
 * Enabled by default for easy grading/demo purposes.
 * 
 * Demo Data:
 * - 1 Admin user (admin@ironvault.com / password123)
 * - 1 Employee user (employee@ironvault.com / password123)
 * - 2 Customer users (customer1@ironvault.com / password123, customer2@ironvault.com / password123)
 * - Sample accounts with balances
 * - Sample transactions demonstrating deposits, withdrawals, and transfers
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final AccountRepository accountRepository;
    private final TransactionRepository transactionRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) throws Exception {
        if (userRepository.count() > 0) {
            log.info("Database already seeded. Skipping data initialization.");
            return;
        }

        log.info("Starting database seeding with demo data...");

        try {
            // Create users
            User admin = createAdmin();
            User employee = createEmployee();
            User customer1 = createCustomer("customer1@ironvault.com", "Alice Johnson");
            User customer2 = createCustomer("customer2@ironvault.com", "Bob Smith");

            log.info("Created users: 1 admin, 1 employee, 2 customers");

            // Create accounts for customers
            Account checkingC1 = createAccount(customer1, AccountType.CHECKING, new BigDecimal("5000.00"));
            Account savingsC1 = createAccount(customer1, AccountType.SAVINGS, new BigDecimal("15000.00"));
            Account checkingC2 = createAccount(customer2, AccountType.CHECKING, new BigDecimal("3500.00"));
            Account savingsC2 = createAccount(customer2, AccountType.SAVINGS, new BigDecimal("25000.00"));

            log.info("Created 4 sample accounts: 2 for each customer (1 checking, 1 savings)");

            // Create sample transactions
            createSampleTransactions(checkingC1, savingsC1, checkingC2, savingsC2);

            log.info("✓ Database seeding completed successfully!");
            log.info("Demo credentials:");
            log.info("  Admin:      admin@ironvault.com / password123");
            log.info("  Employee:   employee@ironvault.com / password123");
            log.info("  Customer1:  customer1@ironvault.com / password123");
            log.info("  Customer2:  customer2@ironvault.com / password123");

        } catch (Exception e) {
            log.error("Error during data seeding", e);
            throw e;
        }
    }

    private User createAdmin() {
        User admin = User.builder()
                .username("admin")
                .email("admin@ironvault.com")
                .password(passwordEncoder.encode("password123"))
                .role(UserRole.ADMIN)
                .accountLocked(false)
                .failedAttempts(0)
                .build();
        return userRepository.save(admin);
    }

    private User createEmployee() {
        User employee = User.builder()
                .username("employee")
                .email("employee@ironvault.com")
                .password(passwordEncoder.encode("password123"))
                .role(UserRole.EMPLOYEE)
                .accountLocked(false)
                .failedAttempts(0)
                .build();
        return userRepository.save(employee);
    }

    private User createCustomer(String email, String username) {
        User customer = User.builder()
                .username(username)
                .email(email)
                .password(passwordEncoder.encode("password123"))
                .role(UserRole.CUSTOMER)
                .accountLocked(false)
                .failedAttempts(0)
                .build();
        return userRepository.save(customer);
    }

    private Account createAccount(User user, AccountType type, BigDecimal initialBalance) {
        String accountNumber = generateAccountNumber();
        Account account = Account.builder()
                .accountNumber(accountNumber)
                .type(type)
                .balance(initialBalance)
                .status(AccountStatus.ACTIVE)
                .user(user)
                .build();
        return accountRepository.save(account);
    }

    private void createSampleTransactions(Account c1Checking, Account c1Savings, 
                                          Account c2Checking, Account c2Savings) {
        LocalDateTime now = LocalDateTime.now();

        // Customer 1: Deposit to checking
        Transaction t1 = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.DEPOSIT)
                .amount(new BigDecimal("1000.00"))
                .fromAccount(null)
                .toAccount(c1Checking)
                .status(TransactionStatus.COMPLETED)
                .timestamp(now.minusDays(5))
                .build();
        transactionRepository.save(t1);

        // Customer 1: Withdrawal from checking
        Transaction t2 = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.WITHDRAWAL)
                .amount(new BigDecimal("500.00"))
                .fromAccount(c1Checking)
                .toAccount(null)
                .status(TransactionStatus.COMPLETED)
                .timestamp(now.minusDays(4))
                .build();
        transactionRepository.save(t2);

        // Customer 1: Transfer between own accounts (checking to savings)
        Transaction t3 = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.TRANSFER)
                .amount(new BigDecimal("2000.00"))
                .fromAccount(c1Checking)
                .toAccount(c1Savings)
                .status(TransactionStatus.COMPLETED)
                .timestamp(now.minusDays(3))
                .build();
        transactionRepository.save(t3);

        // Customer 1: Transfer to Customer 2
        Transaction t4 = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.TRANSFER)
                .amount(new BigDecimal("1500.00"))
                .fromAccount(c1Checking)
                .toAccount(c2Checking)
                .status(TransactionStatus.COMPLETED)
                .timestamp(now.minusDays(2))
                .build();
        transactionRepository.save(t4);

        // Customer 2: Deposit to savings
        Transaction t5 = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.DEPOSIT)
                .amount(new BigDecimal("5000.00"))
                .fromAccount(null)
                .toAccount(c2Savings)
                .status(TransactionStatus.COMPLETED)
                .timestamp(now.minusDays(1))
                .build();
        transactionRepository.save(t5);

        // Customer 2: Withdrawal from savings
        Transaction t6 = Transaction.builder()
                .transactionId(generateTransactionId())
                .type(TransactionType.WITHDRAWAL)
                .amount(new BigDecimal("2000.00"))
                .fromAccount(c2Savings)
                .toAccount(null)
                .status(TransactionStatus.COMPLETED)
                .timestamp(now)
                .build();
        transactionRepository.save(t6);

        // Update account balances to reflect transactions
        c1Checking.setBalance(c1Checking.getBalance().add(new BigDecimal("1000.00"))
                .subtract(new BigDecimal("500.00"))
                .subtract(new BigDecimal("2000.00"))
                .subtract(new BigDecimal("1500.00")));
        c1Savings.setBalance(c1Savings.getBalance().add(new BigDecimal("2000.00")));
        c2Checking.setBalance(c2Checking.getBalance().add(new BigDecimal("1500.00")));
        c2Savings.setBalance(c2Savings.getBalance().add(new BigDecimal("5000.00"))
                .subtract(new BigDecimal("2000.00")));

        accountRepository.saveAll(java.util.List.of(c1Checking, c1Savings, c2Checking, c2Savings));

        log.info("Created 6 sample transactions: deposits, withdrawals, and transfers");
    }

    private String generateAccountNumber() {
        // Generate a random 16-digit account number
        return String.format("%016d", System.nanoTime() % 10000000000000000L);
    }

    private String generateTransactionId() {
        return "TXN" + UUID.randomUUID().toString().substring(0, 13).toUpperCase();
    }
}
