package com.example.payment.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/**
 * Manual top-up performed by an administrator. It is always audited and is
 * recorded as a distinct ADMIN_TOP_UP transaction method.
 */
public record AdminTopUpRequest(
        @NotNull @DecimalMin(value = "0.01", message = "Amount must be greater than zero")
        BigDecimal amount,
        @Pattern(regexp = "[A-Za-z]{3}", message = "Currency must be a 3-letter code")
        String currency,
        @Size(max = 255)
        String note
) {
}
