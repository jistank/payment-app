import { useTranslation } from 'react-i18next'
import Modal from '../ui/Modal'
import { ErrorMessage } from '../ui/Messages'

export default function ContactFormModal({
  open,
  title,
  description,
  nickname,
  onNicknameChange,
  onSubmit,
  onClose,
  error,
  submitting,
  submitLabel,
  submittingLabel,
  danger = false,
}) {
  const { t } = useTranslation('app')

  return (
    <Modal open={open} onClose={onClose} title={title} description={description}>
      <form className="flex flex-col gap-3" onSubmit={onSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('contacts.form.nicknameLabel')}</span>
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="text"
            name="nickname"
            value={nickname}
            onChange={onNicknameChange}
            minLength={3}
            maxLength={50}
            placeholder={t('contacts.form.nicknamePlaceholder')}
            autoFocus
            required
          />
        </label>

        <ErrorMessage>{error}</ErrorMessage>

        <button
          type="submit"
          disabled={submitting}
          className={`rounded py-3 text-sm font-bold text-white transition focus:outline-none focus:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
            danger
              ? 'bg-red-600 hover:bg-red-700 focus:ring-red-200'
              : 'bg-sky-500 hover:bg-sky-600 focus:ring-sky-200'
          }`}
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
      </form>
    </Modal>
  )
}
