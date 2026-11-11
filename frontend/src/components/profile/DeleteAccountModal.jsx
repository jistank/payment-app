import { useEffect, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { deleteAccount } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import { ErrorMessage } from '../ui/Messages'

export default function DeleteAccountModal({ open, onClose, onDeleted }) {
  const { t } = useTranslation('profile')
  const { token, user } = useAuth()
  const [step, setStep] = useState('form')
  const [nickname, setNickname] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setStep('form')
    setNickname('')
    setCode('')
    setError('')
    setSubmitting(false)
  }, [open])

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (nickname.trim() !== user.nickname) {
      setError(t('deleteAccount.errors.nicknameMismatch'))
      return
    }

    if (code.length !== 6) {
      setError(t('deleteAccount.errors.codeLength'))
      return
    }

    setStep('confirm')
  }

  async function handleDelete() {
    setError('')
    setSubmitting(true)

    try {
      await deleteAccount(token, { nickname: nickname.trim(), code })
      onDeleted()
    } catch (err) {
      setError(err.message || t('deleteAccount.errors.delete'))
      setStep('form')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('deleteAccount.title')}
      description={
        step === 'form'
          ? t('deleteAccount.descriptionForm')
          : t('deleteAccount.descriptionConfirm')
      }
      ariaLabel={t('deleteAccount.title')}
    >
      {step === 'form' ? (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>{t('deleteAccount.nickname')}</span>
            <input
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              type="text"
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              placeholder={user.nickname}
              autoComplete="off"
              required
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>{t('deleteAccount.paymentCode')}</span>
            <input
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base tracking-[0.4em] outline-none transition focus:border-red-500 focus:ring-2 focus:ring-red-100"
              type="password"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              autoComplete="off"
              required
            />
          </label>

          <ErrorMessage>{error}</ErrorMessage>

          <button
            type="submit"
            className="rounded bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200"
          >
            {t('deleteAccount.continue')}
          </button>
        </form>
      ) : (
        <div className="flex flex-col gap-4">
          <p className="m-0 text-sm text-slate-600">
            <Trans
              ns="profile"
              i18nKey="deleteAccount.confirmText"
              values={{ nickname: user.nickname }}
              components={{ strong: <span className="font-extrabold text-slate-900" /> }}
            />
          </p>

          <ErrorMessage>{error}</ErrorMessage>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setStep('form')}
              disabled={submitting}
              className="flex-1 rounded border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('actions.cancel')}
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={submitting}
              className="flex-1 rounded bg-red-600 py-3 text-sm font-bold text-white transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t('ui.deleting') : t('deleteAccount.confirm')}
            </button>
          </div>
        </div>
      )}
    </Modal>
  )
}
