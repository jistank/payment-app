import { useEffect, useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'
import { acceptPaymentRequest, declinePaymentRequest } from '../../api'
import { useAuth } from '../../context/AuthContext'
import { formatFullDate, initials, money } from '../../lib/formatters'
import { notifyDataChanged } from '../../lib/sync'
import Modal from '../ui/Modal'
import PaymentCodeInput from '../ui/PaymentCodeInput'
import { ErrorMessage } from '../ui/Messages'

export default function IncomingPaymentRequestModal({ request, onClose, onResolved }) {
  const { t } = useTranslation('payments')
  const { token, user } = useAuth()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [codeStep, setCodeStep] = useState(false)
  const [paymentCode, setPaymentCode] = useState('')
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!request) return
    setError('')
    setSubmitting(false)
    submittingRef.current = false
    setCodeStep(false)
    setPaymentCode('')
  }, [request?.id])

  async function handleResolve(action, code) {
    if (submittingRef.current) return
    submittingRef.current = true
    setError('')
    setSubmitting(true)

    try {
      if (action === 'accept') {
        await acceptPaymentRequest(token, request.id, code)
      } else {
        await declinePaymentRequest(token, request.id)
      }

      notifyDataChanged()
      onResolved(action, request)
    } catch (err) {
      if (err.status === 404) {
        onResolved('missing', request)
        return
      }
      setError(err.message || t('errors.processFailed'))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  function startAccept() {
    setError('')

    if (!user?.paymentCodeConfigured) {
      setError(t('errors.paymentCodeSetup'))
      return
    }

    setPaymentCode('')
    setCodeStep(true)
  }

  return (
    <Modal
      open={Boolean(request)}
      onClose={onClose}
      title={t('incoming.title')}
      description={
        request
          ? t('incoming.description', { nickname: request.requesterNickname })
          : undefined
      }
      ariaLabel={t('incoming.aria')}
    >
      {request && (
        <>
          <div className="flex items-center gap-3 rounded bg-slate-50 p-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-sky-100 text-base font-extrabold text-sky-700">
              {initials(request.requesterNickname)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">
                {request.requesterNickname}
              </p>
              <p className="mt-0.5 text-xs text-slate-500">{formatFullDate(request.createdAt)}</p>
            </div>
            <p className="shrink-0 text-base font-extrabold text-indigo-700">
              {money.format(Number(request.amount ?? 0))}
            </p>
          </div>

          {request.note && (
            <p className="mt-3 rounded border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-600">
              {request.note}
            </p>
          )}

          <ErrorMessage className="mt-3">{error}</ErrorMessage>

          {codeStep ? (
            <div className="mt-5 flex flex-col gap-4">
              <p className="m-0 text-center text-sm text-slate-600">
                <Trans
                  ns="payments"
                  i18nKey="codeStep"
                  values={{
                    amount: money.format(Number(request.amount ?? 0)),
                    nickname: request.requesterNickname,
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
                  onClick={() => handleResolve('accept', paymentCode)}
                  disabled={submitting || paymentCode.length !== 6}
                  className="flex-1 rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t('ui.pleaseWait') : t('buttons.confirmPayment')}
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-5 flex gap-3">
              <button
                type="button"
                onClick={() => handleResolve('decline')}
                disabled={submitting}
                className="flex-1 rounded border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {t('buttons.decline')}
              </button>
              <button
                type="button"
                onClick={startAccept}
                disabled={submitting}
                className="flex-1 rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? t('ui.pleaseWait') : t('buttons.sendMoney')}
              </button>
            </div>
          )}
        </>
      )}
    </Modal>
  )
}
