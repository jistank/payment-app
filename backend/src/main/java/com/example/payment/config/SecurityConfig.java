package com.example.payment.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration // Tells Spring this class contains setup configurations
public class SecurityConfig {

    @Bean // This registers the PasswordEncoder in the Spring "container"
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
