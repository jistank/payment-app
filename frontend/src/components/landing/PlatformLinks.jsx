import { useTranslation } from 'react-i18next'
import { ContactIcon, HelpIcon, NewsroomIcon } from './icons'

const PLATFORMS = [
  { id: 'contact', icon: ContactIcon },
  { id: 'help', icon: HelpIcon },
  { id: 'newsroom', icon: NewsroomIcon },
]

const ICON_CLASSNAME = 'h-8 w-8 max-[700px]:h-[26px] max-[700px]:w-[26px]'

export default function PlatformLinks() {
  const { t } = useTranslation('landing')

  return (
    <div className="relative z-[2] flex flex-wrap justify-center gap-6">
      {PLATFORMS.map(({ id, icon: Icon }) => (
        <a
          key={id}
          href="#"
          className="flex h-[110px] w-[110px] cursor-pointer flex-col items-center justify-center gap-2 rounded-full bg-white/[0.12] text-white no-underline transition-[background-color,translate] duration-300 hover:-translate-y-[3px] hover:bg-white/[0.22] max-[700px]:h-[90px] max-[700px]:w-[90px]"
        >
          <Icon className={ICON_CLASSNAME} />
          <span className="text-[13px] font-normal">{t(`platforms.${id}`)}</span>
        </a>
      ))}
    </div>
  )
}
