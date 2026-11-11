/**
 * Best-effort cross-tab synchronisation.
 *
 * Tabs opened on the same origin share no React state, so after a transfer in
 * one tab the others would otherwise keep showing stale balances/transactions.
 * `BroadcastChannel` lets the tab that performed the action ask the others to
 * refresh immediately. The SSE stream (`/api/events`) covers other devices,
 * while this channel gives same-browser tabs an instant local signal.
 */
const CHANNEL_NAME = 'qpay:data-changed'

const channel = typeof BroadcastChannel === 'undefined' ? null : new BroadcastChannel(CHANNEL_NAME)

/** Ask every other open tab to refetch its data. */
export function notifyDataChanged() {
  channel?.postMessage({ type: 'data-changed' })
}

/**
 * Subscribe to refresh requests coming from other tabs.
 * Returns an unsubscribe function.
 */
export function onDataChanged(callback) {
  if (!channel) return () => {}

  function handleMessage(event) {
    if (event.data?.type === 'data-changed') callback()
  }

  channel.addEventListener('message', handleMessage)
  return () => channel.removeEventListener('message', handleMessage)
}
