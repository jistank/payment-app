import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './ui/LoadingScreen'

/**
 * Guards the admin area. Authentication itself is handled by ProtectedRoute,
 * but the role check lives here so it also protects future standalone routes.
 */
export default function AdminRoute({ children }) {
  const { token, user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingScreen />
  if (!token || !user) {
    return (
      <Navigate
        to="/payment/auth"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    )
  }
  if (user.role !== 'ADMIN') {
    return <Navigate to="/payment/user" replace />
  }

  return children
}
