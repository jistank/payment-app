/**
 * Canonical list of languages exposed by the UI.
 *
 * `available` means a complete translation bundle exists in `src/i18n/locales`.
 * Languages without a bundle are still listed so the roadmap is visible, but
 * they are disabled in the language selector and never offered to i18next.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', dir: 'ltr', intlLocale: 'en-GB', available: true },
  { code: 'it', label: 'Italiano', dir: 'ltr', intlLocale: 'it-IT', available: true },
  { code: 'ar', label: 'العربية', dir: 'rtl', intlLocale: 'ar-SA', available: false },
  { code: 'ru', label: 'Русский', dir: 'ltr', intlLocale: 'ru-RU', available: false },
  { code: 'zh', label: '中文', dir: 'ltr', intlLocale: 'zh-CN', available: false },
  { code: 'ja', label: '日本語', dir: 'ltr', intlLocale: 'ja-JP', available: false },
  { code: 'ko', label: '한국어', dir: 'ltr', intlLocale: 'ko-KR', available: false },
  { code: 'hi', label: 'हिन्दी', dir: 'ltr', intlLocale: 'hi-IN', available: false },
]

export const DEFAULT_LANGUAGE = 'en'

export const AVAILABLE_LANGUAGE_CODES = LANGUAGES.filter((language) => language.available).map(
  (language) => language.code,
)

/** Resolves a language tag (e.g. `it-IT`) to its canonical definition. */
export function getLanguage(code) {
  const base = String(code ?? '')
    .toLowerCase()
    .split('-')[0]

  return LANGUAGES.find((language) => language.code === base) ?? LANGUAGES[0]
}
