/**
 * Shared Tailwind class strings for the admin area. Keeping them in one file
 * makes the new screens match the existing azure/slate design language.
 */

export const primaryButtonClass =
  'rounded bg-sky-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-sky-600 focus:outline-none focus:ring-4 focus:ring-sky-200 disabled:cursor-not-allowed disabled:opacity-60'

export const secondaryButtonClass =
  'rounded border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:border-sky-200 hover:bg-sky-50 focus:outline-none focus:ring-4 focus:ring-sky-100 disabled:cursor-not-allowed disabled:opacity-60'

export const dangerButtonClass =
  'rounded bg-red-500 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-red-600 focus:outline-none focus:ring-4 focus:ring-red-200 disabled:cursor-not-allowed disabled:opacity-60'

export const warningButtonClass =
  'rounded border border-amber-300 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-800 transition hover:bg-amber-100 focus:outline-none focus:ring-4 focus:ring-amber-100 disabled:cursor-not-allowed disabled:opacity-60'

export const successButtonClass =
  'rounded border border-green-300 bg-green-50 px-4 py-2.5 text-sm font-bold text-green-800 transition hover:bg-green-100 focus:outline-none focus:ring-4 focus:ring-green-100 disabled:cursor-not-allowed disabled:opacity-60'

export const inputClass =
  'w-full rounded border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-sky-500 focus:ring-2 focus:ring-sky-100'

export const selectClass = inputClass

export const fieldLabelClass = 'flex flex-col gap-1.5 text-sm font-medium text-slate-700'

export const cardClass =
  'rounded border border-slate-200 bg-white p-5 shadow-md shadow-slate-200 sm:p-6'

export const tableHeaderClass =
  'border-b border-slate-200 px-3 py-2 text-left text-[11px] font-bold uppercase tracking-wider text-slate-400'

export const tableCellClass = 'border-b border-slate-100 px-3 py-3 text-sm text-slate-700'

const badgeBase = 'inline-flex items-center rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide'

export function statusBadgeClass(status) {
  switch (status) {
    case 'ACTIVE':
    case 'COMPLETED':
    case 'PAID':
      return `${badgeBase} bg-green-100 text-green-700`
    case 'SUSPENDED':
    case 'DECLINED':
    case 'FAILED':
      return `${badgeBase} bg-red-100 text-red-700`
    case 'PENDING':
      return `${badgeBase} bg-amber-100 text-amber-700`
    case 'REFUNDED':
      return `${badgeBase} bg-sky-100 text-sky-700`
    default:
      return `${badgeBase} bg-slate-100 text-slate-600`
  }
}

export function roleBadgeClass(role) {
  return role === 'ADMIN'
    ? `${badgeBase} bg-sky-100 text-sky-700`
    : `${badgeBase} bg-slate-100 text-slate-600`
}
