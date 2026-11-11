package com.example.payment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.ColumnDefault;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String nickname;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /**
     * Stable receive QR identifier. It is a public address, not a credential:
     * sharing it only allows others to send money to this account.
     */
    @Column(unique = true, name = "qr_receive")
    private String qrReceive;

    @Column(nullable = false)
    private boolean business;

    /**
     * USER is the only role the public registration flow can create. ADMIN is
     * provisioned explicitly (startup bootstrap or direct SQL).
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @ColumnDefault("'USER'")
    private UserRole role = UserRole.USER;

    /**
     * Suspended accounts cannot log in and existing JWTs stop working because
     * the JWT filter reloads the user row on every request.
     */
    @ColumnDefault("false")
    @Column(nullable = false)
    private boolean suspended = false;

    @ColumnDefault("0")
    @Column(nullable = false, precision = 19, scale = 4)
    private BigDecimal balance = BigDecimal.ZERO;

    @ColumnDefault("0")
    @Column(name = "token_version", nullable = false)
    private long tokenVersion = 0;

    @Column(name = "payment_code_hash")
    private String paymentCodeHash;

    @ColumnDefault("0")
    @Column(name = "payment_code_failed_attempts", nullable = false)
    private int paymentCodeFailedAttempts = 0;

    @Column(name = "payment_code_locked_until")
    private LocalDateTime paymentCodeLockedUntil;

    /**
     * Optimistic concurrency guard. All balance-changing operations also take a
     * pessimistic row lock, but the version protects against future code paths
     * that forget to do so.
     */
    @Version
    @Column(nullable = false)
    private long version;
}