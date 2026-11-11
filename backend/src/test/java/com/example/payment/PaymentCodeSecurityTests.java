package com.example.payment;

import com.example.payment.exception.InvalidPaymentCodeException;
import com.example.payment.model.User;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
class PaymentCodeSecurityTests {

    @Autowired
    private UserService userService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void cleanDatabase() {
        transactionRepository.deleteAll();
        paymentRequestRepository.deleteAll();
        contactRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void tooManyWrongCodesLockThePaymentCode() {
        User user = createUserWithPaymentCode("123456");

        for (int attempt = 0; attempt < 5; attempt++) {
            assertThrows(
                    InvalidPaymentCodeException.class,
                    () -> userService.verifyPaymentCode(user.getId(), "000000")
            );
        }

        // Even the correct code is rejected while the account is locked.
        assertThrows(
                InvalidPaymentCodeException.class,
                () -> userService.verifyPaymentCode(user.getId(), "123456")
        );

        User reloaded = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(5, reloaded.getPaymentCodeFailedAttempts());
        assertNotNull(reloaded.getPaymentCodeLockedUntil());
    }

    @Test
    void successfulVerificationClearsFailedAttempts() {
        User user = createUserWithPaymentCode("123456");

        assertThrows(
                InvalidPaymentCodeException.class,
                () -> userService.verifyPaymentCode(user.getId(), "000000")
        );

        userService.verifyPaymentCode(user.getId(), "123456");

        User reloaded = userRepository.findById(user.getId()).orElseThrow();
        assertEquals(0, reloaded.getPaymentCodeFailedAttempts());
        assertNull(reloaded.getPaymentCodeLockedUntil());
    }

    private User createUserWithPaymentCode(String paymentCode) {
        User user = new User();
        user.setNickname("payment-code-user");
        user.setEmail("payment-code-user@example.com");
        user.setPassword(passwordEncoder.encode("Password1!"));
        user.setBusiness(false);
        user.setBalance(BigDecimal.ZERO);
        user.setPaymentCodeHash(passwordEncoder.encode(paymentCode));
        return userRepository.saveAndFlush(user);
    }
}
