package com.example.payment.controller;

import com.example.payment.dto.AuthResponse;
import com.example.payment.dto.ChangePasswordRequest;
import com.example.payment.dto.DeleteAccountRequest;
import com.example.payment.dto.ForgotPaymentCodeRequest;
import com.example.payment.dto.MessageResponse;
import com.example.payment.dto.PaymentCodeStatusResponse;
import com.example.payment.dto.PublicUserResponse;
import com.example.payment.dto.ResetPaymentCodeRequest;
import com.example.payment.dto.TopUpRequest;
import com.example.payment.dto.UpdatePaymentCodeRequest;
import com.example.payment.dto.UserResponse;
import com.example.payment.model.User;
import com.example.payment.security.JwtService;
import com.example.payment.service.UserService;
import com.example.payment.service.VerificationCodeService;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Validated
public class UserController {

    private final UserService userService;
    private final VerificationCodeService verificationCodeService;
    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Value("${app.top-up.enabled:true}")
    private boolean topUpEnabled;

    @GetMapping("/me")
    public UserResponse getCurrentUser(Authentication authentication) {
        return UserResponse.from(userService.getUserByEmail(authentication.getName()));
    }

    @GetMapping("/{id}")
    public PublicUserResponse getUserById(@PathVariable Long id) {
        return PublicUserResponse.from(userService.getUserById(id));
    }

    @PostMapping("/me/topup")
    public UserResponse topUpBalance(@Valid @RequestBody TopUpRequest request, Authentication authentication) {
        if (!topUpEnabled) {
            throw new AccessDeniedException("Balance top-up is disabled in this environment.");
        }

        Long userId = userService.getUserByEmail(authentication.getName()).getId();
        return UserResponse.from(userService.topUpBalance(userId, request.amount(), request.currency()));
    }

    @PutMapping("/me/password")
    public ResponseEntity<AuthResponse> changePassword(@Valid @RequestBody ChangePasswordRequest request,
                                                       Authentication authentication) {
        Long userId = userService.getUserByEmail(authentication.getName()).getId();
        User user = userService.changePassword(userId, request.currentPassword(), request.newPassword());

        // Changing the password bumps tokenVersion, invalidating every token
        // issued before the change. Return a fresh token for this session.
        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String token = jwtService.generateToken(userDetails, user.getTokenVersion());

        return ResponseEntity.ok(new AuthResponse(token, UserResponse.from(user)));
    }

    @GetMapping("/me/payment-code")
    public PaymentCodeStatusResponse getPaymentCodeStatus(Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        return new PaymentCodeStatusResponse(userService.isPaymentCodeConfigured(user));
    }

    @PutMapping("/me/payment-code")
    public ResponseEntity<MessageResponse> updatePaymentCode(@Valid @RequestBody UpdatePaymentCodeRequest request,
                                                             Authentication authentication) {
        Long userId = userService.getUserByEmail(authentication.getName()).getId();
        userService.updatePaymentCode(userId, request.currentCode(), request.newCode());
        return ResponseEntity.ok(new MessageResponse("Payment code updated successfully"));
    }

    @PostMapping("/me/payment-code/forgot")
    public ResponseEntity<MessageResponse> forgotPaymentCode(@Valid @RequestBody ForgotPaymentCodeRequest request,
                                                             Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        userService.verifyAccountIdentity(user, request.nickname(), request.password());
        verificationCodeService.sendPaymentCodeResetCode(user.getEmail());
        return ResponseEntity.ok(new MessageResponse("Verification code sent"));
    }

    @PostMapping("/me/payment-code/reset")
    public ResponseEntity<MessageResponse> resetPaymentCode(@Valid @RequestBody ResetPaymentCodeRequest request,
                                                            Authentication authentication) {
        User user = userService.getUserByEmail(authentication.getName());
        userService.verifyAccountIdentity(user, request.nickname(), request.password());
        verificationCodeService.verifyPaymentCodeResetCode(user.getEmail(), request.verificationCode());
        userService.resetPaymentCode(user.getId(), request.newCode());
        return ResponseEntity.ok(new MessageResponse("Payment code reset successfully"));
    }

    @DeleteMapping("/me")
    public ResponseEntity<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request,
                                              Authentication authentication) {
        Long userId = userService.getUserByEmail(authentication.getName()).getId();
        userService.verifyPaymentCode(userId, request.code());
        userService.deleteUserAccount(userId, request.nickname());
        return ResponseEntity.noContent().build();
    }

    @GetMapping
    public List<PublicUserResponse> searchUsers(@RequestParam @NotBlank String nickname) {
        return userService.searchByNickname(nickname).stream()
                .map(PublicUserResponse::from)
                .toList();
    }

    /**
     * Resolves the permanent receive QR payload (`app://receive/<uuid>`) to the
     * public profile of its owner. Used by the mobile app right after a scan.
     * Path is literal so it takes precedence over `/api/users/{id}`.
     */
    @GetMapping("/qr")
    public PublicUserResponse getUserByQr(@RequestParam @NotBlank String payload) {
        return PublicUserResponse.from(userService.getUserByQrReceive(payload));
    }
}
