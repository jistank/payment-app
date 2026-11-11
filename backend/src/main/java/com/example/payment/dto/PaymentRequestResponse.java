package com.example.payment.dto;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentRequestStatus;
import com.example.payment.model.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record PaymentRequestResponse(
        Long id,
        Long requesterId,
        String requesterNickname,
        Long payerId,
        String payerNickname,
        BigDecimal amount,
        String currency,
        PaymentRequestStatus status,
        String note,
        LocalDateTime createdAt,
        LocalDateTime resolvedAt
) {
    public static PaymentRequestResponse from(PaymentRequest request, User requester, User payer) {
        return new PaymentRequestResponse(
                request.getId(),
                request.getRequesterId(),
                requester != null ? requester.getNickname() : null,
                request.getPayerId(),
                payer != null ? payer.getNickname() : null,
                request.getAmount(),
                request.getCurrency(),
                request.getStatus(),
                request.getNote(),
                request.getCreatedAt(),
                request.getResolvedAt()
        );
    }
}
