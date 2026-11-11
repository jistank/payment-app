import { useTranslation } from 'react-i18next'
import {
  DIRECTION,
  directionLabel,
  formatAmount,
  initials,
  transactionDetails,
  transactionTitle,
} from '../../lib/formatters'
import { downloadTransactionPdf } from '../../lib/transactionPdf'
import Modal from '../ui/Modal'

export default function TransactionDetailModal({ transaction, currentUser, onClose }) {
  const { t } = useTranslation('transactions')

  if (!transaction) return null

  const direction = DIRECTION[transaction.direction] ?? DIRECTION.SENT
  const details = transactionDetails(transaction, currentUser)

  return (
    <Modal
      open
      onClose={onClose}
      title={t('detail.title')}
      size="md"
      align="sheet"
      ariaLabel={t('detail.aria')}
    >
      <div className="flex items-center gap-3 rounded bg-slate-50 p-3">
        <div
          className={`grid h-12 w-12 shrink-0 place-items-center rounded text-base font-extrabold ${direction.badge}`}
        >
          {initials(transaction.counterpartNickname)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {transactionTitle(transaction)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">{directionLabel(direction)}</p>
        </div>
        <p className={`shrink-0 text-base font-extrabold ${direction.amount}`}>
          {formatAmount(transaction.amount)}
        </p>
      </div>

      <dl className="mt-4 divide-y divide-slate-100">
        {details.map(({ key, value }) => (
          <div key={key} className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t(`fields.${key}`)}
            </dt>
            <dd className="m-0 max-w-[60%] break-words text-right text-sm font-medium text-slate-800">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <button
        type="button"
        onClick={() => downloadTransactionPdf(transaction, currentUser)}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200"
      >
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <path d="M7 10l5 5 5-5M12 15V3" />
        </svg>
        {t('detail.downloadPdf')}
      </button>
    </Modal>
  )
}
