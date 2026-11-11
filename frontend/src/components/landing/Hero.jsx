import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import LanguageSelector from '../ui/LanguageSelector'
import PlatformLinks from './PlatformLinks'

export default function Hero() {
  const { t } = useTranslation('landing')

  return (
    <section className="relative overflow-hidden bg-[#2eaa6e] px-5 pb-[120px] pt-10 text-center text-white after:absolute after:-bottom-0.5 after:-left-[5%] after:h-[100px] after:w-[110%] after:rounded-t-[50%] after:bg-[#f5f6fa] after:content-[''] max-[700px]:pb-[90px]">
      <nav className="absolute right-[30px] top-5 z-[2] flex items-center gap-2 text-[14px] max-[700px]:right-[15px] max-[700px]:top-[15px]">
        <Link
          to="/payment/auth"
          className="inline-block rounded bg-[#4fc3f7] px-[22px] py-2 font-medium text-white no-underline transition-[background-color,translate] duration-200 hover:-translate-y-px hover:bg-[#29b6f6] hover:text-white"
        >
          {t('nav.login')}
        </Link>
        <span className="text-[rgba(255,255,255,0.5)]">|</span>
        <LanguageSelector variant="landing" />
      </nav>

      <div className="mb-6 mt-10 flex items-center justify-center gap-[14px]">
        <span className="text-[42px] font-light tracking-[-0.5px] max-[700px]:text-[32px]">
          Qpay
        </span>
      </div>

      <p className="mb-[50px] text-[18px] font-light leading-[1.7] opacity-95">
        {t('hero.subtitle')}
      </p>

      <PlatformLinks />
    </section>
  )
}
