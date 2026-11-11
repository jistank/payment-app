import { useTranslation } from 'react-i18next'
import {
  DIRECTION,
  directionLabel,
  formatDate,
  formatStatus,
  initials,
  money,
  transactionTitle,
} from '../../lib/formatters'

export default function TransactionItem({ transaction, currentUser, onClick }) {
  const { t } = useTranslation('transactions')
  const direction = DIRECTION[transaction.direction] ?? DIRECTION.SENT

  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(transaction)}
        className="flex w-full items-center gap-3 rounded border border-slate-200 bg-white px-3 py-3 text-left transition hover:border-sky-200 hover:bg-sky-50/40 focus:outline-none focus:ring-4 focus:ring-sky-100 sm:gap-4 sm:px-4"
      >
        <div
          className={`grid h-10 w-10 shrink-0 place-items-center rounded text-sm font-extrabold ${direction.badge}`}
        >
          {initials(transaction.counterpartNickname ?? currentUser.nickname)}
        </div>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {transactionTitle(transaction)}
          </p>
          <p className="mt-0.5 text-xs text-slate-500">
            {formatDate(transaction.transactionTime)}
            {transaction.transactionStatus === 'COMPLETED'
              ? ''
              : ` · ${formatStatus(transaction.transactionStatus)}`}
          </p>
        </div>

        <div className="text-right">
          <p className={`text-sm font-bold ${direction.amount}`}>
            {direction.sign}
            {money.format(Number(transaction.amount ?? 0))}
          </p>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-wider text-slate-400">
            {directionLabel(direction)}
          </p>
        </div>
      </button>
    </li>
  )
}
