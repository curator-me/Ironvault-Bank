package com.ironvault.banking.repository;

import com.ironvault.banking.model.Account;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountRepository extends JpaRepository<Account, Long> {
    Optional<Account> findByAccountNumber(String accountNumber);
    List<Account> findByUserIdOrderByCreatedDateDesc(Long userId);
    Page<Account> findByAccountNumberContaining(String accountNumber, Pageable pageable);
}
