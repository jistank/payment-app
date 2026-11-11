package com.example.payment.service;

import com.example.payment.dto.ContactResponse;
import com.example.payment.exception.ConflictException;
import com.example.payment.exception.NotFoundException;
import com.example.payment.model.Contact;
import com.example.payment.model.User;
import com.example.payment.repository.ContactRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
public class ContactService {

    private final ContactRepository contactRepository;
    private final UserService userService;

    @Transactional
    public ContactResponse addContact(Long ownerId, String nickname) {
        User contactUser = userService.getUserByNickname(nickname);

        if (ownerId.equals(contactUser.getId())) {
            throw new IllegalArgumentException("Cannot add yourself to your contacts.");
        }

        if (contactRepository.existsByOwnerIdAndContactId(ownerId, contactUser.getId())) {
            throw new ConflictException("User is already in your contacts.");
        }

        Contact contact = new Contact();
        contact.setOwnerId(ownerId);
        contact.setContactId(contactUser.getId());

        try {
            // saveAndFlush makes the unique-constraint violation happen here,
            // where it can be translated into a proper 409 response.
            return ContactResponse.from(contactRepository.saveAndFlush(contact), contactUser);
        } catch (DataIntegrityViolationException exception) {
            throw new ConflictException("User is already in your contacts.");
        }
    }

    @Transactional(readOnly = true)
    public List<ContactResponse> getContacts(Long ownerId, String nickname) {
        String query = nickname == null ? "" : nickname.trim().toLowerCase(Locale.ROOT);
        String pattern = "%" + query + "%";

        return contactRepository.findContactResponses(ownerId, pattern);
    }

    @Transactional
    public void removeContact(Long ownerId, Long contactId) {
        Contact contact = contactRepository.findByIdAndOwnerId(contactId, ownerId)
                .orElseThrow(() -> new NotFoundException("Contact not found with id: " + contactId));

        contactRepository.delete(contact);
    }
}
