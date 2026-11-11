package com.example.payment.controller;

import com.example.payment.dto.AuthResponse;
import com.example.payment.dto.ForgotPasswordRequest;
import com.example.payment.dto.LoginRequest;
import com.example.payment.dto.MessageResponse;
import com.example.payment.dto.RegisterRequest;
import com.example.payment.dto.ResetPasswordRequest;
import com.example.payment.dto.SendCodeRequest;
import com.example.payment.dto.UserResponse;
import com.example.payment.model.User;
import com.example.payment.security.JwtService;
import com.example.payment.service.EmailService;
import com.example.payment.service.PasswordResetService;
import com.example.payment.service.UserService;
import com.example.payment.service.VerificationCodeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Locale;

@RestController               // Define this class as a REST controller to handle HTTP requests
@RequestMapping("/api/auth")  // Map requests to /api/auth to this controller
@RequiredArgsConstructor      // Generate a constructor with required arguments for final fields (userService, authenticationManager, jwtService, userDetailsService)
public class AuthController {

    private final UserService userService;                      // Inject the UserService to handle user-related operations
    private final AuthenticationManager authenticationManager;  // Inject the AuthenticationManager to handle authentication
    private final JwtService jwtService;                        // Inject the JwtService to handle JWT token generation and validation
    private final UserDetailsService userDetailsService;        // Inject the UserDetailsService to load user details for authentication
    private final VerificationCodeService verificationCodeService; // Inject the service that generates and emails verification codes
    private final PasswordResetService passwordResetService;     // Inject the service that handles password reset tokens
    private final EmailService emailService;                     // Inject the service that sends transactional emails

    // Send a 6-digit verification code by email.
    // The response is always the same, even if the address does not exist,
    // so the endpoint cannot be used to discover registered emails.
    @PostMapping("/send-code")
    public ResponseEntity<MessageResponse> sendCode(@Valid @RequestBody SendCodeRequest request) {
        verificationCodeService.sendRegistrationCode(request.email());
        return ResponseEntity.ok(new MessageResponse("Verification code sent"));
    }

    // Always returns the same message so the endpoint cannot be used to discover
    // whether an email is registered.
    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.requestPasswordReset(request.email());
        return ResponseEntity.ok(new MessageResponse("If the account exists, a password reset email has been sent"));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.resetPassword(request.token(), request.newPassword());
        return ResponseEntity.ok(new MessageResponse("Password updated successfully"));
    }

    // Handle user registration requests
    @PostMapping("/register")
    public ResponseEntity<UserResponse> register(@Valid @RequestBody RegisterRequest request) {
        verificationCodeService.verifyRegistrationCode(request.email(), request.verificationCode());

        User user = new User();
        user.setNickname(request.nickname());
        user.setEmail(request.email());
        user.setPassword(request.password());
        user.setBusiness(request.business());

        User saved = userService.registerUser(user);
        verificationCodeService.clearRegistrationCode(request.email());
        emailService.sendWelcomeEmail(saved.getEmail(), saved.getNickname());
        return ResponseEntity.status(HttpStatus.CREATED).body(UserResponse.from(saved));
    }

    // Handle user login requests
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        String email = request.email().trim().toLowerCase(Locale.ROOT);

        authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, request.password()));

        UserDetails userDetails = userDetailsService.loadUserByUsername(email);
        User user = userService.getUserByEmail(email);
        String jwtToken = jwtService.generateToken(userDetails, user.getTokenVersion());

        return ResponseEntity.ok(new AuthResponse(jwtToken, UserResponse.from(user)));
    }
}
