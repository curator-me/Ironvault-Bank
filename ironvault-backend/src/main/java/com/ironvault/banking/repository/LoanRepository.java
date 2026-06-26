package com.ironvault.banking.repository;

import com.ironvault.banking.model.Loan;
import com.ironvault.banking.model.LoanStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LoanRepository extends JpaRepository<Loan, Long> {
    List<Loan> findByCustomerIdOrderByCreatedDateDesc(Long customerId);
    Page<Loan> findByStatus(LoanStatus status, Pageable pageable);
}
