package com.example.payment.dto;

import jakarta.validation.constraints.NotBlank;

public record ForgotPaymentCodeRequest(
        @NotBlank String nickname,
        @NotBlank String password
) {
}
