import { useCallback } from 'react'
import { useAuth } from '../../context/AuthContext'
import { usePayments } from '../../context/PaymentsContext'
import { useRealtimeEvents } from '../../hooks/useRealtimeEvents'

/**
 * Connects the SSE stream to the data contexts. Rendered inside both
 * `AuthProvider` and `PaymentsProvider`, it owns no UI of its own.
 */
export default function RealtimeBridge() {
  const { token, refreshUser } = useAuth()
  const { refreshTransactions, refreshIncomingRequests } = usePayments()

  const handleDataChanged = useCallback(() => {
    refreshUser()
    refreshTransactions()
    refreshIncomingRequests()
  }, [refreshUser, refreshTransactions, refreshIncomingRequests])

  useRealtimeEvents({ token, onDataChanged: handleDataChanged })

  return null
}
