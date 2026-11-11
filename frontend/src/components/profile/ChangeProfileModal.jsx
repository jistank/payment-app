import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { changePassword } from '../../api'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import { ErrorMessage, NoticeMessage } from '../ui/Messages'

export default function ChangeProfileModal({ open, onClose }) {
  const { t } = useTranslation('profile')
  const { token, refreshUser, handleTokenRefresh } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)

  useEffect(() => {
    if (!open) return
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setNotice('')
    setSubmitting(false)
    submittingRef.current = false
  }, [open])

  async function handleSubmit(event) {
    event.preventDefault()
    if (submittingRef.current) return
    setError('')
    setNotice('')

    if (newPassword !== confirmPassword) {
      setError(t('changePassword.errors.mismatch'))
      return
    }

    submittingRef.current = true
    setSubmitting(true)

    try {
      const data = await changePassword(token, { currentPassword, newPassword })
      if (data?.token) {
        handleTokenRefresh(data.token, data.user)
      } else {
        refreshUser()
      }
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setNotice(t('changePassword.success'))
    } catch (err) {
      setError(err.message || t('changePassword.errors.change'))
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('changePassword.title')}
      description={t('changePassword.description')}
      size="md"
      ariaLabel={t('changePassword.title')}
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('changePassword.current')}</span>
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            autoComplete="current-password"
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('changePassword.new')}</span>
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={20}
            required
          />
        </label>

        <label className="flex flex-col gap-1.5 text-sm font-medium text-slate-700">
          <span>{t('changePassword.confirm')}</span>
          <input
            className="w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            autoComplete="new-password"
            minLength={8}
            maxLength={20}
            required
          />
        </label>

        <ErrorMessage>{error}</ErrorMessage>
        <NoticeMessage>{notice}</NoticeMessage>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('ui.pleaseWait') : t('changePassword.submit')}
        </button>
      </form>
    </Modal>
  )
}
