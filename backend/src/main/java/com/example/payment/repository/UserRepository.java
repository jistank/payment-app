package com.example.payment.repository;

import com.example.payment.model.User;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
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
    List<User> findByNicknameContainingIgnoreCase(String nickname);   // (Spring Data JPA): Finds users by nickname containing the given string, ignoring case

    Optional<User> findByNickname(String nickname);                   // (Spring Data JPA): Finds a user by their exact nickname

    boolean existsByNickname(String nickname);                        // (Spring Data JPA): Checks if a user exists by nickname

    Optional<User> findByEmail(String email);                         // (Spring Data JPA): Finds a user by email, returns an Optional<User> to handle the case where the user may not exist

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmail(String email);                              // (Spring Data JPA): Checks if a user exists by email

    Optional<User> findByQrReceive(String qrReceive);                 // (Spring Data JPA): Finds a user by their Receive QR payload, returns an Optional<User> to handle the case where the user may not exist

    boolean existsByEmailIgnoreCase(String email);

    /**
     * Admin-side search across nickname and email. `query` is never null (the
     * service normalizes it to "") and `suspended` is null when no status
     * filter is active.
     */
    @Query("""
            select u from User u
            where (:query = ''
                   or lower(u.nickname) like lower(concat('%', :query, '%'))
                   or lower(u.email) like lower(concat('%', :query, '%')))
              and (:suspended is null or u.suspended = :suspended)
            order by u.createdAt desc
            """)
    List<User> searchForAdmin(@Param("query") String query,
                              @Param("suspended") Boolean suspended);

    long countBySuspended(boolean suspended);

    /**
     * Locks the user row until the surrounding transaction commits. Used by all
     * balance-changing operations so concurrent requests cannot lose updates or
     * spend the same balance twice.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from User u where u.id = :id")
    Optional<User> findByIdForUpdate(@Param("id") Long id);

}
