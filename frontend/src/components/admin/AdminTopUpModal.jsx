import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminTopUpUser } from '../../api'
import { APP_CURRENCY, APP_CURRENCY_SYMBOL, money } from '../../lib/formatters'
import Modal from '../ui/Modal'
import { ErrorMessage, NoticeMessage } from '../ui/Messages'
import { fieldLabelClass, inputClass, primaryButtonClass } from './adminStyles'

export default function AdminTopUpModal({ open, token, user, onClose, onDone }) {
  const { t } = useTranslation('admin')
  const [amount, setAmount] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setNote('')
    setError('')
    setNotice('')
    setSubmitting(false)
    submittingRef.current = false
  }, [open, user?.id])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current || !user) return

    setError('')
    setNotice('')

    const value = Math.round(Number(amount) * 100) / 100
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('topUp.errors.amountInvalid'))
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    try {
      const updated = await adminTopUpUser(token, user.id, {
        amount: value,
        currency: APP_CURRENCY,
        note: note.trim() || undefined,
      })
      setAmount('')
      setNote('')
      setNotice(
        t('topUp.success', {
          balance: money.format(Number(updated?.balance ?? 0)),
        }),
      )
      onDone?.(updated)
    } catch (err) {
      setError(err.message || t('topUp.errors.topUp'))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onClose}
      title={t('topUp.title')}
      description={t('topUp.description', { nickname: user?.nickname ?? '' })}
      ariaLabel={t('topUp.title')}
      size="md"
    >
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t('users.balance')}
        </span>
        <strong className="mt-1 block text-2xl font-extrabold tracking-tight text-slate-900">
          {money.format(Number(user?.balance ?? 0))}
        </strong>
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className={fieldLabelClass}>
          <span>{t('topUp.amount')}</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
              {APP_CURRENCY_SYMBOL}
            </span>
            <input
              className={`${inputClass} pl-8 text-base`}
              type="number"
              name="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              placeholder={t('topUp.amountPlaceholder')}
              autoFocus
              required
            />
          </div>
        </label>

        <label className={fieldLabelClass}>
          <span>{t('topUp.note')}</span>
          <input
            className={inputClass}
            type="text"
            name="note"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            maxLength={255}
            placeholder={t('topUp.notePlaceholder')}
          />
        </label>

        <ErrorMessage>{error}</ErrorMessage>
        <NoticeMessage>{notice}</NoticeMessage>

        <button
          type="submit"
          disabled={submitting}
          className={`${primaryButtonClass} py-3 text-base`}
        >
          {submitting ? t('common.loading') : t('topUp.submit')}
        </button>
      </form>
    </Modal>
  )
}
