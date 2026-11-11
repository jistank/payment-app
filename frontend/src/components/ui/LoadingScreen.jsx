import { useTranslation } from 'react-i18next'

export default function LoadingScreen({ label }) {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#e9ecf5]">
      <p className="text-sm text-slate-500">{label ?? t('ui.loading')}</p>
    </div>
  )
}
