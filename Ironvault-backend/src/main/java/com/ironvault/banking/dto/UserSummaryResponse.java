package com.ironvault.banking.dto;

import com.ironvault.banking.model.User;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
/* This is used when the backend needs to return summarized user information, 
especially for admin or listing screens */

public class UserSummaryResponse {
    private Long id;
    private String username;
    private String email;
    private String role;
    private boolean accountLocked;
    private int failedAttempts;
    private LocalDateTime lockedUntil;
    private LocalDateTime passwordLastChanged;

    public static UserSummaryResponse from(User user) {
        return UserSummaryResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .role(user.getRole() != null ? user.getRole().name() : null)
                .accountLocked(user.isAccountLocked())
                .failedAttempts(user.getFailedAttempts())
                .lockedUntil(user.getLockedUntil())
                .passwordLastChanged(user.getPasswordLastChanged())
                .build();
    }
}
