package com.example.payment.repository;

import com.example.payment.dto.ContactResponse;
import com.example.payment.model.Contact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ContactRepository extends JpaRepository<Contact, Long> {

    List<Contact> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

    /**
     * Fetches the owner's contacts and their user data in a single query,
     * applying the nickname filter in the database. This avoids the previous
     * N+1 pattern (one user lookup per contact) and in-memory filtering.
     *
     * `pattern` is already lower-cased and wrapped in % wildcards by the service.
     */
    @Query("""
            select new com.example.payment.dto.ContactResponse(
                c.id, u.id, u.nickname, u.email, u.business, c.createdAt
            )
            from Contact c, User u
            where c.contactId = u.id
              and c.ownerId = :ownerId
              and lower(u.nickname) like :pattern
            order by c.createdAt desc
            """)
    List<ContactResponse> findContactResponses(@Param("ownerId") Long ownerId,
                                               @Param("pattern") String pattern);

    Optional<Contact> findByIdAndOwnerId(Long id, Long ownerId);

    boolean existsByOwnerIdAndContactId(Long ownerId, Long contactId);

    @Modifying
    @Query("delete from Contact c where c.ownerId = :userId or c.contactId = :userId")
    int deleteByUserId(@Param("userId") Long userId);
}
