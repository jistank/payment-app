export function ErrorMessage({ children, className = '' }) {
  if (!children) return null
  return (
    <p className={`m-0 rounded border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700 ${className}`}>
      {children}
    </p>
  )
}

export function NoticeMessage({ children, className = '' }) {
  if (!children) return null
  return (
    <p className={`m-0 rounded border border-green-200 bg-green-50 px-3 py-2.5 text-sm text-green-700 ${className}`}>
      {children}
    </p>
  )
}
