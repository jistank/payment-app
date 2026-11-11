import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLanguage } from '../../i18n/useLanguage'

const TRIGGER_STYLES = {
  auth: 'flex items-center gap-1.5 text-sm font-medium text-gray-700 transition hover:text-sky-600',
  landing:
    'flex items-center gap-1.5 text-[rgba(255,255,255,0.85)] transition-colors duration-200 hover:text-white',
}

export default function LanguageSelector({ variant = 'auth' }) {
  const { t } = useTranslation()
  const { language, languages, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setOpen(false)
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  function selectLanguage(code) {
    setLanguage(code)
    setOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('language.select', { language: language.label })}
        className={TRIGGER_STYLES[variant] ?? TRIGGER_STYLES.auth}
      >
        {variant === 'landing' && <span aria-hidden="true">🌐</span>}
        <span>{language.label}</span>
        <svg
          viewBox="0 0 24 24"
          width="14"
          height="14"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className={`transition-transform ${open ? 'rotate-180' : ''}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t('language.list')}
          className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded border border-gray-200 bg-[#ffffff] py-1 shadow-lg"
        >
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
                  className={`flex w-full items-center justify-between gap-2 px-4 py-2 text-left text-sm transition ${
                    option.available
                      ? 'hover:bg-sky-50'
                      : 'cursor-not-allowed text-gray-400'
                  } ${
                    selected ? 'font-semibold text-sky-600' : option.available ? 'text-gray-700' : ''
                  }`}
                >
                  <span>{option.label}</span>
                  {!option.available ? (
                    <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                      {t('language.comingSoon')}
                    </span>
                  ) : (
                    selected && (
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <path d="M20 6 9 17l-5-5" />
                      </svg>
                    )
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
