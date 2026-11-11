package com.example.payment.model;

/**
 * Application-level role. The public registration flow always creates USER
 * accounts; ADMIN accounts are provisioned explicitly at startup or by SQL.
 */
public enum UserRole {
    USER,
    ADMIN
}
