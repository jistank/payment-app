package com.example.payment.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record PaymentCodeRequest(
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Payment code must be exactly 6 digits")
        String code
) {
}
