package com.example.payment.realtime;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.servlet.mvc.method.annotation.SseEmitter;

import java.io.IOException;
import java.util.Collection;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ConcurrentMap;

/**
 * Registry of open SSE streams, grouped by user so every tab/device receives
 * the same notifications independently.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RealtimeService {

    private static final long EMITTER_TIMEOUT_MS = 30 * 60 * 1000L;
    private static final long HEARTBEAT_INTERVAL_MS = 20_000L;

    private final ConcurrentMap<Long, Set<SseEmitter>> emitters = new ConcurrentHashMap<>();

    public SseEmitter subscribe(Long userId) {
        SseEmitter emitter = new SseEmitter(EMITTER_TIMEOUT_MS);
        emitters.computeIfAbsent(userId, id -> ConcurrentHashMap.newKeySet()).add(emitter);

        emitter.onCompletion(() -> remove(userId, emitter));
        emitter.onTimeout(() -> {
            emitter.complete();
            remove(userId, emitter);
        });
        emitter.onError(error -> remove(userId, emitter));

        try {
            // Flush the response immediately so the browser fires `onopen`.
            emitter.send(SseEmitter.event().comment("connected").reconnectTime(3000L));
        } catch (IOException | IllegalStateException exception) {
            remove(userId, emitter);
            emitter.completeWithError(exception);
        }

        return emitter;
    }

    /**
     * Publishes after the surrounding transaction commits, so clients never
     * refetch data that is not visible yet or that was rolled back.
     */
    public void publishAfterCommit(Collection<Long> userIds, String reason) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        Set<Long> recipients = Set.copyOf(userIds);

        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    publish(recipients, reason);
                }
            });
        } else {
            publish(recipients, reason);
        }
    }

    public void publish(Collection<Long> userIds, String reason) {
        if (userIds == null || userIds.isEmpty()) {
            return;
        }

        RealtimeEvent event = RealtimeEvent.dataChanged(reason);

        for (Long userId : userIds) {
            Set<SseEmitter> userEmitters = emitters.get(userId);
            if (userEmitters == null) {
                continue;
            }
            userEmitters.forEach(emitter -> send(userId, emitter, event));
        }
    }

    /** Keeps proxies from closing idle streams and drops dead connections. */
    @Scheduled(fixedRate = HEARTBEAT_INTERVAL_MS)
    public void sendHeartbeat() {
        emitters.forEach((userId, userEmitters) ->
                userEmitters.forEach(emitter -> sendComment(userId, emitter)));
    }

    private void send(Long userId, SseEmitter emitter, RealtimeEvent event) {
        try {
            emitter.send(SseEmitter.event()
                    .name(event.type())
                    .data(event, MediaType.APPLICATION_JSON));
        } catch (IOException | IllegalStateException exception) {
            log.debug("Dropping closed SSE stream for user {}", userId);
            remove(userId, emitter);
            emitter.complete();
        }
    }

    private void sendComment(Long userId, SseEmitter emitter) {
        try {
            emitter.send(SseEmitter.event().comment("keep-alive"));
        } catch (IOException | IllegalStateException exception) {
            remove(userId, emitter);
            emitter.complete();
        }
    }

    private void remove(Long userId, SseEmitter emitter) {
        emitters.computeIfPresent(userId, (id, userEmitters) -> {
            userEmitters.remove(emitter);
            return userEmitters.isEmpty() ? null : userEmitters;
        });
    }
}
