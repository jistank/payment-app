import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminTransactions } from '../../api'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { formatDate, money } from '../../lib/formatters'
import { ErrorMessage } from '../ui/Messages'
import {
  inputClass,
  selectClass,
  statusBadgeClass,
  tableCellClass,
  tableHeaderClass,
} from './adminStyles'

const STATUS_OPTIONS = ['ALL', 'COMPLETED', 'PENDING', 'FAILED', 'REFUNDED']
const TYPE_OPTIONS = ['ALL', 'FRIEND_TRANSFER', 'SHOPPING', 'DONATION', 'SUBSCRIPTION', 'TOP_UP']

export default function AdminTransactions({ token, refreshKey }) {
  const { t } = useTranslation('admin')

  const [user, setUser] = useState('')
  const debouncedUser = useDebouncedValue(user.trim(), 300)
  const [status, setStatus] = useState('ALL')
  const [type, setType] = useState('ALL')

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    getAdminTransactions(token, { user: debouncedUser, status, type, limit: 200 })
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t('transactions.errors.load'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, debouncedUser, status, type, refreshKey])

  const unknown = t('common.unknown')

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {t('transactions.title')}
        </h2>
        {!loading && (
          <p className="mt-0.5 text-xs text-slate-500">
            {t('transactions.count', { count: rows.length })}
          </p>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('filters.search')}</span>
          <input
            className={inputClass}
            type="search"
            value={user}
            onChange={(event) => setUser(event.target.value)}
            placeholder={t('filters.searchPlaceholder')}
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('filters.status')}</span>
          <select
            className={selectClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`statuses.${option}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('filters.type')}</span>
          <select
            className={selectClass}
            value={type}
            onChange={(event) => setType(event.target.value)}
          >
            {TYPE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`types.${option}`)}
              </option>
            ))}
          </select>
        </label>
      </div>

      <ErrorMessage className="mb-3">{error}</ErrorMessage>

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="rounded border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {t('transactions.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className={tableHeaderClass}>{t('transactions.date')}</th>
                <th className={tableHeaderClass}>{t('transactions.sender')}</th>
                <th className={tableHeaderClass}>{t('transactions.receiver')}</th>
                <th className={tableHeaderClass}>{t('filters.type')}</th>
                <th className={tableHeaderClass}>{t('filters.status')}</th>
                <th className={tableHeaderClass}>{t('transactions.amount')}</th>
                <th className={tableHeaderClass}>{t('transactions.method')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={`${tableCellClass} whitespace-nowrap`}>{formatDate(row.transactionTime)}</td>
                  <td className={tableCellClass}>{row.senderNickname || unknown}</td>
                  <td className={tableCellClass}>{row.receiverNickname || unknown}</td>
                  <td className={tableCellClass}>
                    {t(`types.${row.transactionType}`, { defaultValue: row.transactionType })}
                  </td>
                  <td className={tableCellClass}>
                    <span className={statusBadgeClass(row.transactionStatus)}>
                      {t(`statuses.${row.transactionStatus}`, { defaultValue: row.transactionStatus })}
                    </span>
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap font-bold text-slate-900`}>
                    {money.format(Number(row.amount ?? 0))}
                  </td>
                  <td className={tableCellClass}>{row.method || t('common.notAvailable')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
