package com.example.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record ResetPaymentCodeRequest(
        @NotBlank String nickname,
        @NotBlank String password,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Verification code must be exactly 6 digits")
        String verificationCode,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Payment code must be exactly 6 digits")
        String newCode
) {
}
