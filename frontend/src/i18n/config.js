import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import { AVAILABLE_LANGUAGE_CODES, DEFAULT_LANGUAGE, getLanguage } from './languages'
import { NAMESPACES } from './namespaces'

import enApp from './locales/en/app.json'
import enAuth from './locales/en/auth.json'
import enCommon from './locales/en/common.json'
import enLanding from './locales/en/landing.json'
import enPayments from './locales/en/payments.json'
import enProfile from './locales/en/profile.json'
import enTransactions from './locales/en/transactions.json'
import enAdmin from './locales/en/admin.json'

import itApp from './locales/it/app.json'
import itAuth from './locales/it/auth.json'
import itCommon from './locales/it/common.json'
import itLanding from './locales/it/landing.json'
import itPayments from './locales/it/payments.json'
import itProfile from './locales/it/profile.json'
import itTransactions from './locales/it/transactions.json'
import itAdmin from './locales/it/admin.json'

const resources = {
  en: {
    common: enCommon,
    landing: enLanding,
    auth: enAuth,
    app: enApp,
    payments: enPayments,
    transactions: enTransactions,
    profile: enProfile,
    admin: enAdmin,
  },
  it: {
    common: itCommon,
    landing: itLanding,
    auth: itAuth,
    app: itApp,
    payments: itPayments,
    transactions: itTransactions,
    profile: itProfile,
    admin: itAdmin,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    supportedLngs: AVAILABLE_LANGUAGE_CODES,
    fallbackLng: DEFAULT_LANGUAGE,
    defaultNS: 'common',
    fallbackNS: 'common',
    ns: NAMESPACES,
    load: 'languageOnly',
    initImmediate: false,
    returnNull: false,
    interpolation: {
      // React already escapes interpolated values.
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
    detection: {
      // `?lng=it` makes localized links shareable; the choice is then persisted.
      order: ['querystring', 'localStorage', 'navigator'],
      lookupQuerystring: 'lng',
      lookupLocalStorage: 'qpay_language',
      caches: ['localStorage'],
      excludeCacheFor: ['cimode'],
    },
  })

function applyDocumentLanguage(language) {
  if (typeof document === 'undefined') return

  const { code, dir } = getLanguage(language)
  document.documentElement.lang = code
  document.documentElement.dir = dir
}

i18n.on('languageChanged', applyDocumentLanguage)
applyDocumentLanguage(i18n.resolvedLanguage ?? i18n.language ?? DEFAULT_LANGUAGE)

export default i18n
