import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../../api'
import { ErrorMessage } from '../../components/ui/Messages'
import { inputClass, linkButtonClass, primaryButtonClass } from './authStyles'
import { validatePassword } from './validation'

export default function ResetPasswordPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!token) {
      setError(t('resetPassword.errorInvalidToken'))
      return
    }

    const passwordError = validatePassword(password, confirmPassword)
    if (passwordError) {
      setError(t(`validation.${passwordError}`))
      return
    }

    setSubmitting(true)

    try {
      await resetPassword(token, password)
      navigate('/payment/auth', {
        replace: true,
        state: { noticeKey: 'auth:notices.passwordUpdated' },
      })
    } catch (err) {
      const fieldErrors = err.data?.errors
        ? Object.values(err.data.errors).join(' · ')
        : ''
      setError(fieldErrors || err.message || t('resetPassword.errorReset'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <h1 className="w-full text-left text-2xl font-normal text-gray-900">
          {t('resetPassword.title')}
        </h1>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>{t('resetPassword.newPassword')}</span>
          <input
            className={inputClass}
            type="password"
            name="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={20}
            placeholder={t('resetPassword.newPasswordPlaceholder')}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>{t('resetPassword.confirmPassword')}</span>
          <input
            className={inputClass}
            type="password"
            name="confirmPassword"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={20}
            placeholder={t('resetPassword.confirmPasswordPlaceholder')}
            required
          />
        </label>

        <p className="m-0 text-xs leading-relaxed text-gray-500">{t('resetPassword.hint')}</p>

        <ErrorMessage>{error}</ErrorMessage>

        <button className={primaryButtonClass} type="submit" disabled={submitting}>
          {submitting ? t('ui.pleaseWait') : t('resetPassword.submit')}
        </button>
      </form>

      <p className="m-0 text-center text-sm text-gray-500">
        <Link className={linkButtonClass} to="/payment/auth">
          {t('resetPassword.backToSignIn')}
        </Link>
      </p>
    </>
  )
}
