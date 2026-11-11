import { useTranslation } from 'react-i18next'
import { initials } from '../../lib/formatters'
import Modal from '../ui/Modal'
import TransactionItem from '../transactions/TransactionItem'

export default function ContactTransactionsModal({
  contact,
  transactions,
  currentUser,
  onSelectTransaction,
  onPay,
  onRequest,
  onClose,
}) {
  const { t } = useTranslation('app')

  return (
    <Modal
      open={Boolean(contact)}
      onClose={onClose}
      title={t('contacts.transactionsTitle')}
      size="lg"
      align="sheet"
      ariaLabel={
        contact
          ? t('contacts.transactionsAria', { nickname: contact.nickname })
          : t('contacts.transactionsTitle')
      }
    >
      {contact && (
        <>
          <div className="flex items-center gap-3 rounded bg-slate-50 p-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded bg-sky-100 text-base font-extrabold text-sky-700">
              {initials(contact.nickname)}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-slate-900">{contact.nickname}</p>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => onPay(contact)}
              className="rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
            >
              {t('contacts.pay')}
            </button>
            <button
              type="button"
              onClick={() => onRequest(contact)}
              className="rounded bg-green-500 py-3 text-sm font-bold text-white transition hover:bg-green-600 focus:outline-none focus:ring-4 focus:ring-green-200"
            >
              {t('contacts.request')}
            </button>
          </div>

          <p className="mb-3 mt-4 text-sm text-slate-500">
            {transactions.length === 0
              ? t('contacts.noTransactionsWith', { nickname: contact.nickname })
              : t('contacts.transactionSummary', {
                  count: transactions.length,
                  nickname: contact.nickname,
                })}
          </p>

          <ul className="flex flex-col gap-2.5">
            {transactions.map((transaction) => (
              <TransactionItem
                key={transaction.id}
                transaction={transaction}
                currentUser={currentUser}
                onClick={onSelectTransaction}
              />
            ))}
          </ul>
        </>
      )}
    </Modal>
  )
}
