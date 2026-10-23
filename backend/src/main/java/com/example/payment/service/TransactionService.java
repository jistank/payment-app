package com.example.payment.service;

import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;
import com.example.payment.model.User;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor // Automatically injects the repositories
public class TransactionService {

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;

    /**
     * Processes a payment from one user to another.
     *
     * @Transactional is CRITICAL: If any step fails (e.g., database crash),
     * the entire operation is rolled back. No partial updates.
     */
    @Transactional      // Ensures atomicity of the transaction
    public Transaction processPayment(Long senderId, Long receiverId, BigDecimal amount, String currency, TransactionType type) {

        // Check if the amount is less than or equal to zero
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Transaction amount must be greater than zero.");
        }

        // Check if the sender and receiver are the same
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("Cannot send money to yourself.");
        }

        // Fetch sender and receiver from the database
        User sender = userRepository.findById(senderId)
                .orElseThrow(() -> new RuntimeException("Sender not found with ID: " + senderId));

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new RuntimeException("Receiver not found with ID: " + receiverId));

        // compareTo returns -1 if sender's balance is LESS than the amount
        if (sender.getBalance().compareTo(amount) < 0) {
            throw new RuntimeException("Insufficient funds. Current balance: " + sender.getBalance());
        }

        // Update balances
        // BigDecimal is immutable, we must reassign the result of add/subtract.
        sender.setBalance(sender.getBalance().subtract(amount));
        receiver.setBalance(receiver.getBalance().add(amount));

        // Save the updated users (Spring will flush this to the DB)
        userRepository.save(sender);
        userRepository.save(receiver);

        // Create the transaction record
        Transaction transaction = new Transaction();
        transaction.setSenderId(senderId);
        transaction.setReceiverId(receiverId);
        transaction.setAmount(amount);
        transaction.setCurrency(currency);
        transaction.setTransactionStatus(TransactionStatus.COMPLETED);
        transaction.setTransactionType(type);
        transaction.setMethod("INTERNAL_WALLET");

        // Save and return the transaction
        return transactionRepository.save(transaction);
    }
}