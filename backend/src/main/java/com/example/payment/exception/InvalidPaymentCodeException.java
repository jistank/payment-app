package com.example.payment.exception;

public class InvalidPaymentCodeException extends RuntimeException {

    public InvalidPaymentCodeException(String message) {
        super(message);
    }
}
