import { useTranslation } from 'react-i18next'
import { formatFullDate, initials, money } from '../../lib/formatters'
import Modal from '../ui/Modal'
import {
  primaryButtonClass,
  roleBadgeClass,
  secondaryButtonClass,
  statusBadgeClass,
} from './adminStyles'

export default function AdminUserDetailModal({ open, user, onClose, onTopUp }) {
  const { t } = useTranslation('admin')

  const rows = [
    ['role', t(`roles.${user?.role ?? 'USER'}`, { defaultValue: user?.role ?? '—' })],
    ['accountType', user?.business ? t('detail.business') : t('detail.personal')],
    ['balance', money.format(Number(user?.balance ?? 0))],
    [
      'paymentCode',
      user?.paymentCodeConfigured ? t('users.paymentCodeYes') : t('users.paymentCodeNo'),
    ],
    ['createdAt', formatFullDate(user?.createdAt)],
  ]

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('detail.title')}
      description={user?.nickname}
      ariaLabel={t('detail.title')}
      size="md"
    >
      <div className="mb-4 flex items-center gap-3 rounded border border-slate-200 bg-slate-50 px-4 py-3">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded bg-sky-100 text-sm font-extrabold text-sky-700">
          {initials(user?.nickname)}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-extrabold text-slate-900">{user?.nickname}</p>
          <p className="truncate text-xs text-slate-500">{user?.email}</p>
        </div>
        <span className={`ml-auto shrink-0 ${statusBadgeClass(user?.suspended ? 'SUSPENDED' : 'ACTIVE')}`}>
          {t(user?.suspended ? 'statuses.SUSPENDED' : 'statuses.ACTIVE')}
        </span>
      </div>

      <dl className="divide-y divide-slate-100">
        <div className="flex items-start justify-between gap-4 py-2.5">
          <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {t('detail.email')}
          </dt>
          <dd className="m-0 max-w-[60%] break-words text-right text-sm font-medium text-slate-800">
            {user?.email ?? '—'}
          </dd>
        </div>
        {rows.map(([key, value]) => (
          <div key={key} className="flex items-start justify-between gap-4 py-2.5">
            <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              {t(`detail.${key}`)}
            </dt>
            <dd className="m-0 max-w-[60%] break-words text-right text-sm font-medium text-slate-800">
              {value}
            </dd>
          </div>
        ))}
      </dl>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className={`${roleBadgeClass(user?.role)}`}>
          {t(`roles.${user?.role ?? 'USER'}`, { defaultValue: user?.role ?? '—' })}
        </span>
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={onClose} className={secondaryButtonClass}>
            {t('detail.close')}
          </button>
          <button type="button" onClick={() => onTopUp?.(user)} className={primaryButtonClass}>
            {t('users.topUp')}
          </button>
        </div>
      </div>
    </Modal>
  )
}
