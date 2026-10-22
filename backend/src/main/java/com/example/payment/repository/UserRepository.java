package com.example.payment.repository;

import com.example.payment.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository // (Spring): Tells Spring that this class is a repository, it will be automatically detected and registered as a bean in the application context
public interface UserRepository extends JpaRepository<User, Long> {

    /*
     * This is a method in a Spring Data JPA repository. We only write the method name.
     * Spring reads the name and builds the database query for us.
     * It returns a List<User>
     */
    List<User> findById(String id);   // (Spring Data JPA): Finds users by ID

    List<User> findByNicknameContainingIgnoreCase(String nickname);   // (Spring Data JPA): Finds users by nickname containing the given string, ignoring case

    boolean existsByNickname(String nickname);                        // (Spring Data JPA): Checks if a user exists by nickname

    Optional<User> findByEmail(String email);                         // (Spring Data JPA): Finds a user by email, returns an Optional<User> to handle the case where the user may not exist

    boolean existsByEmail(String email);                              // (Spring Data JPA): Checks if a user exists by email

    Optional<User> findByQrReceive(String qrReceive);                 // (Spring Data JPA): Finds a user by their Receive QR payload, returns an Optional<User> to handle the case where the user may not exist

}
