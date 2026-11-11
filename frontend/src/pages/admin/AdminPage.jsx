import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getAdminStats } from '../../api'
import AdminAudit from '../../components/admin/AdminAudit'
import AdminPaymentRequests from '../../components/admin/AdminPaymentRequests'
import AdminTransactions from '../../components/admin/AdminTransactions'
import AdminUsers from '../../components/admin/AdminUsers'
import { primaryButtonClass } from '../../components/admin/adminStyles'
import { ErrorMessage } from '../../components/ui/Messages'
import { useAuth } from '../../context/AuthContext'
import { money } from '../../lib/formatters'

const TABS = ['users', 'transactions', 'requests', 'audit']

const STAT_CARDS = [
  { key: 'totalUsers', icon: 'users' },
  { key: 'activeUsers', icon: 'check' },
  { key: 'suspendedUsers', icon: 'ban' },
  { key: 'totalTransactions', icon: 'transfer' },
  { key: 'transactionVolume', icon: 'chart', money: true },
  { key: 'topUpVolume', icon: 'wallet', money: true },
  { key: 'pendingRequests', icon: 'clock' },
  { key: 'auditEvents', icon: 'list' },
]

function StatIcon({ name }) {
  const common = {
    viewBox: '0 0 24 24',
    width: 18,
    height: 18,
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }

  switch (name) {
    case 'check':
      return (
        <svg {...common}>
          <path d="M20 6 9 17l-5-5" />
        </svg>
      )
    case 'ban':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="m4.9 4.9 14.2 14.2" />
        </svg>
      )
    case 'transfer':
      return (
        <svg {...common}>
          <path d="M7 7h11l-3-3M17 17H6l3 3" />
          <path d="M18 7l-3 3M6 17l3-3" />
        </svg>
      )
    case 'chart':
      return (
        <svg {...common}>
          <path d="M3 3v18h18" />
          <path d="m7 14 4-4 3 3 5-6" />
        </svg>
      )
    case 'wallet':
      return (
        <svg {...common}>
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      )
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="10" />
          <path d="M12 6v6l4 2" />
        </svg>
      )
    case 'list':
      return (
        <svg {...common}>
          <path d="M8 6h13M8 12h13M8 18h13" />
          <path d="M3 6h.01M3 12h.01M3 18h.01" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      )
  }
}

function formatCount(value) {
  return Number(value ?? 0).toLocaleString()
}

export default function AdminPage() {
  const { t } = useTranslation('admin')
  const { token } = useAuth()

  const [tab, setTab] = useState('users')
  const [stats, setStats] = useState(null)
  const [statsError, setStatsError] = useState('')
  const [statsLoading, setStatsLoading] = useState(true)
  const [refreshKey, setRefreshKey] = useState(0)

  const loadStats = useCallback(async () => {
    setStatsLoading(true)
    setStatsError('')
    try {
      setStats(await getAdminStats(token))
    } catch (err) {
      setStatsError(err.message || t('stats.title'))
    } finally {
      setStatsLoading(false)
    }
  }, [token, t])

  useEffect(() => {
    loadStats()
  }, [loadStats])

  function refresh() {
    setRefreshKey((value) => value + 1)
    loadStats()
  }

  return (
    <section>
      <header className="mb-5 flex flex-wrap items-start justify-between gap-3 sm:mb-6">
        <div>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {t('title')}
          </h1>
          <p className="mt-1 text-sm text-slate-500">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={refresh}
          disabled={statsLoading}
          className={primaryButtonClass}
        >
          {statsLoading ? t('common.loading') : t('refresh')}
        </button>
      </header>

      <ErrorMessage className="mb-4">{statsError}</ErrorMessage>

      <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="rounded border border-slate-200 bg-white p-4 shadow-sm shadow-slate-100 sm:p-5"
          >
            <span className="grid h-9 w-9 place-items-center rounded bg-sky-100 text-sky-700">
              <StatIcon name={card.icon} />
            </span>
            <p className="mt-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {t(`stats.${card.key}`)}
            </p>
            <strong className="mt-0.5 block text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl">
              {card.money
                ? money.format(Number(stats?.[card.key] ?? 0))
                : formatCount(stats?.[card.key])}
            </strong>
          </div>
        ))}
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {TABS.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            aria-pressed={tab === key}
            className={`rounded px-3 py-2 text-sm font-bold transition focus:outline-none focus:ring-4 focus:ring-sky-100 ${
              tab === key
                ? 'bg-sky-500 text-white'
                : 'border border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            {t(`tabs.${key}`)}
          </button>
        ))}
      </div>

      <div className="mt-5">
        {tab === 'users' && (
          <AdminUsers token={token} refreshKey={refreshKey} onDataChanged={loadStats} />
        )}
        {tab === 'transactions' && <AdminTransactions token={token} refreshKey={refreshKey} />}
        {tab === 'requests' && <AdminPaymentRequests token={token} refreshKey={refreshKey} />}
        {tab === 'audit' && <AdminAudit token={token} refreshKey={refreshKey} />}
      </div>
    </section>
  )
}
