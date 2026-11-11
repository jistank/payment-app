package com.example.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.mail.from:no-reply@payment-app.local}")
    private String from;

    @Async
    public void sendVerificationCode(String email, String code) {
        send(email, "Payment App - verification code", """
                Your 6-digit verification code is: %s

                The code expires in 5 minutes.
                If you did not request it, you can ignore this email.
                """.formatted(code));
    }

    @Async
    public void sendWelcomeEmail(String email, String nickname) {
        send(email, "Welcome to Payment App", """
                Hi %s,

                Your Payment App account has been created successfully.
                You can now log in with your email and password.

                If you did not create this account, please ignore this email.
                """.formatted(nickname));
    }

    @Async
    public void sendPasswordResetEmail(String email, String nickname, String resetLink) {
        send(email, "Reset your Payment App password", """
                Hi %s,

                We received a request to reset the password for your Payment App account.
                Open the link below to choose a new password.
                The link expires in 15 minutes and can be used only once.

                %s

                If you did not request this, ignore this email: your password will not change.
                """.formatted(nickname, resetLink));
    }

    @Async
    public void sendPasswordChangedEmail(String email) {
        send(email, "Your Payment App password was changed", """
                The password for your Payment App account was changed successfully.

                If you did not make this change, reset your password immediately.
                """);
    }

    private void send(String to, String subject, String text) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(from);
            message.setTo(to.toLowerCase(Locale.ROOT));
            message.setSubject(subject);
            message.setText(text);
            mailSender.send(message);
        } catch (Exception exception) {
            // Never fail the calling operation because of an email delivery problem.
            log.warn("Unable to send email to {}: {}", to, exception.getMessage());
        }
    }
}
