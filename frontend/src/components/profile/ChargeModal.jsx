import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { topUpBalance } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { usePayments } from '../../context/PaymentsContext'
import { APP_CURRENCY, APP_CURRENCY_SYMBOL, money } from '../../lib/formatters'
import { notifyDataChanged } from '../../lib/sync'
import Modal from '../ui/Modal'
import { ErrorMessage, NoticeMessage } from '../ui/Messages'

const QUICK_AMOUNTS = [10, 25, 50, 100]

export default function ChargeModal({ open, onClose }) {
  const { t } = useTranslation('profile')
  const { token, user, refreshUser } = useAuth()
  const { refreshTransactions } = usePayments()
  const [amount, setAmount] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setAmount('')
    setError('')
    setNotice('')
    setSubmitting(false)
    submittingRef.current = false
  }, [open])

  function selectQuickAmount(value) {
    setAmount(String(value))
    setError('')
    setNotice('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current) return

    setError('')
    setNotice('')

    const value = Math.round(Number(amount) * 100) / 100
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('charge.errors.amountInvalid'))
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    try {
      const updatedUser = await topUpBalance(token, { amount: value, currency: APP_CURRENCY })
      await Promise.all([refreshUser(), refreshTransactions()])
      notifyDataChanged()

      setAmount('')
      setNotice(
        t('charge.success', {
          amount: money.format(value),
          balance: money.format(Number(updatedUser?.balance ?? 0)),
        }),
      )
    } catch (err) {
      setError(err.message || t('charge.errors.charge'))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('charge.title')}
      description={t('charge.description')}
      ariaLabel={t('charge.title')}
    >
      <div className="mb-4 rounded border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t('charge.currentBalance')}
        </span>
        <strong className="mt-1 block text-2xl font-extrabold tracking-tight text-slate-900">
          {money.format(Number(user?.balance ?? 0))}
        </strong>
      </div>

      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('charge.amount')}</span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base font-bold text-slate-500">
              {APP_CURRENCY_SYMBOL}
            </span>
            <input
              className="w-full rounded border border-slate-300 bg-white py-2.5 pl-8 pr-3 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="number"
              name="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              placeholder={t('charge.amountPlaceholder')}
              autoFocus
              required
            />
          </div>
        </label>

        <div className="flex flex-wrap gap-2" aria-label={t('charge.quickAmounts')}>
          {QUICK_AMOUNTS.map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => selectQuickAmount(value)}
              disabled={submitting}
              className="rounded border border-slate-300 bg-white px-3 py-1.5 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {money.format(value)}
            </button>
          ))}
        </div>

        <ErrorMessage>{error}</ErrorMessage>
        <NoticeMessage>{notice}</NoticeMessage>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('ui.pleaseWait') : t('charge.submit')}
        </button>
      </form>
    </Modal>
  )
}
