package com.example.payment.dto;

import com.example.payment.model.User;
import com.example.payment.model.UserRole;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Admin projection of a user. Unlike PublicUserResponse it intentionally
 * exposes contact and account state because it is only returned to ADMIN
 * sessions via /api/admin/**.
 */
public record AdminUserResponse(
        Long id,
        String nickname,
        String email,
        boolean business,
        BigDecimal balance,
        UserRole role,
        boolean suspended,
        boolean paymentCodeConfigured,
        LocalDateTime createdAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.isBusiness(),
                user.getBalance(),
                user.getRole(),
                user.isSuspended(),
                user.getPaymentCodeHash() != null,
                user.getCreatedAt()
        );
    }
}
