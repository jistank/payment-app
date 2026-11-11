import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import LoadingScreen from './ui/LoadingScreen'

export default function ProtectedRoute({ children }) {
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

  return children
}
