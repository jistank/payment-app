import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminPaymentRequests } from '../../api'
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

const STATUS_OPTIONS = ['ALL', 'PENDING', 'PAID', 'DECLINED']

export default function AdminPaymentRequests({ token, refreshKey }) {
  const { t } = useTranslation('admin')

  const [user, setUser] = useState('')
  const debouncedUser = useDebouncedValue(user.trim(), 300)
  const [status, setStatus] = useState('ALL')

  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    getAdminPaymentRequests(token, { user: debouncedUser, status, limit: 200 })
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t('requests.errors.load'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, debouncedUser, status, refreshKey])

  const unknown = t('common.unknown')

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
          {t('requests.title')}
        </h2>
        {!loading && (
          <p className="mt-0.5 text-xs text-slate-500">
            {t('requests.count', { count: rows.length })}
          </p>
        )}
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem]">
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
      </div>

      <ErrorMessage className="mb-3">{error}</ErrorMessage>

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : rows.length === 0 ? (
        <p className="rounded border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {t('requests.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full min-w-[760px] border-collapse">
            <thead>
              <tr>
                <th className={tableHeaderClass}>{t('requests.created')}</th>
                <th className={tableHeaderClass}>{t('requests.requester')}</th>
                <th className={tableHeaderClass}>{t('requests.payer')}</th>
                <th className={tableHeaderClass}>{t('requests.amount')}</th>
                <th className={tableHeaderClass}>{t('filters.status')}</th>
                <th className={tableHeaderClass}>{t('requests.note')}</th>
                <th className={tableHeaderClass}>{t('requests.resolved')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={`${tableCellClass} whitespace-nowrap`}>{formatDate(row.createdAt)}</td>
                  <td className={tableCellClass}>{row.requesterNickname || unknown}</td>
                  <td className={tableCellClass}>{row.payerNickname || unknown}</td>
                  <td className={`${tableCellClass} whitespace-nowrap font-bold text-slate-900`}>
                    {money.format(Number(row.amount ?? 0))}
                  </td>
                  <td className={tableCellClass}>
                    <span className={statusBadgeClass(row.status)}>
                      {t(`statuses.${row.status}`, { defaultValue: row.status })}
                    </span>
                  </td>
                  <td className={`${tableCellClass} max-w-[16rem]`}>{row.note || t('common.notAvailable')}</td>
                  <td className={`${tableCellClass} whitespace-nowrap`}>
                    {row.resolvedAt ? formatDate(row.resolvedAt) : t('common.notAvailable')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
