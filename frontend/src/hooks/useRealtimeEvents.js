import { useEffect, useRef } from 'react'

const API_URL = (import.meta.env.VITE_API_URL ?? 'http://localhost:8080').replace(/\/+$/, '')

const INITIAL_RECONNECT_DELAY_MS = 1_000
const MAX_RECONNECT_DELAY_MS = 30_000

function eventsUrl(token) {
  const params = new URLSearchParams({ token })
  return `${API_URL}/api/events?${params.toString()}`
}

/**
 * Subscribes to the server-sent events stream for the current user.
 *
 * The backend emits a `data-changed` event after every committed operation that
 * can alter balances, transactions or payment requests. The callback should
 * refetch the affected data instead of polling.
 *
 * Reconnection is managed explicitly with exponential backoff: `EventSource`
 * would otherwise retry immediately and forever, which is noisy and can hammer
 * the endpoint when the token has expired.
 */
export function useRealtimeEvents({ token, onDataChanged, enabled = true }) {
  // Keep the latest callback without re-opening the stream on every render.
  const onDataChangedRef = useRef(onDataChanged)

  useEffect(() => {
    onDataChangedRef.current = onDataChanged
  }, [onDataChanged])

  useEffect(() => {
    if (!enabled || !token) return undefined

    let source = null
    let reconnectTimer = null
    let reconnectAttempt = 0
    let stopped = false

    function clearReconnectTimer() {
      if (reconnectTimer === null) return
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    function scheduleReconnect() {
      if (stopped) return

      clearReconnectTimer()
      const delay = Math.min(
        INITIAL_RECONNECT_DELAY_MS * 2 ** reconnectAttempt,
        MAX_RECONNECT_DELAY_MS,
      )
      reconnectAttempt += 1
      reconnectTimer = setTimeout(connect, delay)
    }

    function connect() {
      if (stopped) return

      const eventSource = new EventSource(eventsUrl(token))
      source = eventSource

      eventSource.addEventListener('open', () => {
        if (stopped || source !== eventSource) return

        reconnectAttempt = 0
        // Catch up on anything that happened while the stream was down.
        onDataChangedRef.current?.('connected')
      })

      eventSource.addEventListener('data-changed', (event) => {
        if (stopped || source !== eventSource) return

        let reason = 'event'
        try {
          reason = JSON.parse(event.data)?.reason ?? reason
        } catch {
          // A malformed payload should not break the stream.
        }
        onDataChangedRef.current?.(reason)
      })

      eventSource.addEventListener('error', () => {
        if (stopped || source !== eventSource) return

        eventSource.close()
        source = null
        scheduleReconnect()
      })
    }

    function handleVisibilityChange() {
      // The browser pauses background tabs; reconnect as soon as we are active.
      if (document.visibilityState === 'visible' && !source && reconnectTimer === null) {
        connect()
      }
    }

    connect()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      stopped = true
      clearReconnectTimer()
      source?.close()
      source = null
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [token, enabled])
}
