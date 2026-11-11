import { useEffect, useState } from 'react'

/**
 * Returns a value that only updates after `delay` milliseconds without changes.
 * Every change resets the timer, so expensive work runs once when the user
 * pauses instead of on every keystroke.
 */
export default function useDebouncedValue(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timeout)
  }, [value, delay])

  return debouncedValue
}
