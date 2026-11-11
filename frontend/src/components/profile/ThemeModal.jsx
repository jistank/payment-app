import { useTranslation } from 'react-i18next'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'

const OPTIONS = ['light', 'dark']

export default function ThemeModal({ open, onClose }) {
  const { t } = useTranslation('profile')
  const { theme, setTheme } = useAuth()

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('theme.title')}
      description={t('theme.description')}
      ariaLabel={t('theme.title')}
    >
      <div className="flex flex-col gap-2">
        {OPTIONS.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setTheme(value)}
            className={`flex items-center justify-between rounded border px-4 py-3 text-sm font-bold transition ${
              theme === value
                ? 'border-sky-500 bg-sky-50 text-sky-700'
                : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
            }`}
          >
            <span>{t(`theme.${value}`)}</span>
            {theme === value && (
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            )}
          </button>
        ))}
      </div>
    </Modal>
  )
}
