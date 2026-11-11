import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import ChangeProfileModal from '../../components/profile/ChangeProfileModal'
import ChargeModal from '../../components/profile/ChargeModal'
import DeleteAccountModal from '../../components/profile/DeleteAccountModal'
import LanguageModal from '../../components/profile/LanguageModal'
import PaymentCodeModal from '../../components/profile/PaymentCodeModal'
import QrCodeModal from '../../components/profile/QrCodeModal'
import ThemeModal from '../../components/profile/ThemeModal'
import { useAuth } from '../../context/AuthContext'
import { useLanguage } from '../../i18n/useLanguage'
import { formatFullDate } from '../../lib/formatters'

function MeMenuItem({ label, description, onClick, danger = false, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-3 rounded border bg-white px-4 py-3.5 text-left transition focus:outline-none focus:ring-4 ${
        danger
          ? 'border-red-200 hover:border-red-300 hover:bg-red-50 focus:ring-red-100'
          : 'border-slate-200 hover:border-sky-200 hover:bg-sky-50/40 focus:ring-sky-100'
      }`}
    >
      <span
        className={`grid h-10 w-10 shrink-0 place-items-center rounded ${
          danger ? 'bg-red-100 text-red-600' : 'bg-sky-100 text-sky-700'
        }`}
      >
        {children}
      </span>
      <span className="min-w-0 flex-1">
        <span className={`block text-sm font-extrabold ${danger ? 'text-red-700' : 'text-slate-900'}`}>
          {label}
        </span>
        <span className="mt-0.5 block text-xs text-slate-500">{description}</span>
      </span>
      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0 text-slate-400">
        <path d="m9 18 6-6-6-6" />
      </svg>
    </button>
  )
}

export default function MePage() {
  const { t } = useTranslation(['app', 'profile'])
  const { user, theme, handleLogout } = useAuth()
  const { language } = useLanguage()
  const navigate = useNavigate()
  const [meModal, setMeModal] = useState(null)

  function handleDeleted() {
    setMeModal(null)
    handleLogout()
    navigate('/payment/auth', { replace: true })
  }

  const accountRows = [
    ['nickname', user.nickname],
    ['email', user.email],
    ['accountType', user.business ? t('me.business') : t('me.personal')],
    ['memberSince', formatFullDate(user.createdAt)],
  ]

  const themeMode = t(`profile:theme.${theme}`)

  return (
    <>
      <section>
        <header className="mb-5 sm:mb-6">
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 sm:text-2xl">
            {t('me.title')}
          </h1>
        </header>

        <div className="rounded border border-slate-200 bg-white p-5 shadow-md shadow-slate-200 sm:p-6">
          <h2 className="text-sm font-extrabold text-slate-900">{t('me.accountInformation')}</h2>
          <dl className="mt-2 divide-y divide-slate-100">
            {accountRows.map(([key, value]) => (
              <div key={key} className="flex items-start justify-between gap-4 py-3">
                <dt className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {t(`me.${key}`)}
                </dt>
                <dd className="m-0 max-w-[60%] break-words text-right text-sm font-medium text-slate-800">
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <div className="mt-4 flex flex-col gap-2.5">
          <MeMenuItem
            label={t('me.charge')}
            description={t('me.chargeDescription')}
            onClick={() => setMeModal('charge')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
              <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
              <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
            </svg>
          </MeMenuItem>

          <MeMenuItem
            label={t('me.changePassword')}
            description={t('me.changePasswordDescription')}
            onClick={() => setMeModal('change')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </MeMenuItem>

          <MeMenuItem
            label={t('me.qr')}
            description={t('me.qrDescription')}
            onClick={() => setMeModal('qr')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM21 14v3M14 21h3M18 21h3v-3" />
            </svg>
          </MeMenuItem>

          <MeMenuItem
            label={t('me.theme')}
            description={t('me.themeCurrent', { mode: themeMode })}
            onClick={() => setMeModal('theme')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
            </svg>
          </MeMenuItem>

          <MeMenuItem
            label={t('me.language')}
            description={t('me.languageCurrent', { language: language.label })}
            onClick={() => setMeModal('language')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <path d="M2 12h20" />
              <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
            </svg>
          </MeMenuItem>

          <MeMenuItem
            label={t('me.changeCode')}
            description={
              user.paymentCodeConfigured
                ? t('me.changeCodeDescription')
                : t('me.setCodeDescription')
            }
            onClick={() => setMeModal('code')}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="3" y="11" width="18" height="11" rx="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </MeMenuItem>

          <MeMenuItem
            label={t('me.deleteAccount')}
            description={t('me.deleteAccountDescription')}
            onClick={() => setMeModal('delete')}
            danger
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
            </svg>
          </MeMenuItem>
        </div>
      </section>

      <ChangeProfileModal open={meModal === 'change'} onClose={() => setMeModal(null)} />
      <ChargeModal open={meModal === 'charge'} onClose={() => setMeModal(null)} />
      <QrCodeModal open={meModal === 'qr'} onClose={() => setMeModal(null)} />
      <ThemeModal open={meModal === 'theme'} onClose={() => setMeModal(null)} />
      <LanguageModal open={meModal === 'language'} onClose={() => setMeModal(null)} />
      <PaymentCodeModal open={meModal === 'code'} onClose={() => setMeModal(null)} />
      <DeleteAccountModal
        open={meModal === 'delete'}
        onClose={() => setMeModal(null)}
        onDeleted={handleDeleted}
      />
    </>
  )
}
