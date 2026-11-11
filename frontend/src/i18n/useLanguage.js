import { useTranslation } from 'react-i18next'
import { LANGUAGES, getLanguage } from './languages'

/**
 * Small adapter over i18next so components do not depend on its API directly.
 * Only languages with a complete bundle can be selected.
 */
export function useLanguage() {
  const { i18n } = useTranslation()
  const language = getLanguage(i18n.resolvedLanguage ?? i18n.language)

  function setLanguage(code) {
    const target = getLanguage(code)
    if (!target.available || target.code === language.code) return
    i18n.changeLanguage(target.code)
  }

  return {
    language,
    languageCode: language.code,
    languages: LANGUAGES,
    setLanguage,
  }
}
