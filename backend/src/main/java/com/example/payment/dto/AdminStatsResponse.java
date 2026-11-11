package com.example.payment.dto;

import java.math.BigDecimal;

/**
 * Aggregated counters for the admin dashboard. Volume fields exclude TOP_UP so
 * the two values can be compared without double counting.
 */
public record AdminStatsResponse(
        long totalUsers,
        long activeUsers,
        long suspendedUsers,
        long totalTransactions,
        BigDecimal transactionVolume,
        BigDecimal topUpVolume,
        long pendingRequests,
        long totalAuditEvents
) {
}
