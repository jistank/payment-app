import { useTranslation } from 'react-i18next'
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import LanguageSelector from '../ui/LanguageSelector'
import LoadingScreen from '../ui/LoadingScreen'

export default function AuthLayout() {
  const { t } = useTranslation('auth')
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <LoadingScreen />
  if (isAuthenticated) return <Navigate to="/payment/user" replace />

  return (
    <div className="flex min-h-screen flex-col bg-[#e9ecf5]">
      <div className="fixed right-4 top-4 z-50">
        <LanguageSelector variant="auth" />
      </div>

      <div className="flex flex-1 items-center justify-center pt-16 md:p-7">
        <div className="flex w-full max-w-[400px] flex-col bg-[#f7f8fc] md:overflow-hidden md:rounded md:shadow-[0_24px_60px_rgba(15,23,42,0.14)]">
          <div className="flex flex-1 flex-col justify-center gap-5 px-5 py-8 sm:px-8 sm:py-10">
            <Outlet />
          </div>
        </div>
      </div>

      <footer className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 px-5 py-4 text-xs text-gray-500">
        <span>© 2027</span>
        <span>{t('footer.documentation')}</span>
        <span>{t('footer.cookiePolicy')}</span>
        <span>{t('footer.contactUs')}</span>
      </footer>
    </div>
  )
}
