package com.example.payment.service;

import com.example.payment.dto.PaymentRequestResponse;
import com.example.payment.exception.NotFoundException;
import com.example.payment.model.Contact;
import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentRequestStatus;
import com.example.payment.model.TransactionType;
import com.example.payment.model.User;
import com.example.payment.realtime.RealtimeService;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PaymentRequestService {

    private final PaymentRequestRepository paymentRequestRepository;
    private final ContactRepository contactRepository;
    private final UserService userService;
    private final TransactionService transactionService;
    private final RealtimeService realtimeService;

    @Transactional
    public PaymentRequestResponse createRequest(Long requesterId,
                                                String payerNickname,
                                                BigDecimal amount,
                                                String currency,
                                                String note) {
        User requester = userService.getUserById(requesterId);
        User payer = userService.getUserByNickname(payerNickname);

        if (requesterId.equals(payer.getId())) {
            throw new IllegalArgumentException("Cannot request money from yourself.");
        }

        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Requested amount must be greater than zero.");
        }

        String resolvedCurrency = (currency == null || currency.isBlank())
                ? "USD"
                : currency.trim().toUpperCase(Locale.ROOT);

        if (!resolvedCurrency.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Currency must be a 3-letter code.");
        }

        PaymentRequest request = new PaymentRequest();
        request.setRequesterId(requesterId);
        request.setPayerId(payer.getId());
        request.setAmount(amount);
        request.setCurrency(resolvedCurrency);
        request.setStatus(PaymentRequestStatus.PENDING);
        request.setNote(note == null || note.isBlank() ? null : note.trim());

        PaymentRequest saved = paymentRequestRepository.save(request);

        // The payer must see the new request without refreshing.
        realtimeService.publishAfterCommit(Set.of(payer.getId()), "payment-request.created");

        return PaymentRequestResponse.from(saved, requester, payer);
    }

    @Transactional(readOnly = true)
    public List<PaymentRequestResponse> getIncomingRequests(Long payerId) {
        User payer = userService.getUserById(payerId);
        Set<Long> contactIds = contactRepository.findByOwnerIdOrderByCreatedAtDesc(payerId).stream()
                .map(Contact::getContactId)
                .collect(Collectors.toSet());

        return paymentRequestRepository
                .findByPayerIdAndStatusOrderByCreatedAtDesc(payerId, PaymentRequestStatus.PENDING)
                .stream()
                .filter(request -> contactIds.contains(request.getRequesterId()))
                .flatMap(request -> userService.findUserById(request.getRequesterId())
                        .map(requester -> PaymentRequestResponse.from(request, requester, payer))
                        .stream())
                .toList();
    }

    @Transactional
    public PaymentRequestResponse acceptRequest(Long requestId, Long payerId) {
        PaymentRequest request = getPendingRequest(requestId, payerId);

        transactionService.processPayment(
                payerId,
                request.getRequesterId(),
                request.getAmount(),
                request.getCurrency(),
                TransactionType.FRIEND_TRANSFER
        );

        request.setStatus(PaymentRequestStatus.PAID);
        request.setResolvedAt(LocalDateTime.now());

        PaymentRequest saved = paymentRequestRepository.save(request);

        // `processPayment` above already publishes the update to payer and
        // requester once this transaction commits, so no extra event is needed.

        return PaymentRequestResponse.from(
                saved,
                userService.getUserById(saved.getRequesterId()),
                userService.getUserById(payerId));
    }

    @Transactional
    public PaymentRequestResponse declineRequest(Long requestId, Long payerId) {
        PaymentRequest request = getPendingRequest(requestId, payerId);

        request.setStatus(PaymentRequestStatus.DECLINED);
        request.setResolvedAt(LocalDateTime.now());

        PaymentRequest saved = paymentRequestRepository.save(request);

        // The requester needs to know the outcome; the payer's list changes too.
        realtimeService.publishAfterCommit(
                Set.of(saved.getRequesterId(), payerId), "payment-request.declined");

        return PaymentRequestResponse.from(
                saved,
                userService.getUserById(saved.getRequesterId()),
                userService.getUserById(payerId));
    }

    private PaymentRequest getPendingRequest(Long requestId, Long payerId) {
        // The pessimistic lock serializes accept/decline. The second concurrent
        // operation waits, then sees PAID/DECLINED and is rejected instead of
        // charging the payer a second time.
        PaymentRequest request = paymentRequestRepository.findByIdAndPayerIdForUpdate(requestId, payerId)
                .orElseThrow(() -> new NotFoundException("Payment request not found with id: " + requestId));

        if (request.getStatus() != PaymentRequestStatus.PENDING) {
            throw new IllegalStateException("Payment request has already been resolved.");
        }

        return request;
    }
}
