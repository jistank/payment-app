package com.example.payment.config;

import com.example.payment.exception.ConflictException;
import com.example.payment.model.User;
import com.example.payment.model.UserRole;
import com.example.payment.repository.UserRepository;
import com.example.payment.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Creates or promotes the first administrator from explicit environment
 * values. The public registration endpoint can never create an ADMIN.
 *
 * If ADMIN_EMAIL matches an existing account, that account is promoted. If it
 * does not exist, ADMIN_PASSWORD is required to create it.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminBootstrap implements ApplicationRunner {

    private final UserRepository userRepository;
    private final UserService userService;

    @Value("${app.admin.email:}")
    private String adminEmail;

    @Value("${app.admin.password:}")
    private String adminPassword;

    @Value("${app.admin.nickname:admin}")
    private String adminNickname;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String email = adminEmail == null ? "" : adminEmail.trim().toLowerCase();
        if (email.isEmpty()) {
            log.info("Admin bootstrap skipped: ADMIN_EMAIL is not set.");
            return;
        }

        User existing = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (existing != null) {
            boolean changed = existing.getRole() != UserRole.ADMIN || existing.isSuspended();
            existing.setRole(UserRole.ADMIN);
            existing.setSuspended(false);
            if (changed) {
                existing.setTokenVersion(existing.getTokenVersion() + 1);
                userRepository.save(existing);
                log.info("Promoted existing account '{}' to ADMIN.", existing.getNickname());
            }
            return;
        }

        if (adminPassword == null || adminPassword.length() < 8) {
            log.warn("Admin bootstrap skipped: ADMIN_PASSWORD must be at least 8 characters "
                    + "when the ADMIN_EMAIL account does not exist.");
            return;
        }

        User admin = new User();
        admin.setNickname(adminNickname == null || adminNickname.isBlank() ? "admin" : adminNickname.trim());
        admin.setEmail(email);
        admin.setPassword(adminPassword);
        admin.setBusiness(false);
        admin.setRole(UserRole.ADMIN);
        admin.setSuspended(false);

        try {
            User saved = userService.registerUser(admin);
            log.info("Created ADMIN account '{}' ({}).", saved.getNickname(), saved.getEmail());
        } catch (ConflictException exception) {
            log.error("Admin bootstrap failed: {}", exception.getMessage());
        }
    }
}
