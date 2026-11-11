import i18n from '../i18n/config'
import { getLanguage } from '../i18n/languages'

/**
 * Visual metadata only: labels are provided by i18next at render time so a
 * language switch never leaves stale English text behind.
 */
export const DIRECTION = {
  SENT: {
    key: 'SENT',
    sign: '-',
    badge: 'bg-sky-100 text-sky-700',
    amount: 'text-red-600',
  },
  RECEIVED: {
    key: 'RECEIVED',
    sign: '+',
    badge: 'bg-sky-100 text-sky-700',
    amount: 'text-green-600',
  },
  TOP_UP: {
    key: 'TOP_UP',
    sign: '+',
    badge: 'bg-sky-100 text-sky-700',
    amount: 'text-green-600',
  },
}

export const PAYMENT_TYPES = ['FRIEND_TRANSFER', 'SHOPPING', 'DONATION', 'SUBSCRIPTION']

/** Currency used for every amount in the app. Change these together. */
export const APP_CURRENCY = 'USD'
export const APP_CURRENCY_SYMBOL = '$'

function currentLocale() {
  return getLanguage(i18n.resolvedLanguage ?? i18n.language).intlLocale
}

const moneyFormatters = new Map()
const numberFormatters = new Map()

/** Locale-aware decimal formatting without the currency symbol. */
export function formatAmount(value) {
  const locale = currentLocale()
  let formatter = numberFormatters.get(locale)

  if (!formatter) {
    formatter = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
    numberFormatters.set(locale, formatter)
  }

  return formatter.format(Number(value ?? 0))
}

/**
 * Keeps the ergonomic `money.format(value)` API while resolving the formatter
 * against the active locale, so existing call sites stay untouched.
 */
export const money = {
  format(value) {
    const locale = currentLocale()
    let formatter = moneyFormatters.get(locale)

    if (!formatter) {
      formatter = new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: APP_CURRENCY,
        // Always render the plain "$", never "US$" or "USD".
        currencyDisplay: 'narrowSymbol',
      })
      moneyFormatters.set(locale, formatter)
    }

    return formatter.format(value)
  },
}

export function formatDate(value) {
  if (!value) return ''
  return new Date(value).toLocaleString(currentLocale(), {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatFullDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(currentLocale(), {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

function humanizeEnum(value) {
  if (!value) return '—'
  return value
    .toLowerCase()
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

export function formatStatus(value) {
  return i18n.t(`transactions:statuses.${value}`, { defaultValue: humanizeEnum(value) })
}

export function formatType(value) {
  return i18n.t(`payments:types.${value}`, { defaultValue: humanizeEnum(value) })
}

export function directionLabel(direction) {
  return i18n.t(`transactions:directions.${direction.key}`)
}

export function sortContacts(contacts) {
  return [...contacts].sort((a, b) =>
    a.nickname.localeCompare(b.nickname, undefined, { sensitivity: 'base' }),
  )
}

export function initials(nickname) {
  if (!nickname) return '?'
  const words = String(nickname).trim().split(/[\s._-]+/).filter(Boolean)
  if (words.length === 0) return '?'
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase()
  return `${words[0][0]}${words[1][0]}`.toUpperCase()
}

export function transactionTitle(transaction) {
  const fallbackUser = i18n.t('transactions:fallbackUser')

  if (transaction.direction === 'TOP_UP') return i18n.t('transactions:titles.topUp')
  if (transaction.direction === 'SENT') {
    return i18n.t('transactions:titles.to', {
      nickname: transaction.counterpartNickname ?? fallbackUser,
    })
  }
  return i18n.t('transactions:titles.from', {
    nickname: transaction.counterpartNickname ?? fallbackUser,
  })
}

export function transactionDetails(transaction, currentUser) {
  const direction = DIRECTION[transaction.direction] ?? DIRECTION.SENT
  const counterpartName = transaction.counterpartNickname ?? '—'
  const ownName = currentUser?.nickname ?? '—'
  const recipientName = transaction.direction === 'SENT' ? counterpartName : ownName

  return [
    { key: 'status', value: formatStatus(transaction.transactionStatus) },
    { key: 'type', value: formatType(transaction.transactionType) },
    { key: 'direction', value: directionLabel(direction) },
    { key: 'recipient', value: recipientName },
    { key: 'amount', value: formatAmount(transaction.amount) },
    { key: 'currency', value: transaction.currency ?? '—' },
    { key: 'dateTime', value: formatFullDate(transaction.transactionTime) },
  ]
}
