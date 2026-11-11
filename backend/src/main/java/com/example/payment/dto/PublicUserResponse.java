package com.example.payment.dto;

import com.example.payment.model.User;

/**
 * Public projection of a user. It deliberately excludes email, balance, QR
 * payloads and payment-code state so authenticated users cannot enumerate
 * sensitive account data.
 */
public record PublicUserResponse(
        Long id,
        String nickname,
        boolean business
) {
    public static PublicUserResponse from(User user) {
        return new PublicUserResponse(user.getId(), user.getNickname(), user.isBusiness());
    }
}
