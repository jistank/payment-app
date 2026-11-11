package com.example.payment.repository;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentRequestStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRequestRepository
        extends JpaRepository<PaymentRequest, Long>, JpaSpecificationExecutor<PaymentRequest> {

    long countByStatus(PaymentRequestStatus status);

    List<PaymentRequest> findByPayerIdAndStatusOrderByCreatedAtDesc(Long payerId, PaymentRequestStatus status);

    List<PaymentRequest> findByRequesterIdAndStatusOrderByCreatedAtDesc(Long requesterId, PaymentRequestStatus status);

    Optional<PaymentRequest> findByIdAndPayerId(Long id, Long payerId);

    /**
     * Serializes accept/decline for the same request. Without this lock two
     * concurrent accepts both see PENDING and charge the payer twice.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from PaymentRequest r where r.id = :id and r.payerId = :payerId")
    Optional<PaymentRequest> findByIdAndPayerIdForUpdate(@Param("id") Long id, @Param("payerId") Long payerId);

    /**
     * Removes the still-pending requests of a deleted account. Resolved requests
     * are kept as financial history.
     */
    @Modifying
    @Query("delete from PaymentRequest r where r.status = :status and (r.requesterId = :userId or r.payerId = :userId)")
    int deleteByStatusAndUserId(@Param("status") PaymentRequestStatus status, @Param("userId") Long userId);
}
