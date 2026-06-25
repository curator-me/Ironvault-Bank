package com.ironvault.banking.controller;

import com.ironvault.banking.dto.AccountResponse;
import com.ironvault.banking.dto.OpenAccountRequest;
import com.ironvault.banking.dto.UpdateAccountStatusRequest;
import com.ironvault.banking.model.Account;
import com.ironvault.banking.model.AccountStatus;
import com.ironvault.banking.model.User;
import com.ironvault.banking.repository.AccountRepository;
import com.ironvault.banking.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.security.SecureRandom;
import java.util.List;

@RestController
@RequestMapping("/api/accounts")
@RequiredArgsConstructor
public class AccountController {

    private static final int ACCOUNT_NUMBER_LENGTH = 16;
    private static final int MAX_GENERATION_ATTEMPTS = 10;

    private final AccountRepository accountRepository;
    private final UserRepository userRepository;
    private final SecureRandom secureRandom = new SecureRandom();

    // Create Account
    @PostMapping
    @Transactional
    public ResponseEntity<AccountResponse> openAccount(@Valid @RequestBody OpenAccountRequest request,
                                                       Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));

        Account account = Account.builder()
                .accountNumber(generateUniqueAccountNumber())
                .type(request.getType())
                .balance(BigDecimal.ZERO)
                .status(AccountStatus.ACTIVE)
                .user(user)
                .build();

        AccountResponse response = AccountResponse.from(accountRepository.save(account));
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // List all the account for an user
    @GetMapping
    @Transactional(readOnly = true)
    public ResponseEntity<List<AccountResponse>> listAccounts(Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        List<AccountResponse> accounts = accountRepository.findByUserIdOrderByCreatedDateDesc(user.getId())
                .stream()
                .map(AccountResponse::from)
                .toList();
        return ResponseEntity.ok(accounts);
    }

    // GET account information
    @GetMapping("/{id}")
    @Transactional(readOnly = true)
    public ResponseEntity<AccountResponse> getAccount(@PathVariable Long id, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to access this account");
        }

        return ResponseEntity.ok(AccountResponse.from(account));
    }

    // UPDATE account information
    @PutMapping("/{id}")
    @Transactional
    public ResponseEntity<AccountResponse> updateStatus(@PathVariable Long id,
                                                        @Valid @RequestBody UpdateAccountStatusRequest request,
                                                        Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to access this account");
        }

        account.setStatus(request.getStatus());
        return ResponseEntity.ok(AccountResponse.from(accountRepository.save(account)));
    }

    // DELETE account
    @DeleteMapping("/{id}")
    @Transactional
    public ResponseEntity<Void> closeAccount(@PathVariable Long id, Principal principal) {
        User user = userRepository.findByUsername(principal.getName())
                .orElseThrow(() -> new IllegalArgumentException("User not found with username: " + principal.getName()));
        
        Account account = accountRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Account not found with id: " + id));

        if (!account.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("You are not authorized to access this account");
        }

        if (account.getBalance().compareTo(BigDecimal.ZERO) != 0) {
            throw new IllegalArgumentException(
                    "Account cannot be closed because its balance is not zero. Current balance: " + account.getBalance());
        }

        account.setStatus(AccountStatus.CLOSED);
        accountRepository.save(account);
        return ResponseEntity.noContent().build();
    }

    // Private methods
    private String generateUniqueAccountNumber() {
        for (int attempt = 0; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
            String candidate = randomDigits();
            if (accountRepository.findByAccountNumber(candidate).isEmpty()) {
                return candidate;
            }
        }
        throw new IllegalStateException("Unable to generate a unique account number, please retry");
    }

    private String randomDigits() {
        StringBuilder sb = new StringBuilder(ACCOUNT_NUMBER_LENGTH);
        sb.append(secureRandom.nextInt(9) + 1);
        for (int i = 1; i < ACCOUNT_NUMBER_LENGTH; i++) {
            sb.append(secureRandom.nextInt(10));
        }
        return sb.toString();
    }
}
