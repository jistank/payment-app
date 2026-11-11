package com.example.payment.dto;

import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionHistoryResponse(
        Long id,
        String direction,
        Long counterpartId,
        String counterpartNickname,
        BigDecimal amount,
        String currency,
        TransactionStatus transactionStatus,
        TransactionType transactionType,
        String method,
        LocalDateTime transactionTime
) {
}
