package com.example.payment.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data                   // (Lombok): Makes getters, setters, toString(), equals(), and hashCode()
@NoArgsConstructor      // (Lombok): Makes an empty constructor, new User(). JPA needs this one
@AllArgsConstructor     // (Lombok): Makes a constructor with all fields, new User(id, nickname, ...)
@Entity                 // (JPA): Tells Spring that this class is a database table.
@Table(name = "users")  // (JPA): Tells Spring that this class is a database table named "users"
public class User {

    @Id                                                  // (JPA): Tells Spring that this field is the primary key of the table
    @GeneratedValue(strategy = GenerationType.IDENTITY)  // (JPA): Tells Spring that this field is auto-incremented by the database
    private Long id;

    @Column(unique = true, nullable = false)             // (JPA): Tells Spring that this field is unique and cannot be null
    private String nickname;

    @Column(unique = true, nullable = false)             // (JPA): Tells Spring that this field is unique and cannot be null
    private String email;

    @Column(nullable = false)                            // (JPA): Tells Spring that this field cannot be null
    private String password;

    /*
      (JPA): Tells Spring that this field is named "created_at" in the database
      updatable = false: means that this field cannot be updated after the row is created
      Automatically sets the time when the row is inserted
          (Or it can be initialized inline: private LocalDateTime createdAt = LocalDateTime.now();)
     */
    @CreationTimestamp                                 // (Hibernate): Automatically sets the time when the row is inserted
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    /*
      The text, URL data that the QR code represents
      It will be generated as image dynamically on the fly
     */
    @Column(unique = true, name = "qr_receive")         // (JPA): Tells Spring that this field is named "qr_receive" in the database, and is unique
    private String qrReceive;
    @Column(unique = true, name = "qr_pay")             // (JPA): Tells Spring that this field is named "qr_pay" in the database, and is unique
    private String qrPay;

    @Column(nullable = false)                            // (JPA): Tells Spring that this field is named "business" in the database, and cannot be null
    private boolean business;                            // Indicates if the user is a business or not

    @Column(nullable = false, precision = 19, scale = 4) // (JPA): Tells Spring that this field is a decimal with precision 19 and scale 4, and cannot be null
    private BigDecimal balance = BigDecimal.ZERO;        // Initial balance is 0.00, BigDecimal is immutable, so we need to reassign the value when we update it
}