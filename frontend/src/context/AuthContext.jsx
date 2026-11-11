import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { getMe } from '../api'
import { onDataChanged } from '../lib/sync'

const TOKEN_KEY = 'payment_token'
const THEME_KEY = 'payment_theme'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY))
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(Boolean(token))
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) ?? 'light')
  const skipNextUserFetch = useRef(false)

  useEffect(() => {
    // The dark theme is scoped to the authenticated app shell (see AppLayout),
    // so the document itself never gets the class. Landing and auth stay light.
    document.documentElement.classList.remove('dark')
    localStorage.setItem(THEME_KEY, theme)
  }, [theme])

  useEffect(() => {
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    if (skipNextUserFetch.current) {
      skipNextUserFetch.current = false
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)

    getMe(token)
      .then((data) => {
        if (!cancelled) setUser(data)
      })
      .catch(() => {
        if (cancelled) return
        localStorage.removeItem(TOKEN_KEY)
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token])

  function handleAuthenticated(newToken, newUser) {
    localStorage.setItem(TOKEN_KEY, newToken)
    setUser(newUser)
    setToken(newToken)
  }

  function handleTokenRefresh(newToken, newUser) {
    // The password change response contains a fresh token and the updated user.
    // Avoid an unnecessary /me round-trip that would unmount the current screen.
    skipNextUserFetch.current = true
    localStorage.setItem(TOKEN_KEY, newToken)
    setUser(newUser)
    setToken(newToken)
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
  }

  const refreshUser = useCallback(async () => {
    if (!token) return

    try {
      const data = await getMe(token)
      setUser(data)
    } catch {
      // Keep the current user data if the refresh fails.
    }
  }, [token])

  // Keep the balance fresh without polling: SSE pushes a `data-changed` event
  // after every committed transaction, while focus/visibility covers reconnects
  // and `BroadcastChannel` covers other tabs of the same browser.
  useEffect(() => {
    if (!token) return undefined

    function refreshWhenActive() {
      if (document.visibilityState === 'visible') refreshUser()
    }

    document.addEventListener('visibilitychange', refreshWhenActive)
    window.addEventListener('focus', refreshWhenActive)

    const unsubscribe = onDataChanged(refreshUser)

    return () => {
      document.removeEventListener('visibilitychange', refreshWhenActive)
      window.removeEventListener('focus', refreshWhenActive)
      unsubscribe()
    }
  }, [token, refreshUser])

  const value = {
    token,
    user,
    loading,
    theme,
    setTheme,
    isAuthenticated: Boolean(token && user),
    handleAuthenticated,
    handleTokenRefresh,
    handleLogout,
    refreshUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
