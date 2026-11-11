import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'

export default function LogoutConfirmModal({ open, onCancel, onConfirm }) {
  const { t } = useTranslation('profile')

  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={t('logout.title')}
      description={t('logout.description')}
      hideClose
    >
      <div className="mt-5 flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded border border-slate-300 bg-white py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50 focus:outline-none focus:ring-4 focus:ring-slate-100"
        >
          {t('actions.cancel')}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="flex-1 rounded bg-red-500 py-3 text-sm font-bold text-white transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200"
        >
          {t('logout.confirm')}
        </button>
      </div>
    </Modal>
  )
}
