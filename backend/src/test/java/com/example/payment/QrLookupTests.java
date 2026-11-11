package com.example.payment;

import com.example.payment.exception.NotFoundException;
import com.example.payment.model.User;
import com.example.payment.model.UserRole;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

/**
 * The receive QR is a public address. Resolution must work for a valid
 * payload and must look like "user not found" for everything else, so the
 * endpoint cannot be used to discover suspended or admin accounts.
 */
@SpringBootTest
@ActiveProfiles("test")
class QrLookupTests {

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

    @BeforeEach
    void cleanDatabase() {
        transactionRepository.deleteAll();
        paymentRequestRepository.deleteAll();
        contactRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void resolvesACanonicalPayloadToTheOwner() {
        User alice = createUser("alice", "alice@example.com", UserRole.USER, false);

        User resolved = userService.getUserByQrReceive(alice.getQrReceive());

        assertEquals(alice.getId(), resolved.getId());
        assertEquals("alice", resolved.getNickname());
    }

    @Test
    void trimsSurroundingWhitespace() {
        User alice = createUser("alice", "alice@example.com", UserRole.USER, false);

        User resolved = userService.getUserByQrReceive("  " + alice.getQrReceive() + "\n");

        assertEquals(alice.getId(), resolved.getId());
    }

    @Test
    void rejectsUnknownPayloads() {
        createUser("alice", "alice@example.com", UserRole.USER, false);

        assertThrows(NotFoundException.class,
                () -> userService.getUserByQrReceive("app://receive/" + UUID.randomUUID()));
    }

    @Test
    void rejectsPayloadsWithAForeignPrefix() {
        User alice = createUser("alice", "alice@example.com", UserRole.USER, false);
        String uuid = alice.getQrReceive().substring("app://receive/".length());

        assertThrows(NotFoundException.class,
                () -> userService.getUserByQrReceive("https://evil.example/receive/" + uuid));
        assertThrows(NotFoundException.class,
                () -> userService.getUserByQrReceive(uuid));
        assertThrows(NotFoundException.class,
                () -> userService.getUserByQrReceive(null));
    }

    @Test
    void hidesSuspendedAccounts() {
        User alice = createUser("alice", "alice@example.com", UserRole.USER, true);

        assertThrows(NotFoundException.class,
                () -> userService.getUserByQrReceive(alice.getQrReceive()));
    }

    @Test
    void hidesAdminAccounts() {
        User admin = createUser("root", "root@example.com", UserRole.ADMIN, false);

        assertThrows(NotFoundException.class,
                () -> userService.getUserByQrReceive(admin.getQrReceive()));
    }

    private User createUser(String nickname, String email, UserRole role, boolean suspended) {
        User user = new User();
        user.setNickname(nickname);
        user.setEmail(email);
        user.setPassword("not-used-in-this-test");
        user.setBusiness(false);
        user.setBalance(BigDecimal.ZERO);
        user.setRole(role);
        user.setSuspended(suspended);
        user.setQrReceive("app://receive/" + UUID.randomUUID());
        return userRepository.saveAndFlush(user);
    }
}
