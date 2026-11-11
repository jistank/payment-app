package com.example.payment.dto;

import com.example.payment.model.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record PaymentRequest(
        @NotBlank @Size(min = 3, max = 50) String nickname,
        @NotNull @DecimalMin("0.01") @Digits(integer = 15, fraction = 4) BigDecimal amount,
        @NotBlank @Pattern(regexp = "(?i)[a-z]{3}", message = "Currency must be a 3-letter code") String currency,
        @NotNull TransactionType type,
        @NotBlank
        @Pattern(regexp = "^\\d{6}$", message = "Payment code must be exactly 6 digits")
        String code
) {
}
