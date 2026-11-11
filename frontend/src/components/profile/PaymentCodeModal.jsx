import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { requestPaymentCodeReset, resetPaymentCode } from '../../api'
import { useAuth } from '../../context/AuthContext'
import CodeInput from '../ui/CodeInput'
import Modal from '../ui/Modal'
import { ErrorMessage, NoticeMessage } from '../ui/Messages'

function onlyDigits(value) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export default function PaymentCodeModal({ open, onClose }) {
  const { t } = useTranslation('profile')
  const { token, refreshUser } = useAuth()
  const [nickname, setNickname] = useState('')
  const [password, setPassword] = useState('')
  const [verificationCode, setVerificationCode] = useState('')
  const [newCode, setNewCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [sending, setSending] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setNickname('')
    setPassword('')
    setVerificationCode('')
    setNewCode('')
    setConfirmCode('')
    setError('')
    setNotice('')
    setSending(false)
    setSubmitting(false)
  }, [open])

  async function handleSendCode() {
    setError('')
    setNotice('')

    if (!nickname.trim() || !password) {
      setError(t('paymentCode.errors.credentials'))
      return
    }

    setSending(true)

    try {
      await requestPaymentCodeReset(token, {
        nickname: nickname.trim(),
        password,
      })
      setNotice(t('paymentCode.notices.sent'))
    } catch (err) {
      setError(err.message || t('paymentCode.errors.send'))
    } finally {
      setSending(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setNotice('')

    if (!nickname.trim() || !password) {
      setError(t('paymentCode.errors.credentials'))
      return
    }

    if (verificationCode.length !== 6) {
      setError(t('paymentCode.errors.verificationCode'))
      return
    }

    if (newCode.length !== 6) {
      setError(t('paymentCode.errors.codeLength'))
      return
    }

    if (newCode !== confirmCode) {
      setError(t('paymentCode.errors.mismatch'))
      return
    }

    setSubmitting(true)

    try {
      await resetPaymentCode(token, {
        nickname: nickname.trim(),
        password,
        verificationCode,
        newCode,
      })
      setPassword('')
      setVerificationCode('')
      setNewCode('')
      setConfirmCode('')
      setNotice(t('paymentCode.notices.success'))
      refreshUser()
    } catch (err) {
      setError(err.message || t('paymentCode.errors.change'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('paymentCode.title')}
      description={t('paymentCode.description')}
      ariaLabel={t('paymentCode.title')}
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('paymentCode.nickname')}</span>
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="text"
            value={nickname}
            onChange={(event) => setNickname(event.target.value)}
            autoComplete="username"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('paymentCode.accountPassword')}</span>
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('paymentCode.verificationCode')}</span>
          <div className="flex gap-2">
            <input
              className="min-w-0 flex-1 rounded border border-slate-300 bg-white px-3 py-2.5 text-base tracking-[0.4em] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(event) => setVerificationCode(onlyDigits(event.target.value))}
              maxLength={6}
              autoComplete="one-time-code"
              required
            />
            <button
              type="button"
              onClick={handleSendCode}
              disabled={sending || submitting}
              className="shrink-0 rounded bg-sky-500 px-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {sending ? t('ui.sending') : t('actions.sendCode')}
            </button>
          </div>
        </label>

        <CodeInput
          label={t('paymentCode.newCode')}
          value={newCode}
          onChange={(event) => setNewCode(onlyDigits(event.target.value))}
          autoComplete="new-password"
        />

        <CodeInput
          label={t('paymentCode.confirmNewCode')}
          value={confirmCode}
          onChange={(event) => setConfirmCode(onlyDigits(event.target.value))}
          autoComplete="new-password"
        />

        <ErrorMessage>{error}</ErrorMessage>
        <NoticeMessage>{notice}</NoticeMessage>

        <button
          type="submit"
          disabled={submitting || sending}
          className="rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('ui.pleaseWait') : t('paymentCode.submit')}
        </button>
      </form>
    </Modal>
  )
}
