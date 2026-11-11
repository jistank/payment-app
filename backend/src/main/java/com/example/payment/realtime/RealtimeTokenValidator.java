package com.example.payment.realtime;

import com.example.payment.model.User;
import com.example.payment.repository.UserRepository;
import com.example.payment.security.JwtService;
import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

/**
 * Authenticates the SSE handshake. `EventSource` cannot send an Authorization
 * header, so the access token is passed as a query parameter and validated
 * here before a stream is opened.
 */
@Component
@RequiredArgsConstructor
public class RealtimeTokenValidator {

    private final JwtService jwtService;
    private final UserRepository userRepository;

    public Long requireUserId(String token) {
        if (token == null || token.isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Missing access token");
        }

        try {
            String email = jwtService.extractUsername(token);
            User user = userRepository.findByEmailIgnoreCase(email)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Unknown user"));

            if (user.getTokenVersion() != jwtService.extractTokenVersion(token)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Stale access token");
            }

            return user.getId();
        } catch (JwtException | IllegalArgumentException exception) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Invalid access token");
        }
    }
}
