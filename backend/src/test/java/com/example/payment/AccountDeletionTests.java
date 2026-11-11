package com.example.payment;

import com.example.payment.model.User;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.ContactService;
import com.example.payment.service.PaymentRequestService;
import com.example.payment.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class AccountDeletionTests {

    @Autowired
    private UserService userService;

    @Autowired
    private ContactService contactService;

    @Autowired
    private PaymentRequestService paymentRequestService;

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
    void deletingAnAccountRemovesDanglingContactsAndPendingRequests() {
        User payer = createUser("payer", "payer@example.com");
        User requester = createUser("requester", "requester@example.com");

        contactService.addContact(payer.getId(), requester.getNickname());
        paymentRequestService.createRequest(
                requester.getId(),
                payer.getNickname(),
                new BigDecimal("10.00"),
                "USD",
                "pending request"
        );

        userService.deleteUserAccount(requester.getId(), requester.getNickname());

        // Other users' lists must keep working and must not expose the deleted user.
        assertTrue(contactService.getContacts(payer.getId(), null).isEmpty());
        assertTrue(paymentRequestService.getIncomingRequests(payer.getId()).isEmpty());
        assertEquals(0, contactRepository.count());
        assertEquals(0, paymentRequestRepository.count());
    }

    private User createUser(String nickname, String email) {
        User user = new User();
        user.setNickname(nickname);
        user.setEmail(email);
        user.setPassword("not-used-in-this-test");
        user.setBusiness(false);
        user.setBalance(BigDecimal.ZERO);
        return userRepository.saveAndFlush(user);
    }
}
