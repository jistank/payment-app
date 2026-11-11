package com.example.payment.dto;

import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminTransactionResponse(
        Long id,
        Long senderId,
        String senderNickname,
        Long receiverId,
        String receiverNickname,
        BigDecimal amount,
        String currency,
        TransactionStatus transactionStatus,
        TransactionType transactionType,
        String method,
        LocalDateTime transactionTime
) {
    public static AdminTransactionResponse from(Transaction transaction,
                                                String senderNickname,
                                                String receiverNickname) {
        return new AdminTransactionResponse(
                transaction.getId(),
                transaction.getSenderId(),
                senderNickname,
                transaction.getReceiverId(),
                receiverNickname,
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getTransactionStatus(),
                transaction.getTransactionType(),
                transaction.getMethod(),
                transaction.getTransactionTime()
        );
    }
}
