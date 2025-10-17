/**
 * Throttle function to limit execution rate
 * @param fn Function to throttle
 * @param delay Minimum time between executions in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let lastCall = 0

  return function (...args: Parameters<T>) {
    const now = Date.now()

    if (now - lastCall >= delay) {
      lastCall = now
      fn(...args)
    }
  }
}

