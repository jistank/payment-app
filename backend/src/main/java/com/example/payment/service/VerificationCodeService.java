package com.example.payment.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.stereotype.Service;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j
public class VerificationCodeService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final Duration CODE_TTL = Duration.ofMinutes(5);
    private static final Duration SEND_COOLDOWN = Duration.ofMinutes(1);
    private static final int MAX_ATTEMPTS = 5;
    private static final String KEY_PREFIX = "verification:register:";
    private static final String RATE_KEY_PREFIX = "verification:register:rate:";
    private static final String PAYMENT_CODE_KEY_PREFIX = "verification:payment-code-reset:";
    private static final String PAYMENT_CODE_RATE_KEY_PREFIX = "verification:payment-code-reset:rate:";
    private static final String HMAC_ALGORITHM = "HmacSHA256";

    private static final DefaultRedisScript<Long> STORE_CODE_SCRIPT = new DefaultRedisScript<>("""
            redis.call('DEL', KEYS[1])
            redis.call('HSET', KEYS[1], 'codeHash', ARGV[1], 'attempts', '0')
            redis.call('PEXPIRE', KEYS[1], ARGV[2])
            return 1
            """, Long.class);

    private static final DefaultRedisScript<Long> VERIFY_SCRIPT = new DefaultRedisScript<>("""
            local stored = redis.call('HMGET', KEYS[1], 'codeHash', 'attempts')
            if not stored[1] then
              return -1
            end
            if stored[1] == ARGV[1] then
              redis.call('DEL', KEYS[1])
              return 1
            end
            local attempts = tonumber(stored[2] or '0') + 1
            if attempts >= tonumber(ARGV[2]) then
              redis.call('DEL', KEYS[1])
              return -2
            end
            redis.call('HSET', KEYS[1], 'attempts', attempts)
            return 0
            """, Long.class);

    private final EmailService emailService;
    private final StringRedisTemplate redisTemplate;

    @Value("${app.verification.secret:dev-only-change-me}")
    private String secret;

    public void sendRegistrationCode(String email) {
        sendCode(email, KEY_PREFIX, RATE_KEY_PREFIX);
    }

    public void verifyRegistrationCode(String email, String code) {
        verifyCode(email, code, KEY_PREFIX);
    }

    public void sendPaymentCodeResetCode(String email) {
        sendCode(email, PAYMENT_CODE_KEY_PREFIX, PAYMENT_CODE_RATE_KEY_PREFIX);
    }

    public void verifyPaymentCodeResetCode(String email, String code) {
        verifyCode(email, code, PAYMENT_CODE_KEY_PREFIX);
    }

    private void sendCode(String email, String keyPrefix, String rateKeyPrefix) {
        String recipient = normalize(email);
        String rateKey = rateKeyPrefix + recipient;

        Boolean allowed = redisTemplate.opsForValue().setIfAbsent(rateKey, "1", SEND_COOLDOWN);
        if (Boolean.FALSE.equals(allowed)) {
            log.info("Verification code already requested recently for {}", recipient);
            return;
        }

        String code = String.format("%06d", RANDOM.nextInt(1_000_000));
        String key = keyPrefix + recipient;

        redisTemplate.execute(
                STORE_CODE_SCRIPT,
                List.of(key),
                hash(recipient, code),
                String.valueOf(CODE_TTL.toMillis())
        );

        emailService.sendVerificationCode(recipient, code);
    }

    private void verifyCode(String email, String code, String keyPrefix) {
        String recipient = normalize(email);

        Long result = redisTemplate.execute(
                VERIFY_SCRIPT,
                List.of(keyPrefix + recipient),
                hash(recipient, code == null ? "" : code.trim()),
                String.valueOf(MAX_ATTEMPTS)
        );

        if (result == null) {
            throw new IllegalArgumentException("Unable to verify the code, please try again");
        }

        switch (result.intValue()) {
            case 1 -> {
                // Correct code: it has already been deleted from Redis (single use).
            }
            case 0 -> throw new IllegalArgumentException("Invalid verification code");
            case -1 -> throw new IllegalArgumentException("Verification code not requested or expired");
            case -2 -> throw new IllegalArgumentException("Too many invalid attempts. Request a new code");
            default -> throw new IllegalArgumentException("Unable to verify the code, please try again");
        }
    }

    public void clearRegistrationCode(String email) {
        redisTemplate.delete(KEY_PREFIX + normalize(email));
    }

    private String hash(String email, String code) {
        try {
            Mac mac = Mac.getInstance(HMAC_ALGORITHM);
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), HMAC_ALGORITHM));
            byte[] digest = mac.doFinal((email + ":" + code).getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (GeneralSecurityException exception) {
            throw new IllegalStateException("Unable to hash verification code", exception);
        }
    }

    private String normalize(String email) {
        return email.trim().toLowerCase(Locale.ROOT);
    }
}
