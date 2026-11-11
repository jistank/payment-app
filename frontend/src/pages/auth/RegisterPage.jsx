import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { register, sendVerificationCode } from '../../api'
import { ErrorMessage, NoticeMessage } from '../../components/ui/Messages'
import { inputClass, linkButtonClass, primaryButtonClass } from './authStyles'
import { validatePassword } from './validation'

const EMPTY_FORM = {
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
  verificationCode: '',
  business: false,
  serviceAgreement: false,
}

export default function RegisterPage() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [form, setForm] = useState(EMPTY_FORM)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sendingCode, setSendingCode] = useState(false)

  function updateField(event) {
    const { name, value, type, checked } = event.target
    setForm((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  function validateRegistration() {
    const passwordError = validatePassword(form.password, form.confirmPassword)
    if (passwordError) return t(`validation.${passwordError}`)

    if (!/^\d{6}$/.test(form.verificationCode)) {
      return t('errors.requiredVerificationCode')
    }

    if (!form.serviceAgreement) {
      return t('errors.serviceAgreement')
    }

    return ''
  }

  async function handleSendCode() {
    setError('')
    setNotice('')

    const email = form.email.trim()
    if (!email) {
      setError(t('errors.emailRequired'))
      return
    }

    setSendingCode(true)

    try {
      await sendVerificationCode(email)
      setNotice(t('notices.codeSent', { email }))
    } catch (err) {
      setError(err.message || t('errors.sendCode'))
    } finally {
      setSendingCode(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    const validationError = validateRegistration()
    if (validationError) {
      setError(validationError)
      return
    }

    setSubmitting(true)

    try {
      await register(form)
      navigate('/payment/auth', {
        replace: true,
        state: {
          email: form.email,
          noticeKey: 'auth:notices.accountCreated',
        },
      })
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
          <span>{t('register.nickname')}</span>
          <input
            className={inputClass}
            name="nickname"
            value={form.nickname}
            onChange={updateField}
            minLength={3}
            maxLength={50}
            placeholder={t('register.nicknamePlaceholder')}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>{t('register.email')}</span>
          <input
            className={inputClass}
            type="email"
            name="email"
            value={form.email}
            onChange={updateField}
            autoComplete="email"
            placeholder={t('register.emailPlaceholder')}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>{t('register.password')}</span>

          <div className="relative flex items-center">
            <input
              className={`${inputClass} pr-10`}
              type="password"
              name="password"
              value={form.password}
              onChange={updateField}
              autoComplete="new-password"
              minLength={8}
              placeholder={t('register.passwordPlaceholder')}
              maxLength={20}
              required
            />

            <div className="group absolute right-3 flex items-center">
              <span className="flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-gray-400 bg-gray-50 text-xs font-medium text-gray-500 hover:border-gray-600 hover:text-gray-700">
                ?
              </span>

              <div className="absolute bottom-full right-0 z-10 mb-2 hidden w-52 flex-col gap-1 rounded bg-gray-900 px-3 py-2 text-left text-xs text-white shadow-lg group-hover:block">
                <p className="font-semibold">{t('register.passwordHintTitle')}</p>
                <p>{t('register.passwordHintLength')}</p>
                <p>{t('register.passwordHintCase')}</p>
                <p>{t('register.passwordHintNumber')}</p>
                <p>{t('register.passwordHintSpecial')}</p>

                <div className="absolute right-3 top-full -translate-x-1/2 border-4 border-transparent border-t-gray-900" />
              </div>
            </div>
          </div>
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-normal text-gray-700">
          <span>{t('register.confirmPassword')}</span>
          <input
            className={inputClass}
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={updateField}
            autoComplete="new-password"
            minLength={8}
            placeholder={t('register.confirmPasswordPlaceholder')}
            maxLength={20}
            required
          />
        </label>

        <div className="flex items-end gap-3">
          <label className="flex flex-1 flex-col gap-1.5 text-sm font-normal text-gray-700">
            <span>{t('register.verificationCode')}</span>
            <input
              className={inputClass}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              name="verificationCode"
              value={form.verificationCode}
              onChange={updateField}
              autoComplete="one-time-code"
              minLength={6}
              maxLength={6}
              placeholder={t('register.verificationCodePlaceholder')}
              required
            />
          </label>

          <button
            className="shrink-0 cursor-pointer rounded bg-sky-500 px-4 py-2.5 text-base font-bold text-white transition hover:-translate-y-px hover:bg-sky-600 disabled:opacity-60 disabled:hover:translate-y-0"
            type="button"
            onClick={handleSendCode}
            disabled={sendingCode}
          >
            {sendingCode ? t('ui.sending') : t('register.sendCode')}
          </button>
        </div>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
          <input
            className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-sky-500"
            type="checkbox"
            name="business"
            checked={form.business}
            onChange={updateField}
          />
          <span>{t('register.businessAccount')}</span>
        </label>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm text-gray-700">
          <input
            className="mt-0.5 h-[17px] w-[17px] shrink-0 accent-sky-500"
            type="checkbox"
            name="serviceAgreement"
            checked={form.serviceAgreement}
            onChange={updateField}
          />
          <span>
            {t('register.agreementPrefix')}{' '}
            <a
              href="/terms.html"
              target="_blank"
              rel="noopener noreferrer"
              className="cursor-pointer text-sky-600 underline hover:text-sky-700"
            >
              {t('register.agreementLink')}
            </a>
          </span>
        </label>

        <NoticeMessage>{notice}</NoticeMessage>
        <ErrorMessage>{error}</ErrorMessage>

        <button className={primaryButtonClass} type="submit" disabled={submitting}>
          {submitting ? t('ui.pleaseWait') : t('register.submit')}
        </button>
      </form>

      <p className="m-0 text-center text-sm text-gray-500">
        <Link className={linkButtonClass} to="/payment/auth">
          {t('register.signIn')}
        </Link>
      </p>
    </>
  )
}
