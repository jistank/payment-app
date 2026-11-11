package com.example.payment.service;

import com.example.payment.exception.ConflictException;
import com.example.payment.exception.InvalidPaymentCodeException;
import com.example.payment.exception.NotFoundException;
import com.example.payment.model.PaymentRequestStatus;
import com.example.payment.model.User;
import com.example.payment.model.UserRole;
import com.example.payment.repository.ContactRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.UUID;

@Service       // (Spring): Tells Spring that this class is a service, it will be automatically detected and registered as a bean in the application context
@RequiredArgsConstructor // (Lombok): Generates a constructor with required arguments (final fields) for dependency injection
public class UserService {

    private static final int MAX_PAYMENT_CODE_ATTEMPTS = 5;
    private static final Duration PAYMENT_CODE_LOCK_DURATION = Duration.ofMinutes(15);
    private static final String QR_RECEIVE_PREFIX = "app://receive/";

    private final UserRepository userRepository;
    private final ContactRepository contactRepository;
    private final PaymentRequestRepository paymentRequestRepository;
    private final PasswordEncoder passwordEncoder;
    private final TransactionService transactionService;


    // Check if the email is already taken
    @Transactional
    public User registerUser(User newUser) {
        newUser.setEmail(normalizeEmail(newUser.getEmail()));
        newUser.setNickname(newUser.getNickname() == null ? null : newUser.getNickname().trim());

        if (userRepository.existsByEmailIgnoreCase(newUser.getEmail())) {
            throw new ConflictException("Email is already registered!");
        }
        if (userRepository.existsByNickname(newUser.getNickname())) {
            throw new ConflictException("Nickname is already taken!");
        }

        newUser.setPassword(passwordEncoder.encode(newUser.getPassword()));   // SECURITY: Hash the password before saving it to the database

        // The receive QR is a stable, public address for this account. It only
        // lets others send money here; it does not authorize outgoing payments.
        String uniqueReceiveId = UUID.randomUUID().toString();                // We use UUIDs guarantees they are unique across the database
        newUser.setQrReceive(QR_RECEIVE_PREFIX + uniqueReceiveId);

        try {
            // saveAndFlush makes the unique-constraint violation happen here,
            // where it can be translated into a proper 409 response.
            return userRepository.saveAndFlush(newUser);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("Email or nickname is already registered.");
        }
    }

    public List<User> searchByNickname(String nickname) {
        // Suspended accounts and admins are not payment recipients, so they do
        // not appear in the public user search.
        return userRepository.findByNicknameContainingIgnoreCase(nickname == null ? "" : nickname.trim())
                .stream()
                .filter(user -> !user.isSuspended() && user.getRole() == UserRole.USER)
                .toList();
    }

    // Finds a user by their ID. Used when processing transactions.
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + id));
    }

    public Optional<User> findUserById(Long id) {
        return id == null ? Optional.empty() : userRepository.findById(id);
    }

    // Finds a user by their email. Used for logging in.
    public User getUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email))
                .orElseThrow(() -> new NotFoundException("User not found with email: " + email));
    }

    public Optional<User> findUserByEmail(String email) {
        return userRepository.findByEmailIgnoreCase(normalizeEmail(email));
    }

    @Transactional
    public User resetPassword(Long userId, String newPassword) {
        User user = getUserByIdForUpdate(userId);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setTokenVersion(user.getTokenVersion() + 1);
        return userRepository.save(user);
    }

    @Transactional
    public User changePassword(Long userId, String currentPassword, String newPassword) {
        User user = getUserByIdForUpdate(userId);

        if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
            throw new IllegalArgumentException("Current password is incorrect.");
        }

        user.setPassword(passwordEncoder.encode(newPassword));
        // Invalidate tokens issued before this password change.
        user.setTokenVersion(user.getTokenVersion() + 1);
        return userRepository.save(user);
    }

    public boolean isPaymentCodeConfigured(User user) {
        return user.getPaymentCodeHash() != null;
    }

    public void verifyAccountIdentity(User user, String nickname, String password) {
        if (!user.getNickname().equals(nickname)) {
            throw new IllegalArgumentException("Nickname does not match your account.");
        }

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException("Password is incorrect.");
        }
    }

    @Transactional
    public void resetPaymentCode(Long userId, String newCode) {
        User user = getUserByIdForUpdate(userId);
        user.setPaymentCodeHash(passwordEncoder.encode(newCode));
        clearPaymentCodeFailures(user);
        userRepository.save(user);
    }

    @Transactional(noRollbackFor = InvalidPaymentCodeException.class)
    public void updatePaymentCode(Long userId, String currentCode, String newCode) {
        User user = getUserByIdForUpdate(userId);

        if (isPaymentCodeConfigured(user)) {
            // Reuse the same lockout logic as payment verification so the
            // current code cannot be brute-forced through this endpoint.
            verifyPaymentCodeLocked(user, currentCode);
        }

        user.setPaymentCodeHash(passwordEncoder.encode(newCode));
        clearPaymentCodeFailures(user);
        userRepository.save(user);
    }

    /**
     * Verifies the payment code and applies brute-force protection.
     *
     * NoRollbackFor is intentional: failed attempts must be persisted even
     * though the verification throws. Otherwise an attacker could guess an
     * unlimited number of codes.
     */
    @Transactional(noRollbackFor = InvalidPaymentCodeException.class)
    public void verifyPaymentCode(Long userId, String code) {
        User user = getUserByIdForUpdate(userId);
        verifyPaymentCodeLocked(user, code);
    }

    private void verifyPaymentCodeLocked(User user, String code) {
        LocalDateTime now = LocalDateTime.now();

        if (user.getPaymentCodeLockedUntil() != null && user.getPaymentCodeLockedUntil().isAfter(now)) {
            throw new InvalidPaymentCodeException("Too many invalid attempts. Try again later.");
        }

        // The lockout expired: give the account a clean slate.
        if (user.getPaymentCodeLockedUntil() != null) {
            clearPaymentCodeFailures(user);
        }

        String hash = user.getPaymentCodeHash();

        if (hash == null) {
            throw new IllegalStateException("Payment code is not configured.");
        }

        if (code == null || !passwordEncoder.matches(code, hash)) {
            int failedAttempts = user.getPaymentCodeFailedAttempts() + 1;
            user.setPaymentCodeFailedAttempts(failedAttempts);

            if (failedAttempts >= MAX_PAYMENT_CODE_ATTEMPTS) {
                user.setPaymentCodeLockedUntil(now.plus(PAYMENT_CODE_LOCK_DURATION));
            }

            userRepository.save(user);
            throw new InvalidPaymentCodeException("Invalid payment code.");
        }

        if (user.getPaymentCodeFailedAttempts() != 0 || user.getPaymentCodeLockedUntil() != null) {
            clearPaymentCodeFailures(user);
            userRepository.save(user);
        }
    }

    private void clearPaymentCodeFailures(User user) {
        user.setPaymentCodeFailedAttempts(0);
        user.setPaymentCodeLockedUntil(null);
    }

    @Transactional
    public void deleteUserAccount(Long userId, String nickname) {
        // Validate first so a wrong nickname never triggers destructive cleanup.
        User snapshot = getUserById(userId);
        if (!snapshot.getNickname().equals(nickname)) {
            throw new IllegalArgumentException("Nickname does not match your account.");
        }

        // Clean up references that could otherwise break other users' lists.
        // Pending requests and contacts are removed in a deterministic order
        // (contacts, requests, then the user row) to avoid deadlocks with
        // concurrent accept/payment transactions.
        contactRepository.deleteByUserId(userId);
        paymentRequestRepository.deleteByStatusAndUserId(PaymentRequestStatus.PENDING, userId);

        // Take the same row lock used by payments so an account cannot be deleted
        // in the middle of a transfer that is reading or updating its balance.
        User user = getUserByIdForUpdate(userId);

        if (!user.getNickname().equals(nickname)) {
            throw new IllegalArgumentException("Nickname does not match your account.");
        }

        userRepository.delete(user);
    }

    // Finds a user by their nickname. Used to resolve payment recipients.
    public User getUserByNickname(String nickname) {
        String normalizedNickname = nickname == null ? null : nickname.trim();
        User user = userRepository.findByNickname(normalizedNickname)
                .orElseThrow(() -> new NotFoundException("User not found with nickname: " + nickname));

        // A suspended account (or an admin account) cannot be a payment target.
        // Return the same 404 as an unknown nickname to avoid leaking state.
        if (user.isSuspended() || user.getRole() != UserRole.USER) {
            throw new NotFoundException("User not found with nickname: " + nickname);
        }
        return user;
    }

    /**
     * Finds a user by their Receive QR payload.
     * When User A scans User B's QR code, the app reads the string, calls this
     * method, and finds User B. Only the canonical `app://receive/<id>` payload
     * is accepted, and suspended or admin accounts are hidden exactly like an
     * unknown nickname, so the endpoint cannot be used to enumerate them.
     */
    @Transactional(readOnly = true)
    public User getUserByQrReceive(String qrReceivePayload) {
        String payload = qrReceivePayload == null ? "" : qrReceivePayload.trim();
        if (!payload.startsWith(QR_RECEIVE_PREFIX)) {
            throw new NotFoundException("Invalid QR code. User not found.");
        }

        User user = userRepository.findByQrReceive(payload)
                .orElseThrow(() -> new NotFoundException("Invalid QR code. User not found."));

        if (user.isSuspended() || user.getRole() != UserRole.USER) {
            throw new NotFoundException("Invalid QR code. User not found.");
        }

        return user;
    }

    @Transactional
    public User topUpBalance(Long userId, BigDecimal amount, String currency) {
        return topUpBalance(userId, amount, currency, "TOP_UP");
    }

    @Transactional
    public User topUpBalance(Long userId, BigDecimal amount, String currency, String method) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Top-up amount must be greater than zero.");
        }

        String topUpCurrency = (currency == null || currency.isBlank())
                ? "USD"
                : currency.trim().toUpperCase(Locale.ROOT);

        if (!topUpCurrency.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Currency must be a 3-letter code.");
        }

        // Lock the row before the read-modify-write so concurrent top-ups and
        // transfers cannot overwrite each other's balance update.
        User user = getUserByIdForUpdate(userId);
        user.setBalance(user.getBalance().add(amount));
        User saved = userRepository.save(user);

        transactionService.recordTopUp(userId, amount, topUpCurrency, method);

        return saved;
    }

    @Transactional
    public void deleteUser(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new NotFoundException("User not found with id: " + userId);
        }
        userRepository.deleteById(userId);
    }

    private User getUserByIdForUpdate(Long id) {
        return userRepository.findByIdForUpdate(id)
                .orElseThrow(() -> new NotFoundException("User not found with id: " + id));
    }

    private String normalizeEmail(String email) {
        return email == null ? null : email.trim().toLowerCase(Locale.ROOT);
    }
}




