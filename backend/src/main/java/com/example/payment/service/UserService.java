package com.example.payment.service;

import com.example.payment.config.PasswordEncoderConfig;
import com.example.payment.config.PasswordEncoderConfig;
import com.example.payment.model.User;
import com.example.payment.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service       // (Spring): Tells Spring that this class is a service, it will be automatically detected and registered as a bean in the application context
@RequiredArgsConstructor // (Lombok): Generates a constructor with required arguments (final fields) for dependency injection
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoderConfig passwordEncoder;


    public List<User> getAllUsers() {
        return userRepository.findAll();
    }


    // Check if the email is already taken
    public User registerUser(User newUser) {
        if (userRepository.existsByEmail(newUser.getEmail()))
            throw new RuntimeException("Email is already registered!");

        newUser.setPassword(passwordEncoder.passwordEncoder().encode(newUser.getPassword()));   // SECURITY: Hash the password before saving it to the database

        // Generate unique QR payloads
        String uniqueReceiveId = UUID.randomUUID().toString();                // We use UUIDs guarantees they are unique across the database
        String uniquePayId = UUID.randomUUID().toString();

        newUser.setQrReceive("app://receive/" + uniqueReceiveId);             // Set the QR payloads for the user
        newUser.setQrPay("app://pay/" + uniquePayId);

        return userRepository.save(newUser);                                  // Save to the database and return the saved user (with the generated ID)
    }

    // Finds a user by their ID. Used when processing transactions.
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found with id: " + id));
    }

    // Finds a user by their email. Used for logging in.
    public User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new RuntimeException("User not found with email: " + email));
    }

    /**
     * Finds a user by their Receive QR payload.
     * When User A scans User B's QR code,
     * the app reads the string, calls this method, and finds User B.
     */
    public User getUserByQrReceive(String qrReceivePayload) {
        return userRepository.findByQrReceive(qrReceivePayload)
                .orElseThrow(() -> new RuntimeException("Invalid QR code. User not found."));
    }
}




