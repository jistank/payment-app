package com.example.payment.controller;

import com.example.payment.dto.AddContactRequest;
import com.example.payment.dto.ContactResponse;
import com.example.payment.model.User;
import com.example.payment.service.ContactService;
import com.example.payment.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/contacts")
@RequiredArgsConstructor
public class ContactController {

    private final ContactService contactService;
    private final UserService userService;

    @PostMapping
    public ResponseEntity<ContactResponse> addContact(@Valid @RequestBody AddContactRequest request,
                                                      Authentication authentication) {
        User owner = userService.getUserByEmail(authentication.getName());
        ContactResponse contact = contactService.addContact(owner.getId(), request.nickname());

        return ResponseEntity.status(HttpStatus.CREATED).body(contact);
    }

    @GetMapping
    public List<ContactResponse> getContacts(@RequestParam(required = false) String nickname,
                                             Authentication authentication) {
        User owner = userService.getUserByEmail(authentication.getName());

        return contactService.getContacts(owner.getId(), nickname);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> removeContact(@PathVariable Long id, Authentication authentication) {
        User owner = userService.getUserByEmail(authentication.getName());
        contactService.removeContact(owner.getId(), id);

        return ResponseEntity.noContent().build();
    }
}
