import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { createPaymentRequest, sendPayment } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { APP_CURRENCY, PAYMENT_TYPES, money } from '../../lib/formatters'
import { notifyDataChanged } from '../../lib/sync'
import Modal from '../ui/Modal'
import PaymentCodeInput from '../ui/PaymentCodeInput'
import { ErrorMessage } from '../ui/Messages'

export default function PaymentFormModal({ open, mode, contact, onClose, onCompleted }) {
  const { t } = useTranslation('payments')
  const { token, user } = useAuth()
  const [nickname, setNickname] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState('FRIEND_TRANSFER')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [codeStep, setCodeStep] = useState(false)
  const [paymentCode, setPaymentCode] = useState('')
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setNickname(contact?.nickname ?? '')
    setAmount('')
    setType('FRIEND_TRANSFER')
    setNote('')
    setError('')
    setSubmitting(false)
    submittingRef.current = false
    setCodeStep(false)
    setPaymentCode('')
  }, [open, mode, contact?.id, contact?.nickname])

  const isPay = mode === 'pay'
  const targetNickname = (contact?.nickname ?? nickname).trim()

  const description = isPay
    ? contact
      ? t('form.payDescription', { nickname: contact.nickname })
      : t('form.payDescriptionGeneric')
    : contact
      ? t('form.requestDescription', { nickname: contact.nickname })
      : t('form.requestDescriptionGeneric')

  async function complete(value, code) {
    if (submittingRef.current) return
    submittingRef.current = true
    setSubmitting(true)
    setError('')

    try {
      if (isPay) {
        await sendPayment(token, {
          nickname: targetNickname,
          amount: value,
          currency: APP_CURRENCY,
          type,
          code,
        })
      } else {
        await createPaymentRequest(token, {
          nickname: targetNickname,
          amount: value,
          currency: APP_CURRENCY,
          note: note.trim() || null,
        })
      }

      notifyDataChanged()
      onCompleted(mode, { nickname: targetNickname }, value)
    } catch (err) {
      setCodeStep(false)
      setPaymentCode('')
      setError(
        err.status === 404
          ? t('errors.userNotFound')
          : err.message || t(isPay ? 'errors.paymentFailed' : 'errors.requestFailed'),
      )
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!targetNickname) {
      setError(t('errors.nicknameRequired'))
      return
    }

    const value = Number(amount)
    if (!Number.isFinite(value) || value <= 0) {
      setError(t('errors.amountInvalid'))
      return
    }

    if (isPay) {
      if (!user?.paymentCodeConfigured) {
        setError(t('errors.paymentCodeSetup'))
        return
      }
      setPaymentCode('')
      setCodeStep(true)
      return
    }

    await complete(value)
  }

  async function handleCodeConfirm() {
    if (paymentCode.length !== 6) {
      setError(t('errors.paymentCodeLength'))
      return
    }

    await complete(Number(amount), paymentCode)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isPay ? t('form.payTitle') : t('form.requestTitle')}
      description={description}
      ariaLabel={isPay ? t('form.payAria') : t('form.requestAria')}
    >
      {codeStep ? (
        <div className="flex flex-col gap-4">
          <p className="m-0 text-center text-sm text-slate-600">
            <Trans
              ns="payments"
              i18nKey="codeStep"
              values={{
                amount: money.format(Number(amount) || 0),
                nickname: targetNickname,
              }}
              components={{ strong: <span className="font-extrabold text-slate-900" /> }}
            />
          </p>

          <PaymentCodeInput
            value={paymentCode}
            onChange={setPaymentCode}
            disabled={submitting}
            autoFocus
          />

          <ErrorMessage>{error}</ErrorMessage>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setCodeStep(false)
                setPaymentCode('')
                setError('')
              }}
              disabled={submitting}
              className="flex-1 rounded border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {t('actions.back')}
            </button>
            <button
              type="button"
              onClick={handleCodeConfirm}
              disabled={submitting || paymentCode.length !== 6}
              className="flex-1 rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t('ui.pleaseWait') : t('buttons.confirmPayment')}
            </button>
          </div>
        </div>
      ) : (
        <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
          {!contact && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>{t('fields.nickname')}</span>
              <input
                className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                type="text"
                name="nickname"
                value={nickname}
                onChange={(event) => setNickname(event.target.value)}
                placeholder={t('fields.nicknamePlaceholder')}
                autoFocus
                required
              />
            </label>
          )}

          <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
            <span>{t('fields.amount')}</span>
            <input
              className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              type="number"
              name="amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              min="0.01"
              step="0.01"
              placeholder="0.00"
              autoFocus={Boolean(contact)}
              required
            />
          </label>

          {isPay && contact && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>{t('fields.paymentType')}</span>
              <select
                className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                name="type"
                value={type}
                onChange={(event) => setType(event.target.value)}
              >
                {PAYMENT_TYPES.map((value) => (
                  <option key={value} value={value}>
                    {t(`types.${value}`)}
                  </option>
                ))}
              </select>
            </label>
          )}

          {!isPay && contact && (
            <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
              <span>{t('fields.note')}</span>
              <textarea
                className="w-full resize-none rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                name="note"
                value={note}
                onChange={(event) => setNote(event.target.value)}
                maxLength={255}
                rows={3}
                placeholder={t('fields.notePlaceholder')}
              />
            </label>
          )}

          <ErrorMessage>{error}</ErrorMessage>

          <button
            type="submit"
            disabled={submitting}
            className={`rounded py-3 text-sm font-bold text-white transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
              isPay
                ? 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-200'
                : 'bg-green-500 hover:bg-green-600 focus:ring-green-200'
            }`}
          >
            {submitting
              ? t('ui.pleaseWait')
              : isPay
                ? t('buttons.pay')
                : t('buttons.sendRequest')}
          </button>
        </form>
      )}
    </Modal>
  )
}
