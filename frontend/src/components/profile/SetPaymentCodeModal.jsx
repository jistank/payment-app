import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { updatePaymentCode } from '../../api'
import { useAuth } from '../../context/AuthContext'
import CodeInput from '../ui/CodeInput'
import Modal from '../ui/Modal'
import { ErrorMessage } from '../ui/Messages'

function onlyDigits(value) {
  return value.replace(/\D/g, '').slice(0, 6)
}

export default function SetPaymentCodeModal({ open }) {
  const { t } = useTranslation('profile')
  const { token, refreshUser } = useAuth()
  const [code, setCode] = useState('')
  const [confirmCode, setConfirmCode] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!open) return
    setCode('')
    setConfirmCode('')
    setError('')
    setSubmitting(false)
  }, [open])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError(t('setCode.errors.length'))
      return
    }

    if (code !== confirmCode) {
      setError(t('setCode.errors.mismatch'))
      return
    }

    setSubmitting(true)

    try {
      await updatePaymentCode(token, { currentCode: null, newCode: code })
      await refreshUser()
    } catch (err) {
      setError(err.message || t('setCode.errors.set'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      title={t('setCode.title')}
      description={t('setCode.description')}
      zIndex={80}
      hideClose
      ariaLabel={t('setCode.title')}
    >
      <form className="flex flex-col gap-3" onSubmit={handleSubmit}>
        <CodeInput
          label={t('setCode.code')}
          value={code}
          onChange={(event) => setCode(onlyDigits(event.target.value))}
          autoComplete="new-password"
        />

        <CodeInput
          label={t('setCode.confirm')}
          value={confirmCode}
          onChange={(event) => setConfirmCode(onlyDigits(event.target.value))}
          autoComplete="new-password"
        />

        <ErrorMessage>{error}</ErrorMessage>

        <button
          type="submit"
          disabled={submitting}
          className="rounded bg-sky-500 py-3 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting ? t('ui.pleaseWait') : t('setCode.submit')}
        </button>
      </form>
    </Modal>
  )
}
