package com.example.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record UpdatePaymentCodeRequest(
        @Pattern(regexp = "^\\d{6}$", message = "Payment code must be exactly 6 digits")
        String currentCode,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Payment code must be exactly 6 digits")
        String newCode
) {
}
