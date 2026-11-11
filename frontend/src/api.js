import i18n from './i18n/config'
import { APP_CURRENCY } from './lib/formatters'

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

async function api(path, { token, method = 'GET', body, signal } = {}) {
  const headers = {}
  if (body !== undefined) headers['Content-Type'] = 'application/json'
  if (token) headers.Authorization = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
    signal,
  })

  const text = await response.text()
  let data = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }

  if (!response.ok) {
    const error = new Error(
      data?.message || data?.error || i18n.t('common:errors.http', { status: response.status }),
    )
    error.status = response.status
    error.data = data
    throw error
  }

  return data
}

export function login(email, password) {
  return api('/api/auth/login', { method: 'POST', body: { email, password } })
}

export function sendVerificationCode(email) {
  return api('/api/auth/send-code', { method: 'POST', body: { email } })
}

export function requestPasswordReset(email) {
  return api('/api/auth/forgot-password', { method: 'POST', body: { email } })
}

export function resetPassword(token, newPassword) {
  return api('/api/auth/reset-password', {
    method: 'POST',
    body: { token, newPassword },
  })
}

export function register({ nickname, email, password, verificationCode, business }) {
  return api('/api/auth/register', {
    method: 'POST',
    body: { nickname, email, password, verificationCode, business },
  })
}

export function getMe(token) {
  return api('/api/users/me', { token })
}

export function topUpBalance(token, { amount, currency = APP_CURRENCY }) {
  return api('/api/users/me/topup', {
    method: 'POST',
    token,
    body: { amount, currency },
  })
}

export function getTransactions(token) {
  return api('/api/transactions/me', { token })
}

export function getContacts(token, nickname = '', { signal } = {}) {
  const query = nickname.trim()
    ? `?nickname=${encodeURIComponent(nickname.trim())}`
    : ''
  return api(`/api/contacts${query}`, { token, signal })
}

export function addContact(token, nickname) {
  return api('/api/contacts', {
    method: 'POST',
    token,
    body: { nickname },
  })
}

export function removeContact(token, id) {
  return api(`/api/contacts/${id}`, { method: 'DELETE', token })
}

export function sendPayment(token, { nickname, amount, currency, type, code }) {
  return api('/api/transactions', {
    method: 'POST',
    token,
    body: { nickname, amount, currency, type, code },
  })
}

export function getIncomingPaymentRequests(token) {
  return api('/api/payment-requests/incoming', { token })
}

export function createPaymentRequest(token, { nickname, amount, currency, note }) {
  return api('/api/payment-requests', {
    method: 'POST',
    token,
    body: { nickname, amount, currency, note },
  })
}

export function acceptPaymentRequest(token, id, code) {
  return api(`/api/payment-requests/${id}/accept`, {
    method: 'POST',
    token,
    body: { code },
  })
}

export function declinePaymentRequest(token, id) {
  return api(`/api/payment-requests/${id}/decline`, { method: 'POST', token })
}

export function changePassword(token, { currentPassword, newPassword }) {
  return api('/api/users/me/password', {
    method: 'PUT',
    token,
    body: { currentPassword, newPassword },
  })
}

export function getPaymentCodeStatus(token) {
  return api('/api/users/me/payment-code', { token })
}

export function updatePaymentCode(token, { currentCode, newCode }) {
  return api('/api/users/me/payment-code', {
    method: 'PUT',
    token,
    body: { currentCode, newCode },
  })
}

export function deleteAccount(token, { nickname, code }) {
  return api('/api/users/me', {
    method: 'DELETE',
    token,
    body: { nickname, code },
  })
}

export function requestPaymentCodeReset(token, { nickname, password }) {
  return api('/api/users/me/payment-code/forgot', {
    method: 'POST',
    token,
    body: { nickname, password },
  })
}

export function resetPaymentCode(token, { nickname, password, verificationCode, newCode }) {
  return api('/api/users/me/payment-code/reset', {
    method: 'POST',
    token,
    body: { nickname, password, verificationCode, newCode },
  })
}

/* ----------------------------- Admin API ----------------------------- */

function withQuery(path, params) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    search.set(key, String(value))
  }
  const query = search.toString()
  return query ? `${path}?${query}` : path
}

export function getAdminStats(token) {
  return api('/api/admin/stats', { token })
}

export function searchAdminUsers(token, { query = '', status = 'ALL' } = {}) {
  return api(withQuery('/api/admin/users', { query, status }), { token })
}

export function getAdminUser(token, id) {
  return api(`/api/admin/users/${id}`, { token })
}

export function suspendAdminUser(token, id) {
  return api(`/api/admin/users/${id}/suspend`, { method: 'POST', token })
}

export function reactivateAdminUser(token, id) {
  return api(`/api/admin/users/${id}/reactivate`, { method: 'POST', token })
}

export function deleteAdminUser(token, id) {
  return api(`/api/admin/users/${id}`, { method: 'DELETE', token })
}

export function adminTopUpUser(token, id, { amount, currency = APP_CURRENCY, note }) {
  return api(`/api/admin/users/${id}/topup`, {
    method: 'POST',
    token,
    body: { amount, currency, note },
  })
}

export function getAdminTransactions(token, { user = '', status = 'ALL', type = 'ALL', limit = 200 } = {}) {
  return api(withQuery('/api/admin/transactions', { user, status, type, limit }), { token })
}

export function getAdminPaymentRequests(token, { user = '', status = 'ALL', limit = 200 } = {}) {
  return api(withQuery('/api/admin/payment-requests', { user, status, limit }), { token })
}

export function getAdminAuditLogs(token, { action = 'ALL', limit = 100 } = {}) {
  return api(withQuery('/api/admin/audit', { action, limit }), { token })
}
