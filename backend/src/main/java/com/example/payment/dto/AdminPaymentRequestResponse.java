package com.example.payment.dto;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentRequestStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record AdminPaymentRequestResponse(
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
    public static AdminPaymentRequestResponse from(PaymentRequest request,
                                                   String requesterNickname,
                                                   String payerNickname) {
        return new AdminPaymentRequestResponse(
                request.getId(),
                request.getRequesterId(),
                requesterNickname,
                request.getPayerId(),
                payerNickname,
                request.getAmount(),
                request.getCurrency(),
                request.getStatus(),
                request.getNote(),
                request.getCreatedAt(),
                request.getResolvedAt()
        );
    }
}
