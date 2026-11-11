import { useState } from 'react'
import { useTranslation } from 'react-i18next'

export default function CodeInput({ label, value, onChange, autoComplete = 'off' }) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      <div className="relative">
        <input
          className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 pr-11 text-base tracking-[0.4em] outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
          type={visible ? 'text' : 'password'}
          inputMode="numeric"
          value={value}
          onChange={onChange}
          maxLength={6}
          autoComplete={autoComplete}
          required
        />
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t('ui.hideCode') : t('ui.showCode')}
          className="absolute right-2 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
        >
          {visible ? (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
              <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
              <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
              <path d="m2 2 20 20" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  )
}
