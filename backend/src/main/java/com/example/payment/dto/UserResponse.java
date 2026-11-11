package com.example.payment.dto;

import com.example.payment.model.User;
import com.example.payment.model.UserRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record UserResponse(
        Long id,
        String nickname,
        String email,
        boolean business,
        String qrReceive,
        LocalDateTime createdAt,
        BigDecimal balance,
        boolean paymentCodeConfigured,
        UserRole role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.isBusiness(),
                user.getQrReceive(),
                user.getCreatedAt(),
                user.getBalance(),
                user.getPaymentCodeHash() != null,
                user.getRole()
        );
    }
}
