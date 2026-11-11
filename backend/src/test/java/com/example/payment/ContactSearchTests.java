package com.example.payment;

import com.example.payment.dto.ContactResponse;
import com.example.payment.model.User;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.ContactService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class ContactSearchTests {

    @Autowired
    private ContactService contactService;

    @Autowired
    private ContactRepository contactRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TransactionRepository transactionRepository;

    @Autowired
    private PaymentRequestRepository paymentRequestRepository;

    @BeforeEach
    void cleanDatabase() {
        transactionRepository.deleteAll();
        paymentRequestRepository.deleteAll();
        contactRepository.deleteAll();
        userRepository.deleteAll();
    }

    @Test
    void filtersContactsInTheDatabaseIgnoringNicknameCase() {
        User owner = createUser("owner", "owner@example.com");
        createUser("Alice", "alice@example.com");
        createUser("Bob", "bob@example.com");

        contactService.addContact(owner.getId(), "Alice");
        contactService.addContact(owner.getId(), "Bob");

        List<ContactResponse> all = contactService.getContacts(owner.getId(), null);
        assertEquals(2, all.size());

        List<ContactResponse> filtered = contactService.getContacts(owner.getId(), "ALI");
        assertEquals(1, filtered.size());
        assertEquals("Alice", filtered.get(0).nickname());
        assertEquals("alice@example.com", filtered.get(0).email());

        assertTrue(contactService.getContacts(owner.getId(), "zzz").isEmpty());
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
