import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../i18n/useLanguage'
import Modal from '../ui/Modal'

export default function LanguageModal({ open, onClose }) {
  const { t } = useTranslation(['profile', 'common'])
  const { language, languages, setLanguage } = useLanguage()

  function selectLanguage(code) {
    setLanguage(code)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('language.title')}
      description={t('language.description')}
      ariaLabel={t('language.title')}
    >
      <ul role="listbox" aria-label={t('language.title')} className="flex flex-col gap-2">
        {languages.map((option) => {
          const selected = option.code === language.code

          return (
            <li key={option.code}>
              <button
                type="button"
                role="option"
                aria-selected={selected}
                disabled={!option.available}
                onClick={() => selectLanguage(option.code)}
                className={`flex w-full items-center justify-between gap-3 rounded border px-4 py-3 text-sm font-bold transition ${
                  selected
                    ? 'border-sky-500 bg-sky-50 text-sky-700'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50'
                } ${option.available ? '' : 'cursor-not-allowed opacity-50'}`}
              >
                <span>{option.label}</span>
                {!option.available ? (
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    {t('language.comingSoon')}
                  </span>
                ) : (
                  selected && (
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      aria-hidden="true"
                    >
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )
                )}
              </button>
            </li>
          )
        })}
      </ul>
    </Modal>
  )
}
