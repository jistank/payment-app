package com.example.payment.service;

import com.example.payment.model.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class PasswordResetService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration TOKEN_TTL = Duration.ofMinutes(15);
    private static final Duration REQUEST_COOLDOWN = Duration.ofMinutes(1);
    private static final String TOKEN_PREFIX = "password:reset:token:";
    private static final String CURRENT_TOKEN_PREFIX = "password:reset:current:";
    private static final String RATE_KEY_PREFIX = "password:reset:rate:";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private static final DefaultRedisScript<Long> STORE_RESET_TOKEN_SCRIPT = new DefaultRedisScript<>("""
            local previous = redis.call('GET', KEYS[1])
            if previous then
              redis.call('DEL', ARGV[1] .. previous)
            end
            redis.call('SET', KEYS[2], ARGV[2], 'PX', ARGV[3])
            redis.call('SET', KEYS[1], ARGV[4], 'PX', ARGV[3])
            return 1
            """, Long.class);

    private static final DefaultRedisScript<String> GET_AND_DELETE = new DefaultRedisScript<>("""
            local value = redis.call('GET', KEYS[1])
            if value then
              redis.call('DEL', KEYS[1])
            end
            return value
            """, String.class);

    private final StringRedisTemplate redisTemplate;
    private final UserService userService;
    private final EmailService emailService;

    @Value("${app.password-reset.secret:dev-only-password-reset-change-me}")
    private String secret;

    @Value("${app.password-reset.frontend-base-url:http://localhost:5173}")
    private String frontendBaseUrl;

    public void requestPasswordReset(String email) {
        String recipient = normalize(email);
        String rateKey = RATE_KEY_PREFIX + recipient;

        Boolean allowed = redisTemplate.opsForValue().setIfAbsent(rateKey, "1", REQUEST_COOLDOWN);
        if (Boolean.FALSE.equals(allowed)) {
            log.info("Password reset already requested recently for {}", recipient);
            return;
        }

        userService.findUserByEmail(recipient).ifPresent(user -> {
            String token = generateToken();
            String tokenHash = hash(token);
            String tokenKey = TOKEN_PREFIX + tokenHash;
            String currentTokenKey = CURRENT_TOKEN_PREFIX + user.getId();

            redisTemplate.execute(
                    STORE_RESET_TOKEN_SCRIPT,
                    List.of(currentTokenKey, tokenKey),
                    TOKEN_PREFIX,
                    String.valueOf(user.getId()),
                    String.valueOf(TOKEN_TTL.toMillis()),
                    tokenHash
            );

            emailService.sendPasswordResetEmail(
                    user.getEmail(),
                    user.getNickname(),
                    buildResetLink(token)
            );
        });
    }

    public void resetPassword(String token, String newPassword) {
        String tokenHash = hash(token.trim());
        String userIdValue = redisTemplate.execute(GET_AND_DELETE, List.of(TOKEN_PREFIX + tokenHash));

        if (userIdValue == null) {
            throw new IllegalArgumentException("Invalid or expired password reset link");
        }

        Long userId;
        try {
            userId = Long.valueOf(userIdValue);
        } catch (NumberFormatException exception) {
            throw new IllegalArgumentException("Invalid or expired password reset link");
        }

        User user = userService.resetPassword(userId, newPassword);
        redisTemplate.delete(CURRENT_TOKEN_PREFIX + userId);
        emailService.sendPasswordChangedEmail(user.getEmail());
    }

    private String buildResetLink(String token) {
        String baseUrl = frontendBaseUrl.endsWith("/")
                ? frontendBaseUrl.substring(0, frontendBaseUrl.length() - 1)
                : frontendBaseUrl;

        return baseUrl + "/reset-password?token=" + URLEncoder.encode(token, StandardCharsets.UTF_8);
    }

    private String generateToken() {
        byte[] bytes = new byte[32];
        RANDOM.nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }

    private String hash(String token) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            return HexFormat.of().formatHex(mac.doFinal(token.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to hash password reset token", exception);
        }
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
