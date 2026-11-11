import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import QRCode from 'qrcode'
import { useAuth } from '../../context/AuthContext'
import Modal from '../ui/Modal'
import { ErrorMessage } from '../ui/Messages'

const QR_OPTIONS = {
  width: 260,
  margin: 1,
  color: { dark: '#1e1b4b', light: '#ffffff' },
}

/**
 * Shows the user's permanent receive QR. The payload lives on the account and
 * never changes; only the rendered image is generated here, in the browser.
 */
export default function QrCodeModal({ open, onClose }) {
  const { t } = useTranslation('profile')
  const { user } = useAuth()
  const [image, setImage] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return undefined

    const payload = user?.qrReceive
    setImage('')
    setError('')

    if (!payload) {
      setLoading(false)
      return undefined
    }

    let cancelled = false
    setLoading(true)

    QRCode.toDataURL(payload, QR_OPTIONS)
      .then((url) => {
        if (!cancelled) setImage(url)
      })
      .catch((err) => {
        if (!cancelled) setError(err.message || t('qr.error'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [open, user?.qrReceive, t])

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={t('qr.title')}
      description={t('qr.description')}
      size="lg"
      ariaLabel={t('qr.title')}
    >
      <ErrorMessage>{error}</ErrorMessage>

      <div className="flex flex-col items-center gap-3 rounded border border-slate-200 bg-slate-50 p-5 text-center">
        {loading && !image ? (
          <p className="grid h-56 w-56 place-items-center text-xs text-slate-500">
            {t('qr.generating')}
          </p>
        ) : image ? (
          <img
            src={image}
            alt={t('qr.alt')}
            width="260"
            height="260"
            className="h-56 w-56 rounded"
            style={{ backgroundColor: '#ffffff' }}
          />
        ) : (
          <div
            className="grid h-56 w-56 place-items-center rounded text-xs text-slate-400"
            style={{ backgroundColor: '#ffffff' }}
          >
            {t('qr.unavailable')}
          </div>
        )}

        <p className="text-sm font-extrabold text-slate-900">@{user?.nickname}</p>
        <p className="text-xs text-slate-500">{t('qr.receiveDescription')}</p>
      </div>
    </Modal>
  )
}
