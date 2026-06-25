package com.ironvault.banking.controller;

import com.ironvault.banking.dto.LoginRequest;
import com.ironvault.banking.dto.RegisterRequest;
import com.ironvault.banking.dto.AuthResponse;
import com.ironvault.banking.model.AuditLog;
import com.ironvault.banking.model.PasswordHistory;
import com.ironvault.banking.model.User;
import com.ironvault.banking.model.UserRole;
import com.ironvault.banking.repository.AuditLogRepository;
import com.ironvault.banking.repository.UserRepository;
import com.ironvault.banking.security.JwtTokenProvider;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.CredentialsExpiredException;
import org.springframework.security.authentication.LockedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.time.LocalDateTime;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final AuditLogRepository auditLogRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    @PostMapping("/register")
    @Transactional
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new IllegalArgumentException("User with this email already exists");
        }

        String username = request.getEmail().split("@")[0];
        String encodedPassword = passwordEncoder.encode(request.getPassword());

        User user = User.builder()
                .username(username)
                .email(request.getEmail())
                .password(encodedPassword)
                .role(UserRole.CUSTOMER)
                .build();

        PasswordHistory history = PasswordHistory.builder()
                .user(user)
                .passwordHash(encodedPassword)
                .build();
        user.getPasswordHistories().add(history);

        userRepository.save(user);

        logAudit(user, "USER_REGISTRATION", "Successfully registered new customer: " + user.getEmail());

        String token = jwtTokenProvider.generateToken(user.getUsername());
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build());
    }

    @PostMapping("/login")
    @Transactional
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElse(null);

        if (user == null) {
            logAudit(null, "LOGIN_FAILED_UNKNOWN", "Failed login attempt for unknown email: " + request.getEmail());
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.isAccountLocked()) {
            if (user.getLockedUntil() != null && user.getLockedUntil().isBefore(LocalDateTime.now())) {
                user.setAccountLocked(false);
                user.setFailedAttempts(0);
                user.setLockedUntil(null);
                userRepository.save(user);
            } else {
                logAudit(user, "LOGIN_FAILED_LOCKED", "Failed login due to account lockout for email: " + user.getEmail());
                throw new LockedException("Account is locked. Please try again later.");
            }
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            int attempts = user.getFailedAttempts() + 1;
            user.setFailedAttempts(attempts);
            if (attempts >= 5) {
                user.setAccountLocked(true);
                user.setLockedUntil(LocalDateTime.now().plusHours(24));
                userRepository.save(user);
                logAudit(user, "ACCOUNT_LOCKOUT", "Account locked due to 5 failed login attempts for email: " + user.getEmail());
                throw new LockedException("Account has been locked due to 5 failed login attempts");
            }
            userRepository.save(user);
            logAudit(user, "LOGIN_FAILED", "Failed login attempt (Incorrect password) for email: " + user.getEmail() + " (" + attempts + "/5)");
            throw new BadCredentialsException("Invalid email or password");
        }

        if (user.getPasswordLastChanged() != null && 
            user.getPasswordLastChanged().isBefore(LocalDateTime.now().minusDays(90))) {
            logAudit(user, "LOGIN_FAILED_EXPIRED", "Failed login due to password expiration for email: " + user.getEmail());
            throw new CredentialsExpiredException("Password has expired (90-day policy)");
        }

        user.setFailedAttempts(0);
        userRepository.save(user);

        logAudit(user, "LOGIN_SUCCESS", "Successful login for email: " + user.getEmail());

        String token = jwtTokenProvider.generateToken(user.getUsername());
        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .email(user.getEmail())
                .username(user.getUsername())
                .role(user.getRole().name())
                .build());
    }

    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<Void> logout(Principal principal) {
        if (principal != null) {
            User user = userRepository.findByUsername(principal.getName()).orElse(null);
            logAudit(user, "LOGOUT", "User logged out successfully: " + principal.getName());
        }
        return ResponseEntity.ok().build();
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
