package com.example.payment.realtime;

/**
 * Minimal payload sent over SSE. Clients only need the event name to know that
 * their cached data is stale, but the reason helps debugging and future clients.
 */
public record RealtimeEvent(String type, String reason, long timestamp) {

    public static RealtimeEvent dataChanged(String reason) {
        return new RealtimeEvent("data-changed", reason, System.currentTimeMillis());
    }
}
