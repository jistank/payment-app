import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { dangerButtonClass, primaryButtonClass, secondaryButtonClass } from './adminStyles'

export default function AdminConfirmModal({
  open,
  title,
  description,
  confirmLabel,
  danger = false,
  submitting = false,
  onCancel,
  onConfirm,
}) {
  const { t } = useTranslation('admin')

  return (
    <Modal
      open={open}
      onClose={submitting ? undefined : onCancel}
      title={title}
      description={description}
      ariaLabel={title}
    >
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          disabled={submitting}
          className={secondaryButtonClass}
        >
          {t('confirm.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          disabled={submitting}
          className={danger ? dangerButtonClass : primaryButtonClass}
        >
          {submitting ? t('common.loading') : (confirmLabel ?? t('confirm.confirm'))}
        </button>
      </div>
    </Modal>
  )
}
