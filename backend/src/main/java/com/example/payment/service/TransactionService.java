package com.example.payment.service;

import com.example.payment.dto.TransactionHistoryResponse;
import com.example.payment.exception.NotFoundException;
import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;
import com.example.payment.model.User;
import com.example.payment.realtime.RealtimeService;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final RealtimeService realtimeService;

    @Transactional
    public Transaction processPayment(Long senderId, Long receiverId, BigDecimal amount, String currency, TransactionType type) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transaction amount must be greater than zero.");
        }

        if (senderId == null || receiverId == null) {
            throw new IllegalArgumentException("Sender and receiver are required.");
        }

        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send money to yourself.");
        }

        if (type == null) {
            throw new IllegalArgumentException("Transaction type is required.");
        }

        if (type == TransactionType.TOP_UP) {
            throw new IllegalArgumentException("TOP_UP transactions must use the top-up flow.");
        }

        String resolvedCurrency = normalizeCurrency(currency);

        // Lock both rows in a deterministic order. This prevents lost updates and
        // deadlocks when two users send money to each other at the same time.
        User sender;
        User receiver;
        if (senderId < receiverId) {
            sender = lockUser(senderId, "Sender");
            receiver = lockUser(receiverId, "Receiver");
        } else {
            receiver = lockUser(receiverId, "Receiver");
            sender = lockUser(senderId, "Sender");
        }

        if (sender.getBalance().compareTo(amount) < 0) {
            throw new IllegalStateException("Insufficient funds");
        }

        sender.setBalance(sender.getBalance().subtract(amount));
        receiver.setBalance(receiver.getBalance().add(amount));

        userRepository.save(sender);
        userRepository.save(receiver);

        Transaction transaction = new Transaction();
        transaction.setSenderId(senderId);
        transaction.setReceiverId(receiverId);
        transaction.setAmount(amount);
        transaction.setCurrency(resolvedCurrency);
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setTransactionType(type);
        transaction.setMethod("BALANCE");

        Transaction saved = transactionRepository.save(transaction);

        // Both sides see a new movement and a new balance. Publishing after the
        // commit guarantees listeners never refetch uncommitted data.
        realtimeService.publishAfterCommit(Set.of(senderId, receiverId), "payment.completed");

        return saved;
    }

    @Transactional
    public Transaction recordTopUp(Long userId, BigDecimal amount, String currency) {
        return recordTopUp(userId, amount, currency, "TOP_UP");
    }

    @Transactional
    public Transaction recordTopUp(Long userId, BigDecimal amount, String currency, String method) {
        if (userId == null) {
            throw new IllegalArgumentException("User is required.");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero.");
        }

        Transaction transaction = new Transaction();
        transaction.setSenderId(userId);
        transaction.setReceiverId(userId);
        transaction.setAmount(amount);
        transaction.setCurrency(normalizeCurrency(currency));
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setTransactionType(TransactionType.TOP_UP);
        transaction.setMethod(method == null || method.isBlank() ? "TOP_UP" : method);

        Transaction saved = transactionRepository.save(transaction);

        realtimeService.publishAfterCommit(Set.of(userId), "balance.changed");

        return saved;
    }

    private User lockUser(Long id, String role) {
        return userRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException(role + " not found with ID: " + id));
    }

    private String normalizeCurrency(String currency) {
        if (currency == null || currency.isBlank()) {
            throw new IllegalArgumentException("Currency is required.");
        }

        String normalized = currency.trim().toUpperCase(Locale.ROOT);
        if (!normalized.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Currency must be a 3-letter code.");
        }

        return normalized;
    }

    @Transactional(readOnly = true)
    public Transaction getTransactionById(Long id) {
        return transactionRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("Transaction not found with id: " + id));
    }

    @Transactional(readOnly = true)
    public List<TransactionHistoryResponse> getHistoryForUser(Long userId) {
        List<Transaction> transactions =
                transactionRepository.findBySenderIdOrReceiverIdOrderByTransactionTimeDesc(userId, userId);

        Set<Long> counterpartIds = transactions.stream()
                .map(transaction -> counterpartId(transaction, userId))
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());

        Map<Long, User> users = userRepository.findAllById(counterpartIds).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));

        return transactions.stream()
                .map(transaction -> toHistoryResponse(transaction, userId, users))
                .toList();
    }

    private TransactionHistoryResponse toHistoryResponse(Transaction transaction, Long userId, Map<Long, User> users) {
        Long counterpartId = counterpartId(transaction, userId);
        User counterpart = users.get(counterpartId);

        return new TransactionHistoryResponse(
                transaction.getId(),
                direction(transaction, userId),
                counterpartId,
                counterpart != null ? counterpart.getNickname() : null,
                transaction.getAmount(),
                transaction.getCurrency(),
                transaction.getTransactionStatus(),
                transaction.getTransactionType(),
                transaction.getMethod(),
                transaction.getTransactionTime()
        );
    }

    private Long counterpartId(Transaction transaction, Long userId) {
        if (transaction.getTransactionType() == TransactionType.TOP_UP) {
            return userId;
        }
        return userId.equals(transaction.getSenderId())
                ? transaction.getReceiverId()
                : transaction.getSenderId();
    }

    private String direction(Transaction transaction, Long userId) {
        if (transaction.getTransactionType() == TransactionType.TOP_UP) {
            return "TOP_UP";
        }
        return userId.equals(transaction.getSenderId()) ? "SENT" : "RECEIVED";
    }
}
