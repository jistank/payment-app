package com.example.payment.controller;

import com.example.payment.dto.PaymentRequest;
import com.example.payment.dto.TransactionHistoryResponse;
import com.example.payment.dto.TransactionResponse;
import com.example.payment.model.Transaction;
import com.example.payment.model.User;
import com.example.payment.service.TransactionService;
import com.example.payment.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequestMapping("/api/transactions")
@RequiredArgsConstructor
public class TransactionController {

    private final TransactionService transactionService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<TransactionResponse> createTransaction(@Valid @RequestBody PaymentRequest request,
                                                                Authentication authentication) {
        User sender = userService.getUserByEmail(authentication.getName());
        User receiver = userService.getUserByNickname(request.nickname());

        userService.verifyPaymentCode(sender.getId(), request.code());

        Transaction transaction = transactionService.processPayment(
                sender.getId(),
                receiver.getId(),
                request.amount(),
                request.currency().toUpperCase(Locale.ROOT),
                request.type()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(TransactionResponse.from(transaction));
    }

    @GetMapping("/me")
    public List<TransactionHistoryResponse> getCurrentUserTransactions(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());

        return transactionService.getHistoryForUser(user.getId());
    }

    @GetMapping("/{id}")
    public TransactionResponse getTransactionById(@PathVariable Long id, Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        Transaction transaction = transactionService.getTransactionById(id);

        boolean isParticipant = transaction.getSenderId().equals(user.getId())
                || transaction.getReceiverId().equals(user.getId());
        if (!isParticipant) {
            throw new AccessDeniedException("You are not allowed to view this transaction");
        }

        return TransactionResponse.from(transaction);
    }
}
