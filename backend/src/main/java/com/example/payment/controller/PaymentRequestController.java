package com.example.payment.controller;

import com.example.payment.dto.CreatePaymentRequest;
import com.example.payment.dto.PaymentCodeRequest;
import com.example.payment.dto.PaymentRequestResponse;
import com.example.payment.model.User;
import com.example.payment.service.PaymentRequestService;
import com.example.payment.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/payment-requests")
@RequiredArgsConstructor
public class PaymentRequestController {

    private final PaymentRequestService paymentRequestService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<PaymentRequestResponse> createRequest(
            @Valid @RequestBody CreatePaymentRequest request,
            Authentication authentication) {
        User requester = userService.getUserByEmail(authentication.getName());

        PaymentRequestResponse created = paymentRequestService.createRequest(
                requester.getId(),
                request.nickname(),
                request.amount(),
                request.currency(),
                request.note()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    @GetMapping("/incoming")
    public List<PaymentRequestResponse> getIncomingRequests(Authentication authentication) {
        User payer = userService.getUserByEmail(authentication.getName());

        return paymentRequestService.getIncomingRequests(payer.getId());
    }

    @PostMapping("/{id}/accept")
    public PaymentRequestResponse acceptRequest(@PathVariable Long id,
                                                @Valid @RequestBody PaymentCodeRequest request,
                                                Authentication authentication) {
        Long payerId = userService.getUserByEmail(authentication.getName()).getId();
        userService.verifyPaymentCode(payerId, request.code());

        return paymentRequestService.acceptRequest(id, payerId);
    }

    @PostMapping("/{id}/decline")
    public PaymentRequestResponse declineRequest(@PathVariable Long id, Authentication authentication) {
        User payer = userService.getUserByEmail(authentication.getName());

        return paymentRequestService.declineRequest(id, payer.getId());
    }
}
