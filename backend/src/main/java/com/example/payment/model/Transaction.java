package com.example.payment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data                          // (Lombok): Makes getters, setters, toString(), equals(), and hashCode()
@NoArgsConstructor             // (Lombok): Makes an empty constructor, new User(). JPA needs this one
@AllArgsConstructor            // (Lombok): Makes a constructor with all fields, new User(id, nickname, ...)
@Entity                        // (JPA): Tells Spring that this class is a database table.
@Table(name = "transactions")  // (JPA): Tells Spring that this class is a database table named "transactions"
public class Transaction {

    @Id                                                    // (JPA): Tells Spring that this field is the primary key of the table
    @GeneratedValue(strategy = GenerationType.IDENTITY)    // (JPA): Tells Spring that this field is auto-incremented by the database
    private Long id;

    @Column(name = "sender_id", nullable = false)          // (JPA): Tells Spring that this field cannot be null, is name is "sender_id" in the database
    private Long senderId;

    @Column(name = "receiver_id", nullable = false)        // (JPA): Tells Spring that this field cannot be null, is name is "receiver_id" in the database
    private Long receiverId;

    @Column(nullable = false, precision = 19, scale = 4)  // (JPA): Tells Spring that this field cannot be null, is a decimal with precision 19 and scale 4
    private BigDecimal amount;

    @Column(nullable = false, length = 3)                  // (JPA): Tells Spring that this field cannot be null
    private String currency;

    @Enumerated(EnumType.STRING)                           // (JPA): Tells Spring that this field is an enum, and should be stored as a string in the database
    @Column(name = "transaction_status", nullable = false) // (JPA): Cannot be null, named "transaction_status" in the database, can't be null
    private TransactionStatus transactionStatus;

    @CreationTimestamp                                     // (Hibernate): Automatically sets the time when the row is inserted
    @Column(name = "transaction_time",  updatable = false) // (JPA): name is "transaction_time" in the database, cannot be updated after the row is created
    private LocalDateTime transactionTime;

    @Enumerated(EnumType.STRING)                           // (JPA): Tells Spring that this field is an enum, and should be stored as a string in the database
    @Column(name = "transaction_type", nullable = false)   // (JPA): Tells Spring that this field cannot be null, is name is "transaction_type" in the database
    private TransactionType transactionType;               // (shopping, friend, donation, etc.)

    @Column(nullable = false)                              // (JPA): Tells Spring that this field cannot be null
    private String method;                                 // (card)
}
