import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

const SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
}

const ALIGNMENTS = {
  center: 'items-center',
  sheet: 'items-end sm:items-center',
}

const PANEL_ALIGNMENTS = {
  center: 'rounded',
  sheet: 'rounded-t sm:rounded',
}

/**
 * Shared modal shell. Handles the overlay, Escape key and the repeated
 * title/description/close-button header.
 */
export default function Modal({
  open,
  title,
  description,
  children,
  onClose,
  size = 'sm',
  align = 'center',
  zIndex = 60,
  hideClose = false,
  ariaLabel,
}) {
  const { t } = useTranslation()

  useEffect(() => {
    if (!open || !onClose) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onClose])

  if (!open) return null

  const canClose = Boolean(onClose) && !hideClose

  return (
    <div
      className={`fixed inset-0 flex justify-center bg-slate-900/50 p-0 sm:p-4 ${ALIGNMENTS[align]}`}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel ?? title}
      onClick={(event) => {
        if (event.target === event.currentTarget && onClose) onClose()
      }}
    >
      <div
        className={`max-h-[90vh] w-full overflow-y-auto bg-white p-5 shadow-2xl sm:p-6 ${
          SIZES[size] ?? SIZES.sm
        } ${PANEL_ALIGNMENTS[align]}`}
      >
        {(title || description || canClose) && (
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              {title && (
                <h2 className="text-lg font-extrabold tracking-tight text-slate-900">{title}</h2>
              )}
              {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
            </div>
            {canClose && (
              <button
                type="button"
                onClick={onClose}
                aria-label={t('actions.close')}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M18 6 6 18M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}

        {children}
      </div>
    </div>
  )
}
