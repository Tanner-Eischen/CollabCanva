import { throttle } from './throttle'

/**
 * Creates an optimistic update handler for shape dragging
 * Updates local state immediately and syncs to Firebase with throttling
 * @param localUpdate Function to update local state immediately
 * @param remoteSync Function to sync to Firebase (will be throttled)
 * @param throttleMs Throttle interval in milliseconds (default: 100ms)
 */
export function createOptimisticDragHandler<T>(
  localUpdate: (data: T) => void,
  remoteSync: (data: T) => void,
  throttleMs: number = 100
) {
  const throttledSync = throttle(remoteSync, throttleMs)

  return (data: T) => {
    // Update local state immediately for instant feedback
    localUpdate(data)
    // Sync to Firebase with throttling to reduce network traffic
    throttledSync(data)
  }
}

/**
 * Debounces a function call with leading and trailing edge execution
 * Useful for final sync operations after a series of rapid updates
 */
export function debounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null

  return function (...args: Parameters<T>) {
    if (timeoutId) {
      clearTimeout(timeoutId)
    }

    timeoutId = setTimeout(() => {
      fn(...args)
      timeoutId = null
    }, delay)
  }
}

