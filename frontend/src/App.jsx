import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import AdminRoute from './components/AdminRoute'
import AppLayout from './components/layout/AppLayout'
import AuthLayout from './components/layout/AuthLayout'
import ScrollToTop from './components/layout/ScrollToTop'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './context/AuthContext'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ResetPasswordPage from './pages/auth/ResetPasswordPage'
import AdminPage from './pages/admin/AdminPage'
import LandingPage from './pages/landing/LandingPage'
import ContactsPage from './pages/user/ContactsPage'
import HomePage from './pages/user/HomePage'
import MePage from './pages/user/MePage'

function LegacyResetPasswordRedirect() {
  const location = useLocation()
  return <Navigate to={`/payment/auth/reset-password${location.search}`} replace />
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/payment" element={<Navigate to="/payment/auth" replace />} />

      <Route path="/payment/auth" element={<AuthLayout />}>
        <Route index element={<LoginPage />} />
        <Route path="register" element={<RegisterPage />} />
        <Route path="forgot-password" element={<ForgotPasswordPage />} />
        <Route path="reset-password" element={<ResetPasswordPage />} />
      </Route>

      {/* Backwards compatibility with links sent by the backend emails. */}
      <Route path="/reset-password" element={<LegacyResetPasswordRedirect />} />

      <Route
        path="/payment/user"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<HomePage />} />
        <Route path="contacts" element={<ContactsPage />} />
        <Route path="me" element={<MePage />} />
        <Route
          path="admin"
          element={
            <AdminRoute>
              <AdminPage />
            </AdminRoute>
          }
        />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
