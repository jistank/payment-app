import { Fragment } from 'react'
import { useTranslation } from 'react-i18next'
import SocialLinks from './SocialLinks'

const FOOTER_LINK_KEYS = ['about', 'privacy', 'cookie', 'terms']

export default function LandingFooter() {
  const { t } = useTranslation('landing')

  return (
    <footer className="bg-[#2eaa6e] px-5 py-5 text-center text-white">
      <div className="flex flex-col items-center justify-center gap-1.5 md:flex-row md:flex-wrap md:gap-x-5">
        <nav className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[12px]">
          {FOOTER_LINK_KEYS.map((key, index) => (
            <Fragment key={key}>
              {index > 0 && <span className="select-none text-white/40">|</span>}
              <a
                href="#"
                className="text-white/85 no-underline transition-colors duration-200 hover:text-white"
              >
                {t(`footer.${key}`)}
              </a>
            </Fragment>
          ))}
        </nav>

        <span className="text-[12px] text-white/70">{t('footer.copyright')}</span>
      </div>

      <SocialLinks />
    </footer>
  )
}
