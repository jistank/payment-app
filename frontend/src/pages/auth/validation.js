/**
 * Returns a stable error code, not a user-facing string.
 * Pages are responsible for translating the code.
 */
export function validatePassword(password, confirmPassword) {
  const hasValidPassword =
    password.length >= 8 &&
    password.length <= 20 &&
    /[a-z]/.test(password) &&
    /[A-Z]/.test(password) &&
    /\d/.test(password) &&
    /[^A-Za-z0-9]/.test(password)

  if (!hasValidPassword) {
    return 'passwordInvalid'
  }

  if (password !== confirmPassword) {
    return 'passwordsMismatch'
  }

  return null
}
