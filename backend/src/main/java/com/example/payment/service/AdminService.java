package com.example.payment.service;

import com.example.payment.dto.AdminPaymentRequestResponse;
import com.example.payment.dto.AdminStatsResponse;
import com.example.payment.dto.AdminTopUpRequest;
import com.example.payment.dto.AdminTransactionResponse;
import com.example.payment.dto.AdminUserResponse;
import com.example.payment.dto.AuditLogResponse;
import com.example.payment.model.AuditLog;
import com.example.payment.model.PaymentRequest;
import com.example.payment.model.PaymentRequestStatus;
import com.example.payment.model.Transaction;
import com.example.payment.model.TransactionStatus;
import com.example.payment.model.TransactionType;
import com.example.payment.model.User;
import com.example.payment.model.UserRole;
import com.example.payment.repository.AuditLogRepository;
import com.example.payment.repository.PaymentRequestRepository;
import com.example.payment.repository.TransactionRepository;
import com.example.payment.repository.UserRepository;
import jakarta.persistence.criteria.Predicate;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

/**
 * Administrative operations. Every mutating method writes an append-only
 * AuditLog row; admins can never suspend, delete or impersonate another
 * administrator, and they cannot access payment codes.
 */
@Service
@RequiredArgsConstructor
public class AdminService {

    public static final String ACTION_USER_SUSPENDED = "USER_SUSPENDED";
    public static final String ACTION_USER_REACTIVATED = "USER_REACTIVATED";
    public static final String ACTION_USER_DELETED = "USER_DELETED";
    public static final String ACTION_MANUAL_TOP_UP = "MANUAL_TOP_UP";

    private static final int MAX_LIMIT = 500;

    private final UserRepository userRepository;
    private final TransactionRepository transactionRepository;
    private final PaymentRequestRepository paymentRequestRepository;
    private final AuditLogRepository auditLogRepository;
    private final UserService userService;

    @Transactional(readOnly = true)
    public AdminStatsResponse getStats() {
        long totalUsers = userRepository.count();
        long suspendedUsers = userRepository.countBySuspended(true);

        BigDecimal transactionVolume = nullToZero(
                transactionRepository.sumAmountExcludingType(TransactionType.TOP_UP));
        BigDecimal topUpVolume = nullToZero(
                transactionRepository.sumAmountByType(TransactionType.TOP_UP));

        return new AdminStatsResponse(
                totalUsers,
                totalUsers - suspendedUsers,
                suspendedUsers,
                transactionRepository.count(),
                transactionVolume,
                topUpVolume,
                paymentRequestRepository.countByStatus(PaymentRequestStatus.PENDING),
                auditLogRepository.count()
        );
    }

    @Transactional(readOnly = true)
    public List<AdminUserResponse> searchUsers(String query, String status) {
        Boolean suspended = parseSuspended(status);
        String normalizedQuery = query == null ? "" : query.trim();

        return userRepository.searchForAdmin(normalizedQuery, suspended).stream()
                .limit(MAX_LIMIT)
                .map(AdminUserResponse::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public AdminUserResponse getUser(Long userId) {
        return AdminUserResponse.from(userService.getUserById(userId));
    }

    @Transactional
    public AdminUserResponse suspendUser(String actorEmail, Long targetId) {
        User actor = currentActor(actorEmail);
        User target = userService.getUserById(targetId);
        ensureManageable(actor, target);

        target.setSuspended(true);
        // Invalidate tokens issued before the suspension. The JWT filter also
        // checks suspended on every request, so this is defense in depth.
        target.setTokenVersion(target.getTokenVersion() + 1);
        userRepository.save(target);

        recordAudit(actor, ACTION_USER_SUSPENDED, target, target.getNickname());
        return AdminUserResponse.from(target);
    }

    @Transactional
    public AdminUserResponse reactivateUser(String actorEmail, Long targetId) {
        User actor = currentActor(actorEmail);
        User target = userService.getUserById(targetId);
        ensureManageable(actor, target);

        target.setSuspended(false);
        target.setTokenVersion(target.getTokenVersion() + 1);
        userRepository.save(target);

        recordAudit(actor, ACTION_USER_REACTIVATED, target, target.getNickname());
        return AdminUserResponse.from(target);
    }

    @Transactional
    public void deleteUser(String actorEmail, Long targetId) {
        User actor = currentActor(actorEmail);
        User target = userService.getUserById(targetId);
        ensureManageable(actor, target);

        String nickname = target.getNickname();
        // Reuse the account-deletion cleanup (contacts, pending requests, row
        // lock) so an admin delete cannot leave dangling references.
        userService.deleteUserAccount(targetId, nickname);
        recordAudit(actor, ACTION_USER_DELETED, target, nickname);
    }

    @Transactional
    public AdminUserResponse topUpUser(String actorEmail, Long targetId, AdminTopUpRequest request) {
        User actor = currentActor(actorEmail);
        User target = userService.getUserById(targetId);

        BigDecimal amount = request.amount();
        String currency = normalizeCurrency(request.currency());
        userService.topUpBalance(targetId, amount, currency, "ADMIN_TOP_UP");

        String details = amount.toPlainString() + " " + currency;
        if (request.note() != null && !request.note().isBlank()) {
            details += " — " + request.note().trim();
        }
        recordAudit(actor, ACTION_MANUAL_TOP_UP, target, details);

        return AdminUserResponse.from(userService.getUserById(targetId));
    }

    @Transactional(readOnly = true)
    public List<AdminTransactionResponse> searchTransactions(String userQuery,
                                                             String status,
                                                             String type,
                                                             int limit) {
        TransactionStatus statusFilter = parseEnum(TransactionStatus.class, status);
        TransactionType typeFilter = parseEnum(TransactionType.class, type);
        String normalizedQuery = userQuery == null ? "" : userQuery.trim();
        Set<Long> userIds = resolveUserIds(normalizedQuery);

        Specification<Transaction> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (!normalizedQuery.isEmpty()) {
                if (userIds.isEmpty()) {
                    predicates.add(builder.disjunction());
                } else {
                    predicates.add(builder.or(
                            root.get("senderId").in(userIds),
                            root.get("receiverId").in(userIds)
                    ));
                }
            }
            if (statusFilter != null) {
                predicates.add(builder.equal(root.get("transactionStatus"), statusFilter));
            }
            if (typeFilter != null) {
                predicates.add(builder.equal(root.get("transactionType"), typeFilter));
            }

            return predicates.isEmpty()
                    ? builder.conjunction()
                    : builder.and(predicates.toArray(Predicate[]::new));
        };

        Pageable pageable = PageRequest.of(
                0,
                normalizeLimit(limit, 200),
                Sort.by(Sort.Direction.DESC, "transactionTime")
        );

        List<Transaction> rows = transactionRepository.findAll(specification, pageable).getContent();
        Map<Long, User> users = loadUsers(rows.stream()
                .flatMap(row -> java.util.stream.Stream.of(row.getSenderId(), row.getReceiverId()))
                .collect(Collectors.toSet()));

        return rows.stream()
                .map(row -> AdminTransactionResponse.from(
                        row,
                        nicknameOf(users, row.getSenderId()),
                        nicknameOf(users, row.getReceiverId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AdminPaymentRequestResponse> searchPaymentRequests(String userQuery,
                                                                   String status,
                                                                   int limit) {
        PaymentRequestStatus statusFilter = parseEnum(PaymentRequestStatus.class, status);
        String normalizedQuery = userQuery == null ? "" : userQuery.trim();
        Set<Long> userIds = resolveUserIds(normalizedQuery);

        Specification<PaymentRequest> specification = (root, query, builder) -> {
            List<Predicate> predicates = new ArrayList<>();

            if (!normalizedQuery.isEmpty()) {
                if (userIds.isEmpty()) {
                    predicates.add(builder.disjunction());
                } else {
                    predicates.add(builder.or(
                            root.get("requesterId").in(userIds),
                            root.get("payerId").in(userIds)
                    ));
                }
            }
            if (statusFilter != null) {
                predicates.add(builder.equal(root.get("status"), statusFilter));
            }

            return predicates.isEmpty()
                    ? builder.conjunction()
                    : builder.and(predicates.toArray(Predicate[]::new));
        };

        Pageable pageable = PageRequest.of(
                0,
                normalizeLimit(limit, 200),
                Sort.by(Sort.Direction.DESC, "createdAt")
        );

        List<PaymentRequest> rows =
                paymentRequestRepository.findAll(specification, pageable).getContent();
        Map<Long, User> users = loadUsers(rows.stream()
                .flatMap(row -> java.util.stream.Stream.of(row.getRequesterId(), row.getPayerId()))
                .collect(Collectors.toSet()));

        return rows.stream()
                .map(row -> AdminPaymentRequestResponse.from(
                        row,
                        nicknameOf(users, row.getRequesterId()),
                        nicknameOf(users, row.getPayerId())
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<AuditLogResponse> getAuditLogs(String action, int limit) {
        Pageable pageable = PageRequest.of(0, normalizeLimit(limit, 100));
        String normalizedAction = action == null ? "" : action.trim();

        List<AuditLog> logs = normalizedAction.isEmpty()
                || "ALL".equalsIgnoreCase(normalizedAction)
                ? auditLogRepository.findAllByOrderByCreatedAtDesc(pageable)
                : auditLogRepository.findByActionOrderByCreatedAtDesc(
                        normalizedAction.toUpperCase(Locale.ROOT), pageable);

        return logs.stream().map(AuditLogResponse::from).toList();
    }

    private User currentActor(String email) {
        return userService.getUserByEmail(email);
    }

    private void ensureManageable(User actor, User target) {
        if (Objects.equals(actor.getId(), target.getId())) {
            throw new IllegalArgumentException("You cannot manage your own admin account.");
        }
        if (target.getRole() == UserRole.ADMIN) {
            throw new IllegalArgumentException("Admin accounts cannot be suspended or deleted.");
        }
    }

    private void recordAudit(User actor, String action, User target, String details) {
        AuditLog log = new AuditLog();
        log.setActorId(actor.getId());
        log.setActorNickname(actor.getNickname());
        log.setAction(action);
        log.setTargetType("USER");
        log.setTargetId(target.getId());
        log.setDetails(details == null ? null : details.substring(0, Math.min(details.length(), 1000)));
        auditLogRepository.save(log);
    }

    private Boolean parseSuspended(String status) {
        if (status == null || status.isBlank() || "ALL".equalsIgnoreCase(status)) {
            return null;
        }
        if ("ACTIVE".equalsIgnoreCase(status)) {
            return false;
        }
        if ("SUSPENDED".equalsIgnoreCase(status)) {
            return true;
        }
        throw new IllegalArgumentException("Unknown user status: " + status);
    }

    private <E extends Enum<E>> E parseEnum(Class<E> type, String value) {
        if (value == null || value.isBlank() || "ALL".equalsIgnoreCase(value)) {
            return null;
        }
        try {
            return Enum.valueOf(type, value.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unknown " + type.getSimpleName() + ": " + value);
        }
    }

    private Set<Long> resolveUserIds(String query) {
        if (query == null || query.isBlank()) {
            return Set.of();
        }
        return userRepository.searchForAdmin(query.trim(), null).stream()
                .map(User::getId)
                .collect(Collectors.toSet());
    }

    private Map<Long, User> loadUsers(Set<Long> ids) {
        if (ids.isEmpty()) {
            return Map.of();
        }
        return userRepository.findAllById(ids).stream()
                .collect(Collectors.toMap(User::getId, Function.identity()));
    }

    private String nicknameOf(Map<Long, User> users, Long id) {
        User user = users.get(id);
        return user == null ? null : user.getNickname();
    }

    private String normalizeCurrency(String currency) {
        String value = (currency == null || currency.isBlank())
                ? "USD"
                : currency.trim().toUpperCase(Locale.ROOT);
        if (!value.matches("[A-Z]{3}")) {
            throw new IllegalArgumentException("Currency must be a 3-letter code.");
        }
        return value;
    }

    private int normalizeLimit(int requested, int fallback) {
        if (requested <= 0) {
            return fallback;
        }
        return Math.min(requested, MAX_LIMIT);
    }

    private BigDecimal nullToZero(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
