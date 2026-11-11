import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { requestPasswordReset } from '../../api'
import { ErrorMessage, NoticeMessage } from '../../components/ui/Messages'
import { inputClass, linkButtonClass, primaryButtonClass } from './authStyles'

export default function ForgotPasswordPage() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const value = email.trim()
    if (!value) {
      setError(t('forgotPassword.errorEmailRequired'))
      return
    }

    setSubmitting(true)

    try {
      await requestPasswordReset(value)
      setNotice(t('forgotPassword.notice'))
    } catch (err) {
      setError(err.message || t('forgotPassword.errorSend'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <form className="flex flex-col gap-3.5" onSubmit={handleSubmit}>
        <h1 className="w-full text-left text-2xl font-normal text-gray-900">
          {t('forgotPassword.title')}
        </h1>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>
            <span className="mr-1 text-red-500">*</span>
            {t('forgotPassword.paymentAccount')}
          </span>
          <input
            className={inputClass}
            type="email"
            name="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            autoComplete="email"
            placeholder={t('forgotPassword.emailPlaceholder')}
            required
          />
        </label>

        <ErrorMessage>{error}</ErrorMessage>
        <NoticeMessage>{notice}</NoticeMessage>

        <button className={primaryButtonClass} type="submit" disabled={submitting}>
          {submitting ? t('ui.pleaseWait') : t('forgotPassword.submit')}
        </button>
      </form>

      <p className="m-0 text-center text-sm text-gray-500">
        <Link className={linkButtonClass} to="/payment/auth">
          {t('forgotPassword.backToSignIn')}
        </Link>
      </p>
    </>
  )
}
