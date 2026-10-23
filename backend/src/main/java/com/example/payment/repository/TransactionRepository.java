package com.example.payment.repository;

import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TransactionRepository extends JpaRepository<Transaction, Long> {

    List<Transaction> findBySenderId(Long senderId);

    List<Transaction> findByReceiverId(Long receiverId);

    List<Transaction> findBySenderIdOrReceiverIdOrderByTransactionTimeDesc(Long senderId, Long receiverId);

    List<Transaction> findByTransactionStatus(TransactionStatus transactionStatus);

    List<Transaction> findByTransactionType(TransactionType transactionType);

    List<Transaction> findByCurrency(String currency);
}
