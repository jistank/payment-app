package com.example.payment;

import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentRequestStatus;
import com.example.payment.model.TransactionType;
import com.example.payment.model.User;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.PaymentRequestService;
import com.example.payment.service.TransactionService;
import com.example.payment.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

import java.math.BigDecimal;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

@SpringBootTest
@ActiveProfiles("test")
class PaymentConcurrencyTests {

    @Autowired
    private TransactionService transactionService;

    @Autowired
    private PaymentRequestService paymentRequestService;

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
    void concurrentPaymentsCannotOverdrawOrLoseUpdates() throws Exception {
        User sender = createUser("sender", "100.00");
        User receiver = createUser("receiver", "0.00");

        Callable<Boolean> payment = () -> {
            try {
                transactionService.processPayment(
                        sender.getId(),
                        receiver.getId(),
                        new BigDecimal("60.00"),
                        "USD",
                        TransactionType.FRIEND_TRANSFER
                );
                return true;
            } catch (IllegalStateException insufficientFunds) {
                return false;
            }
        };

        List<Boolean> results = runConcurrently(payment);

        assertEquals(1, results.stream().filter(Boolean::booleanValue).count());
        assertBalance(sender, "40.00");
        assertBalance(receiver, "60.00");
        assertEquals(1, transactionRepository.count());
    }

    @Test
    void concurrentTopUpsAreNotLost() throws Exception {
        User user = createUser("topup-user", "0.00");

        Callable<Boolean> topUp = () -> {
            userService.topUpBalance(user.getId(), new BigDecimal("50.00"), "USD");
            return true;
        };

        List<Boolean> results = runConcurrently(topUp);

        assertTrue(results.stream().allMatch(Boolean::booleanValue));
        assertBalance(user, "100.00");
        assertEquals(2, transactionRepository.count());
    }

    @Test
    void concurrentAcceptChargesThePayerOnlyOnce() throws Exception {
        User payer = createUser("payer", "100.00");
        User requester = createUser("requester", "0.00");

        PaymentRequest request = new PaymentRequest();
        request.setRequesterId(requester.getId());
        request.setPayerId(payer.getId());
        request.setAmount(new BigDecimal("60.00"));
        request.setCurrency("USD");
        request.setStatus(PaymentRequestStatus.PENDING);
        request.setNote("concurrency test");
        Long requestId = paymentRequestRepository.saveAndFlush(request).getId();

        Callable<Boolean> accept = () -> {
            try {
                paymentRequestService.acceptRequest(requestId, payer.getId());
                return true;
            } catch (IllegalStateException alreadyResolved) {
                return false;
            }
        };

        List<Boolean> results = runConcurrently(accept);

        assertEquals(1, results.stream().filter(Boolean::booleanValue).count());
        assertBalance(payer, "40.00");
        assertBalance(requester, "60.00");
        assertEquals(1, transactionRepository.count());
        assertEquals(
                PaymentRequestStatus.PAID,
                paymentRequestRepository.findById(requestId).orElseThrow().getStatus()
        );
    }

    @Test
    void oppositeTransfersDoNotDeadlock() throws Exception {
        User first = createUser("first", "100.00");
        User second = createUser("second", "100.00");

        Callable<Boolean> firstToSecond = () -> {
            transactionService.processPayment(
                    first.getId(),
                    second.getId(),
                    new BigDecimal("10.00"),
                    "USD",
                    TransactionType.FRIEND_TRANSFER
            );
            return true;
        };

        Callable<Boolean> secondToFirst = () -> {
            transactionService.processPayment(
                    second.getId(),
                    first.getId(),
                    new BigDecimal("10.00"),
                    "USD",
                    TransactionType.FRIEND_TRANSFER
            );
            return true;
        };

        List<Boolean> results = runConcurrently(firstToSecond, secondToFirst);

        assertTrue(results.stream().allMatch(Boolean::booleanValue));
        assertBalance(first, "100.00");
        assertBalance(second, "100.00");
        assertEquals(2, transactionRepository.count());
    }

    private User createUser(String nickname, String balance) {
        User user = new User();
        user.setNickname(nickname);
        user.setEmail(nickname + "@example.com");
        user.setPassword("not-used-in-these-tests");
        user.setBusiness(false);
        user.setBalance(new BigDecimal(balance));
        return userRepository.saveAndFlush(user);
    }

    private void assertBalance(User user, String expected) {
        BigDecimal actual = userRepository.findById(user.getId()).orElseThrow().getBalance();
        assertEquals(0, new BigDecimal(expected).compareTo(actual),
                () -> "Expected balance " + expected + " but was " + actual);
    }

    private List<Boolean> runConcurrently(Callable<Boolean> action) throws Exception {
        return runConcurrently(action, action);
    }

    private List<Boolean> runConcurrently(Callable<Boolean> firstAction, Callable<Boolean> secondAction) throws Exception {
        ExecutorService executor = Executors.newFixedThreadPool(2);
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);

        Callable<Boolean> first = synchronizeStart(firstAction, ready, start);
        Callable<Boolean> second = synchronizeStart(secondAction, ready, start);

        Future<Boolean> firstFuture = executor.submit(first);
        Future<Boolean> secondFuture = executor.submit(second);

        try {
            assertTrue(ready.await(5, TimeUnit.SECONDS), "Both worker threads should be ready");
            start.countDown();
            return List.of(
                    firstFuture.get(15, TimeUnit.SECONDS),
                    secondFuture.get(15, TimeUnit.SECONDS)
            );
        } finally {
            executor.shutdownNow();
        }
    }

    private Callable<Boolean> synchronizeStart(Callable<Boolean> action,
                                               CountDownLatch ready,
                                               CountDownLatch start) {
        return () -> {
            ready.countDown();
            if (!start.await(5, TimeUnit.SECONDS)) {
                throw new IllegalStateException("Timed out waiting to start concurrent operation");
            }
            return action.call();
        };
    }
}
