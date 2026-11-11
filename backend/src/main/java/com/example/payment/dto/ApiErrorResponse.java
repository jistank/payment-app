package com.example.payment.dto;

import java.util.Map;

// This record represents the structure of an API error response,
// containing the HTTP status code, an error message, and a map of specific errors (if any).
public record ApiErrorResponse(int status, String message, Map<String, String> errors ) {
    public ApiErrorResponse(int status, String message) {
        this(status, message, Map.of());
    }
}
