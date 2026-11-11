import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getIncomingPaymentRequests, getTransactions } from '../api'
import i18n from '../i18n/config'
import { onDataChanged } from '../lib/sync'

const PaymentsContext = createContext(null)

export function PaymentsProvider({ token, children }) {
  const [transactions, setTransactions] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  const [transactionsError, setTransactionsError] = useState('')
  const [incomingRequests, setIncomingRequests] = useState([])
  const [requestsError, setRequestsError] = useState('')

  // Guards keep SSE-driven and manual refreshes from overlapping.
  const transactionsInFlight = useRef(false)
  const requestsInFlight = useRef(false)

  const refreshTransactions = useCallback(async () => {
    if (!token || transactionsInFlight.current) return
    transactionsInFlight.current = true

    try {
      const data = await getTransactions(token)
      setTransactions(data ?? [])
      setTransactionsError('')
    } catch (err) {
      setTransactionsError(err.message || i18n.t('app:home.errors.loadTransactions'))
    } finally {
      transactionsInFlight.current = false
    }
  }, [token])

  const refreshIncomingRequests = useCallback(async () => {
    if (!token || requestsInFlight.current) return
    requestsInFlight.current = true

    try {
      const data = await getIncomingPaymentRequests(token)
      setIncomingRequests(data ?? [])
      setRequestsError('')
    } catch (err) {
      setRequestsError(
        err.status === 404 ? '' : err.message || i18n.t('app:home.errors.loadRequests'),
      )
    } finally {
      requestsInFlight.current = false
    }
  }, [token])

  // First page load: show the loading state only once, not on every refresh.
  useEffect(() => {
    if (!token) return undefined

    let cancelled = false
    setTransactionsLoading(true)

    getTransactions(token)
      .then((data) => {
        if (!cancelled) {
          setTransactions(data ?? [])
          setTransactionsError('')
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setTransactionsError(err.message || i18n.t('app:home.errors.loadTransactions'))
        }
      })
      .finally(() => {
        if (!cancelled) setTransactionsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  // Keep data fresh without polling: the SSE channel pushes a `data-changed`
  // event when something happens, and these listeners cover reconnects and
  // tab switches by refetching as soon as the tab becomes active again.
  useEffect(() => {
    if (!token) return undefined

    function refreshAll() {
      refreshTransactions()
      refreshIncomingRequests()
    }

    function handleVisibilityChange() {
      if (document.visibilityState === 'visible') refreshAll()
    }

    refreshIncomingRequests()

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleVisibilityChange)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleVisibilityChange)
    }
  }, [token, refreshTransactions, refreshIncomingRequests])

  // A transfer completed in another tab asks this one to refresh instantly.
  useEffect(
    () =>
      onDataChanged(() => {
        refreshTransactions()
        refreshIncomingRequests()
      }),
    [refreshTransactions, refreshIncomingRequests],
  )

  const value = {
    transactions,
    transactionsLoading,
    transactionsError,
    incomingRequests,
    requestsError,
    refreshTransactions,
    refreshIncomingRequests,
  }

  return <PaymentsContext.Provider value={value}>{children}</PaymentsContext.Provider>
}

export function usePayments() {
  const context = useContext(PaymentsContext)
  if (!context) {
    throw new Error('usePayments must be used within a PaymentsProvider')
  }
  return context
}
