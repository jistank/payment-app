import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { PaymentsProvider } from '../../context/PaymentsContext'
import LogoutConfirmModal from '../profile/LogoutConfirmModal'
import SetPaymentCodeModal from '../profile/SetPaymentCodeModal'
import RealtimeBridge from './RealtimeBridge'

function SidebarItem({ to, end, label, children }) {
  return (
    <NavLink
      to={to}
      end={end}
      aria-label={label}
      className={({ isActive }) =>
        `flex items-center justify-center gap-3 rounded px-3 py-2.5 text-sm font-semibold transition md:justify-start ${
          isActive
            ? 'bg-sky-50 text-sky-700'
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
        }`
      }
    >
      {children}
      <span className="hidden md:inline">{label}</span>
    </NavLink>
  )
}

export default function AppLayout() {
  const { t } = useTranslation('app')
  const { token, user, theme, handleLogout } = useAuth()
  const navigate = useNavigate()
  const [logoutModalOpen, setLogoutModalOpen] = useState(false)

  function confirmLogout() {
    setLogoutModalOpen(false)
    handleLogout()
    navigate('/payment/auth', { replace: true })
  }

  return (
    <PaymentsProvider token={token}>
      <RealtimeBridge />

      <div
        className={`flex min-h-screen flex-col md:flex-row ${
          theme === 'dark' ? 'dark' : 'bg-slate-100'
        }`}
      >
        <aside className="sticky top-0 z-20 flex w-full shrink-0 items-center gap-2 border-b border-slate-200 bg-white px-3 py-2.5 md:h-screen md:w-60 md:flex-col md:items-stretch md:gap-0 md:border-b-0 md:border-r md:px-4 md:py-6">
          <Link
            to="/payment/user"
            className="flex items-center md:px-2"
            aria-label={t('nav.home')}
          >
            <span className="text-xl font-extrabold tracking-tight text-green-500">
              Qpay
            </span>
          </Link>

          <nav className="flex flex-1 flex-row justify-center gap-1 md:mt-8 md:flex-col md:justify-start">
            <SidebarItem to="/payment/user" end label={t('nav.home')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="m3 10 9-7 9 7v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <path d="M9 21v-6h6v6" />
              </svg>
            </SidebarItem>

            <SidebarItem to="/payment/user/contacts" label={t('nav.contacts')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </SidebarItem>

            {user?.role === 'ADMIN' && (
              <SidebarItem to="/payment/user/admin" label={t('nav.admin')}>
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
                  <path d="m9 12 2 2 4-4" />
                </svg>
              </SidebarItem>
            )}

            <SidebarItem to="/payment/user/me" label={t('nav.me')}>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </SidebarItem>
          </nav>

          <button
            type="button"
            onClick={() => setLogoutModalOpen(true)}
            aria-label={t('nav.logout')}
            className="flex items-center justify-center gap-2 rounded bg-red-500 px-3 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 md:py-3"
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <path d="m16 17 5-5-5-5M21 12H9" />
            </svg>
            <span className="hidden md:inline">{t('nav.logout')}</span>
          </button>
        </aside>

        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
            <Outlet />
          </div>
        </main>

        <SetPaymentCodeModal
          open={!user?.paymentCodeConfigured && user?.role !== 'ADMIN'}
        />

        <LogoutConfirmModal
          open={logoutModalOpen}
          onCancel={() => setLogoutModalOpen(false)}
          onConfirm={confirmLogout}
        />
      </div>
    </PaymentsProvider>
  )
}
