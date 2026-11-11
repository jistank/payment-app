package com.example.payment.controller;

import com.example.payment.dto.AdminPaymentRequestResponse;
import com.example.payment.dto.AdminStatsResponse;
import com.example.payment.dto.AdminTopUpRequest;
import com.example.payment.dto.AdminTransactionResponse;
import com.example.payment.dto.AdminUserResponse;
import com.example.payment.dto.AuditLogResponse;
import com.example.payment.service.AdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
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

/**
 * Admin-only API. SecurityConfig restricts the whole /api/admin/** tree to
 * ROLE_ADMIN before any method runs.
 */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public List<AdminUserResponse> searchUsers(
            @RequestParam(defaultValue = "") String query,
            @RequestParam(defaultValue = "ALL") String status) {
        return adminService.searchUsers(query, status);
    }

    @GetMapping("/users/{id}")
    public AdminUserResponse getUser(@PathVariable Long id) {
        return adminService.getUser(id);
    }

    @PostMapping("/users/{id}/suspend")
    public AdminUserResponse suspendUser(@PathVariable Long id, Authentication authentication) {
        return adminService.suspendUser(authentication.getName(), id);
    }

    @PostMapping("/users/{id}/reactivate")
    public AdminUserResponse reactivateUser(@PathVariable Long id, Authentication authentication) {
        return adminService.reactivateUser(authentication.getName(), id);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id, Authentication authentication) {
        adminService.deleteUser(authentication.getName(), id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/users/{id}/topup")
    public AdminUserResponse topUpUser(@PathVariable Long id,
                                       @Valid @RequestBody AdminTopUpRequest request,
                                       Authentication authentication) {
        return adminService.topUpUser(authentication.getName(), id, request);
    }

    @GetMapping("/transactions")
    public List<AdminTransactionResponse> searchTransactions(
            @RequestParam(defaultValue = "") String user,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "ALL") String type,
            @RequestParam(defaultValue = "200") int limit) {
        return adminService.searchTransactions(user, status, type, limit);
    }

    @GetMapping("/payment-requests")
    public List<AdminPaymentRequestResponse> searchPaymentRequests(
            @RequestParam(defaultValue = "") String user,
            @RequestParam(defaultValue = "ALL") String status,
            @RequestParam(defaultValue = "200") int limit) {
        return adminService.searchPaymentRequests(user, status, limit);
    }

    @GetMapping("/audit")
    public List<AuditLogResponse> getAuditLogs(
            @RequestParam(defaultValue = "") String action,
            @RequestParam(defaultValue = "100") int limit) {
        return adminService.getAuditLogs(action, limit);
    }
}
