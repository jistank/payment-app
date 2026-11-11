package com.example.payment.repository;

import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface TransactionRepository
        extends JpaRepository<Transaction, Long>, JpaSpecificationExecutor<Transaction> {

    List<Transaction> findBySenderIdOrReceiverIdOrderByTransactionTimeDesc(Long senderId, Long receiverId);

    @Query("select coalesce(sum(t.amount), 0) from Transaction t where t.transactionType <> :type")
    BigDecimal sumAmountExcludingType(@Param("type") TransactionType type);

    @Query("select coalesce(sum(t.amount), 0) from Transaction t where t.transactionType = :type")
    BigDecimal sumAmountByType(@Param("type") TransactionType type);
}
