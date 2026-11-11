import { useTranslation } from 'react-i18next'
import { formatDate, initials, money } from '../../lib/formatters'

export default function IncomingRequestItem({ request, onClick }) {
  const { t } = useTranslation('transactions')

  return (
    <li>
      <button
        type="button"
        onClick={() => onClick(request)}
        className="flex w-full items-center gap-3 rounded border border-amber-200 bg-amber-50 px-3 py-3 text-left transition hover:border-amber-300 hover:bg-amber-100/60 focus:outline-none focus:ring-4 focus:ring-amber-100 sm:gap-4 sm:px-4"
      >
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded bg-sky-100 text-sm font-extrabold text-sky-700">
          {initials(request.requesterNickname)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-slate-900">
            {t('incoming.requestFrom', { nickname: request.requesterNickname })}
          </p>
          <p className="mt-0.5 truncate text-xs text-slate-500">
            {formatDate(request.createdAt)}
            {request.note ? ` · ${request.note}` : ''}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-indigo-700">
            {money.format(Number(request.amount ?? 0))}
          </p>
          <p className="mt-0.5 text-[0.68rem] uppercase tracking-wider text-amber-600">
            {t('incoming.badge')}
          </p>
        </div>
      </button>
    </li>
  )
}
