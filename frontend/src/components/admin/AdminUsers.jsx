import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  deleteAdminUser,
  reactivateAdminUser,
  searchAdminUsers,
  suspendAdminUser,
} from '../../api'
import useDebouncedValue from '../../hooks/useDebouncedValue'
import { formatFullDate, initials, money } from '../../lib/formatters'
import { ErrorMessage } from '../ui/Messages'
import AdminConfirmModal from './AdminConfirmModal'
import AdminTopUpModal from './AdminTopUpModal'
import AdminUserDetailModal from './AdminUserDetailModal'
import {
  dangerButtonClass,
  inputClass,
  primaryButtonClass,
  roleBadgeClass,
  secondaryButtonClass,
  selectClass,
  statusBadgeClass,
  successButtonClass,
  warningButtonClass,
} from './adminStyles'

const STATUS_OPTIONS = ['ALL', 'ACTIVE', 'SUSPENDED']

function mergeUser(users, updated) {
  return users.map((user) => (user.id === updated.id ? updated : user))
}

export default function AdminUsers({ token, refreshKey, onDataChanged }) {
  const { t } = useTranslation('admin')

  const [query, setQuery] = useState('')
  const debouncedQuery = useDebouncedValue(query.trim(), 300)
  const [status, setStatus] = useState('ALL')

  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')

  const [selectedUser, setSelectedUser] = useState(null)
  const [topUpUser, setTopUpUser] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')

    searchAdminUsers(token, { query: debouncedQuery, status })
      .then((rows) => {
        if (!cancelled) setUsers(rows)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t('users.errors.load'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, debouncedQuery, status, refreshKey])

  function handleUpdated(updated) {
    setUsers((current) => mergeUser(current, updated))
    setSelectedUser((current) => (current?.id === updated.id ? updated : current))
    onDataChanged?.()
  }

  function handleTopUpDone(updated) {
    if (!updated) return
    setTopUpUser(updated)
    handleUpdated(updated)
  }

  async function runConfirmAction() {
    if (!confirm || submitting) return

    setSubmitting(true)
    setActionError('')

    try {
      if (confirm.type === 'suspend') {
        handleUpdated(await suspendAdminUser(token, confirm.user.id))
      } else if (confirm.type === 'reactivate') {
        handleUpdated(await reactivateAdminUser(token, confirm.user.id))
      } else if (confirm.type === 'delete') {
        await deleteAdminUser(token, confirm.user.id)
        setUsers((current) => current.filter((user) => user.id !== confirm.user.id))
        setSelectedUser((current) => (current?.id === confirm.user.id ? null : current))
        onDataChanged?.()
      }
      setConfirm(null)
    } catch (err) {
      setActionError(err.message || t(`users.errors.${confirm.type}`))
      setConfirm(null)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight text-slate-900">
            {t('users.title')}
          </h2>
          {!loading && (
            <p className="mt-0.5 text-xs text-slate-500">{t('users.count', { count: users.length })}</p>
          )}
        </div>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem]">
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('filters.search')}</span>
          <input
            className={inputClass}
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
      <ErrorMessage className="mb-3">{actionError}</ErrorMessage>

      {loading ? (
        <p className="text-sm text-slate-500">{t('common.loading')}</p>
      ) : users.length === 0 ? (
        <p className="rounded border border-dashed border-slate-300 bg-white px-4 py-8 text-center text-sm text-slate-500">
          {t('users.empty')}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {users.map((user) => (
            <li key={user.id} className="rounded border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100">
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-sky-100 text-sm font-extrabold text-sky-700">
                  {initials(user.nickname)}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <p className="truncate text-sm font-extrabold text-slate-900">{user.nickname}</p>
                    <span className={roleBadgeClass(user.role)}>
                      {t(`roles.${user.role}`, { defaultValue: user.role })}
                    </span>
                    <span className={statusBadgeClass(user.suspended ? 'SUSPENDED' : 'ACTIVE')}>
                      {t(user.suspended ? 'statuses.SUSPENDED' : 'statuses.ACTIVE')}
                    </span>
                  </div>
                  <p className="truncate text-xs text-slate-500">{user.email}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {t('users.balance')}: <strong className="text-slate-700">{money.format(Number(user.balance ?? 0))}</strong>
                    {' · '}
                    {t('users.joined')}: {formatFullDate(user.createdAt)}
                  </p>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUser(user)}
                  className={secondaryButtonClass}
                >
                  {t('users.view')}
                </button>
                <button
                  type="button"
                  onClick={() => setTopUpUser(user)}
                  className={primaryButtonClass}
                >
                  {t('users.topUp')}
                </button>

                {user.role === 'ADMIN' ? (
                  <span className="text-xs text-slate-400">{t('users.locked')}</span>
                ) : user.suspended ? (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'reactivate', user })}
                    className={successButtonClass}
                  >
                    {t('users.reactivate')}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'suspend', user })}
                    className={warningButtonClass}
                  >
                    {t('users.suspend')}
                  </button>
                )}

                {user.role !== 'ADMIN' && (
                  <button
                    type="button"
                    onClick={() => setConfirm({ type: 'delete', user })}
                    className={`${dangerButtonClass} ml-auto`}
                  >
                    {t('users.delete')}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      <AdminUserDetailModal
        open={Boolean(selectedUser)}
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
        onTopUp={(user) => {
          setSelectedUser(null)
          setTopUpUser(user)
        }}
      />

      <AdminTopUpModal
        open={Boolean(topUpUser)}
        token={token}
        user={topUpUser}
        onClose={() => setTopUpUser(null)}
        onDone={handleTopUpDone}
      />

      <AdminConfirmModal
        open={Boolean(confirm)}
        title={
          confirm
            ? t(`confirm.${confirm.type}Title`, { nickname: confirm.user?.nickname })
            : ''
        }
        description={
          confirm
            ? t(`confirm.${confirm.type}Description`, { nickname: confirm.user?.nickname })
            : ''
        }
        confirmLabel={confirm ? t(`confirm.confirm`) : ''}
        danger={confirm?.type === 'delete'}
        submitting={submitting}
        onCancel={() => setConfirm(null)}
        onConfirm={runConfirmAction}
      />
    </section>
  )
}
