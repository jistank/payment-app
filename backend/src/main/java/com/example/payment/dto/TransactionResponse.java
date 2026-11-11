package com.example.payment.dto;

import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionResponse(
        Long id,
        Long senderId,
        Long receiverId,
        BigDecimal amount,
        String currency,
        TransactionStatus transactionStatus,
        TransactionType transactionType,
        String method,
        LocalDateTime transactionTime
) {
    public static TransactionResponse from(Transaction transaction) {
        return new TransactionResponse(
                transaction.getId(),
                transaction.getSenderId(),
                transaction.getReceiverId(),
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getTransactionStatus(),
                transaction.getTransactionType(),
                transaction.getMethod(),
                transaction.getTransactionTime()
        );
    }
}
