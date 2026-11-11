package com.example.payment;

import com.example.payment.dto.AdminStatsResponse;
import com.example.payment.dto.AdminTopUpRequest;
import com.example.payment.dto.AdminUserResponse;
import com.example.payment.model.AuditLog;
import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionType;
import com.example.payment.model.User;
import com.example.payment.model.UserRole;
import com.example.payment.repository.AuditLogRepository;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.AdminService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class AdminServiceTests {

    @Autowired
    private AdminService adminService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @BeforeEach
    void cleanDatabase() {
        auditLogRepository.deleteAll();
        transactionRepository.deleteAll();
        paymentRequestRepository.deleteAll();
        contactRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void suspendingAndReactivatingAnAccountWritesAuditTrail() {
        User admin = createUser("admin", "admin@example.com", UserRole.ADMIN);
        User user = createUser("mario", "mario@example.com", UserRole.USER);
        long originalVersion = user.getTokenVersion();

        AdminUserResponse suspended = adminService.suspendUser(admin.getEmail(), user.getId());

        assertTrue(suspended.suspended());
        assertEquals(originalVersion + 1, userRepository.findById(user.getId()).orElseThrow().getTokenVersion());
        assertEquals("USER_SUSPENDED", latestAudit().getAction());

        AdminUserResponse reactivated = adminService.reactivateUser(admin.getEmail(), user.getId());

        assertFalse(reactivated.suspended());
        assertEquals("USER_REACTIVATED", latestAudit().getAction());
    }

    @Test
    void adminsCannotManageThemselvesOrOtherAdmins() {
        User admin = createUser("admin", "admin@example.com", UserRole.ADMIN);
        User otherAdmin = createUser("admin2", "admin2@example.com", UserRole.ADMIN);

        assertThrows(IllegalArgumentException.class,
                () -> adminService.suspendUser(admin.getEmail(), admin.getId()));
        assertThrows(IllegalArgumentException.class,
                () -> adminService.deleteUser(admin.getEmail(), otherAdmin.getId()));
    }

    @Test
    void manualTopUpCreditsBalanceAndRecordsAdminTransaction() {
        User admin = createUser("admin", "admin@example.com", UserRole.ADMIN);
        User user = createUser("mario", "mario@example.com", UserRole.USER);

        AdminUserResponse updated = adminService.topUpUser(
                admin.getEmail(),
                user.getId(),
                new AdminTopUpRequest(new BigDecimal("25.50"), "usd", "goodwill credit")
        );

        assertEquals(new BigDecimal("25.5000"), updated.balance());

        List<Transaction> transactions = transactionRepository.findAll();
        assertEquals(1, transactions.size());
        assertEquals(TransactionType.TOP_UP, transactions.get(0).getTransactionType());
        assertEquals("ADMIN_TOP_UP", transactions.get(0).getMethod());

        AuditLog audit = latestAudit();
        assertEquals("MANUAL_TOP_UP", audit.getAction());
        assertTrue(audit.getDetails().contains("25.50 USD"));
        assertTrue(audit.getDetails().contains("goodwill credit"));
    }

    @Test
    void userSearchAndStatsReflectSuspensionsAndPendingRequests() {
        User admin = createUser("admin", "admin@example.com", UserRole.ADMIN);
        User active = createUser("mario", "mario@example.com", UserRole.USER);
        User suspended = createUser("luigi", "luigi@example.com", UserRole.USER);
        adminService.suspendUser(admin.getEmail(), suspended.getId());

        List<AdminUserResponse> suspendedOnly = adminService.searchUsers("", "SUSPENDED");
        assertEquals(1, suspendedOnly.size());
        assertEquals("luigi", suspendedOnly.get(0).nickname());

        List<AdminUserResponse> searchByEmail = adminService.searchUsers("mario@example", "ALL");
        assertEquals(1, searchByEmail.size());
        assertEquals(active.getId(), searchByEmail.get(0).id());

        AdminStatsResponse stats = adminService.getStats();
        assertEquals(3, stats.totalUsers());
        assertEquals(2, stats.activeUsers());
        assertEquals(1, stats.suspendedUsers());
        assertNotNull(stats.transactionVolume());
    }

    @Test
    void deletingAUserKeepsTheAuditEntry() {
        User admin = createUser("admin", "admin@example.com", UserRole.ADMIN);
        User user = createUser("mario", "mario@example.com", UserRole.USER);

        adminService.deleteUser(admin.getEmail(), user.getId());

        assertFalse(userRepository.findById(user.getId()).isPresent());

        AuditLog audit = latestAudit();
        assertEquals("USER_DELETED", audit.getAction());
        assertEquals(user.getId(), audit.getTargetId());
        assertEquals("mario", audit.getDetails());
    }

    private User createUser(String nickname, String email, UserRole role) {
        User user = new User();
        user.setNickname(nickname);
        user.setEmail(email);
        user.setPassword("not-used-in-this-test");
        user.setBusiness(false);
        user.setBalance(BigDecimal.ZERO);
        user.setRole(role);
        return userRepository.saveAndFlush(user);
    }

    private AuditLog latestAudit() {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(
                org.springframework.data.domain.PageRequest.of(0, 1)).get(0);
    }
}
