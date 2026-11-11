import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { login } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { ErrorMessage, NoticeMessage } from '../../components/ui/Messages'
import { inputClass, linkButtonClass, primaryButtonClass } from './authStyles'

export default function LoginPage() {
  const { t } = useTranslation('auth')
  const { handleAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [email, setEmail] = useState(location.state?.email ?? '')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const notice = location.state?.noticeKey
    ? t(location.state.noticeKey)
    : location.state?.notice

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const auth = await login(email, password)
      handleAuthenticated(auth.token, auth.user)
      navigate(location.state?.from ?? '/payment/user', { replace: true })
    } catch (err) {
      const fieldErrors = err.data?.errors
        ? Object.values(err.data.errors).join(' · ')
        : ''
      setError(fieldErrors || err.message || t('errors.generic'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>{t('login.email')}</span>
          <input
            className={inputClass}
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder={t('login.emailPlaceholder')}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <div className="flex items-center justify-between">
            <span>{t('login.password')}</span>
            <Link className={`${linkButtonClass} text-sm`} to="/payment/auth/forgot-password">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <input
            className={inputClass}
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
            maxLength={20}
            required
          />

          <p className="m-0 rounded border border-gray-200 bg-gray-100 px-3 py-2 text-xs leading-relaxed text-gray-500">
            {t('login.warning')}
          </p>
        </label>

        <NoticeMessage>{notice}</NoticeMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <button className={primaryButtonClass} type="submit" disabled={submitting}>
          {submitting ? t('ui.pleaseWait') : t('login.submit')}
        </button>
      </form>

      <p className="m-0 text-center text-sm text-gray-500">
        <Link className={linkButtonClass} to="/payment/auth/register">
          {t('login.signUp')}
        </Link>
      </p>
    </>
  )
}
