import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminAuditLogs } from '../../api'
import { formatDate } from '../../lib/formatters'
import { ErrorMessage } from '../ui/Messages'
import { selectClass, tableCellClass, tableHeaderClass } from './adminStyles'

const ACTION_OPTIONS = ['ALL', 'USER_SUSPENDED', 'USER_REACTIVATED', 'USER_DELETED', 'MANUAL_TOP_UP']

export default function AdminAudit({ token, refreshKey }) {
  const { t } = useTranslation('admin')

  const [action, setAction] = useState('ALL')
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    getAdminAuditLogs(token, { action, limit: 100 })
      .then((data) => {
        if (!cancelled) setRows(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t('audit.errors.load'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, action, refreshKey])

  return (
    <section>
      <div className="mb-4">
        <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{t('audit.title')}</h2>
        {!loading && (
          <p className="mt-0.5 text-xs text-slate-500">
            {t('audit.count', { count: rows.length })}
          </p>
        )}
      </div>

      <div className="mb-4 max-w-xs">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('filters.action')}</span>
          <select
            className={selectClass}
            value={action}
            onChange={(event) => setAction(event.target.value)}
          >
            {ACTION_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {t(`audit.actions.${option}`)}
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
          {t('audit.empty')}
        </p>
      ) : (
        <div className="overflow-x-auto rounded border border-slate-200 bg-white">
          <table className="w-full min-w-[720px] border-collapse">
            <thead>
              <tr>
                <th className={tableHeaderClass}>{t('audit.date')}</th>
                <th className={tableHeaderClass}>{t('audit.actor')}</th>
                <th className={tableHeaderClass}>{t('audit.action')}</th>
                <th className={tableHeaderClass}>{t('audit.target')}</th>
                <th className={tableHeaderClass}>{t('audit.details')}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.id}>
                  <td className={`${tableCellClass} whitespace-nowrap`}>{formatDate(row.createdAt)}</td>
                  <td className={tableCellClass}>{row.actorNickname || t('common.unknown')}</td>
                  <td className={`${tableCellClass} whitespace-nowrap font-semibold text-slate-800`}>
                    {t(`audit.actions.${row.action}`, { defaultValue: row.action })}
                  </td>
                  <td className={`${tableCellClass} whitespace-nowrap`}>
                    {row.targetType && row.targetId != null
                      ? `${row.targetType} #${row.targetId}`
                      : t('common.notAvailable')}
                  </td>
                  <td className={`${tableCellClass} max-w-[22rem]`}>
                    {row.details || t('common.notAvailable')}
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
