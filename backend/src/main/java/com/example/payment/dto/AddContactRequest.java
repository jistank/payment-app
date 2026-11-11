package com.example.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AddContactRequest(
        @NotBlank @Size(min = 3, max = 50) String nickname
) {
}
