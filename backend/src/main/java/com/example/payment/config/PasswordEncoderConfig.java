package com.example.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

@Configuration
public class PasswordEncoderConfig {

    private static final String ENCODING_ID = "argon2";

    @Bean
    public PasswordEncoder passwordEncoder() {
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put(ENCODING_ID, Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8());

        DelegatingPasswordEncoder encoder = new DelegatingPasswordEncoder(ENCODING_ID, encoders);
        // Existing accounts were created with a plain BCrypt hash (without the
        // {id} prefix). Keep them able to log in while new passwords use Argon2.
        encoder.setDefaultPasswordEncoderForMatches(new BCryptPasswordEncoder());
        return encoder;
    }
}