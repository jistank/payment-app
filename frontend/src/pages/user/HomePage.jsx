import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import IncomingPaymentRequestModal from '../../components/payments/IncomingPaymentRequestModal'
import PaymentFormModal from '../../components/payments/PaymentFormModal'
import IncomingRequestItem from '../../components/transactions/IncomingRequestItem'
import TransactionDetailModal from '../../components/transactions/TransactionDetailModal'
import TransactionItem from '../../components/transactions/TransactionItem'
import { useAuth } from '../../context/AuthContext'
import { usePayments } from '../../context/PaymentsContext'
import { money } from '../../lib/formatters'

export default function HomePage() {
  const { t } = useTranslation('app')
  const { user, refreshUser } = useAuth()
  const {
    transactions,
    transactionsLoading,
    transactionsError,
    incomingRequests,
    requestsError,
    refreshTransactions,
    refreshIncomingRequests,
  } = usePayments()
  const [selectedTransaction, setSelectedTransaction] = useState(null)
  const [selectedRequest, setSelectedRequest] = useState(null)
  const [paymentForm, setPaymentForm] = useState(null)
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!notice) return undefined
    const timeout = setTimeout(() => setNotice(''), 4000)
    return () => clearTimeout(timeout)
  }, [notice])

  async function handlePaymentCompleted(mode, contact, amount) {
    setPaymentForm(null)

    setNotice(
      t(mode === 'pay' ? 'notices.paymentSent' : 'notices.requestSent', {
        amount: money.format(Number(amount)),
        nickname: contact.nickname,
      }),
    )

    await Promise.all([
      refreshTransactions(),
      mode === 'pay' ? refreshUser() : Promise.resolve(),
    ])
  }

  async function handleRequestResolved(action, request) {
    setSelectedRequest(null)

    if (action !== 'missing') {
      setNotice(
        action === 'accept'
          ? t('notices.paymentAccepted', { nickname: request.requesterNickname })
          : t('notices.requestDeclined', { nickname: request.requesterNickname }),
      )
    }

    await Promise.all([
      refreshIncomingRequests(),
      refreshTransactions(),
      action === 'accept' ? refreshUser() : Promise.resolve(),
    ])
  }

  return (
    <>
      <header className="mb-5 text-center sm:mb-6">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {t('home.availableBalance')}
        </span>
        <strong className="mt-2 block text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">
          {money.format(Number(user.balance ?? 0))}
        </strong>
      </header>

      {notice && (
        <p className="mb-4 rounded border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700">
          {notice}
        </p>
      )}

      <div className="mx-auto mt-4 flex w-full max-w-md overflow-hidden rounded shadow-md shadow-slate-200">
        <button
          type="button"
          onClick={() => setPaymentForm({ mode: 'pay', contact: null })}
          className="flex-1 bg-sky-500 py-4 text-base font-bold text-white transition hover:bg-sky-600"
        >
          {t('home.pay')}
        </button>
        <button
          type="button"
          onClick={() => setPaymentForm({ mode: 'request', contact: null })}
          className="flex-1 border-l border-black/10 bg-green-500 py-4 text-base font-bold text-white transition hover:bg-green-600"
        >
          {t('home.receive')}
        </button>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 text-base font-extrabold tracking-tight text-slate-900">
          {t('home.transactions')}
        </h2>

        {requestsError && (
          <p className="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {requestsError}
          </p>
        )}

        {transactionsLoading && (
          <p className="text-sm text-slate-500">{t('home.loadingTransactions')}</p>
        )}

        {!transactionsLoading && transactionsError && (
          <p className="rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {transactionsError}
          </p>
        )}

        {!transactionsLoading &&
          !transactionsError &&
          transactions.length === 0 &&
          incomingRequests.length === 0 && (
            <p className="text-sm text-slate-500">{t('home.noTransactions')}</p>
          )}

        <ul className="flex flex-col gap-2.5">
          {incomingRequests.map((request) => (
            <IncomingRequestItem
              key={`request-${request.id}`}
              request={request}
              onClick={setSelectedRequest}
            />
          ))}
          {transactions.map((transaction) => (
            <TransactionItem
              key={transaction.id}
              transaction={transaction}
              currentUser={user}
              onClick={setSelectedTransaction}
            />
          ))}
        </ul>
      </section>

      <PaymentFormModal
        open={Boolean(paymentForm)}
        mode={paymentForm?.mode}
        contact={paymentForm?.contact}
        onClose={() => setPaymentForm(null)}
        onCompleted={handlePaymentCompleted}
      />

      <IncomingPaymentRequestModal
        request={selectedRequest}
        onClose={() => setSelectedRequest(null)}
        onResolved={handleRequestResolved}
      />

      <TransactionDetailModal
        transaction={selectedTransaction}
        currentUser={user}
        onClose={() => setSelectedTransaction(null)}
      />
    </>
  )
}
