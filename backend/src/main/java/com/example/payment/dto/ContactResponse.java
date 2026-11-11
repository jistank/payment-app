package com.example.payment.dto;

import com.example.payment.model.Contact;
import com.example.payment.model.User;

import java.time.LocalDateTime;

public record ContactResponse(
        Long id,
        Long userId,
        String nickname,
        String email,
        boolean business,
        LocalDateTime addedAt
) {
    public static ContactResponse from(Contact contact, User user) {
        return new ContactResponse(
                contact.getId(),
                user.getId(),
                user.getNickname(),
                user.getEmail(),
                user.isBusiness(),
                contact.getCreatedAt()
        );
    }
}
