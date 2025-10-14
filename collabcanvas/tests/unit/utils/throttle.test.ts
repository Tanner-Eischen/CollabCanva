import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { throttle } from '../../../src/utils/throttle'

describe('throttle', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should call function immediately on first call', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled('test')

    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith('test')
  })

  it('should throttle rapid calls to 50ms intervals (20Hz)', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    // Call multiple times rapidly
    throttled(1)
    throttled(2)
    throttled(3)

    // Only first call should execute
    expect(fn).toHaveBeenCalledTimes(1)
    expect(fn).toHaveBeenCalledWith(1)

    // Advance time by 49ms - still within throttle window
    vi.advanceTimersByTime(49)
    throttled(4)
    expect(fn).toHaveBeenCalledTimes(1)

    // Advance time by 1ms more (total 50ms) - throttle should release
    vi.advanceTimersByTime(1)
    throttled(5)
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith(5)
  })

  it('should not exceed throttle limit with rapid calls', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    // Make 100 rapid calls
    for (let i = 0; i < 100; i++) {
      throttled(i)
    }

    // Only first call should execute
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('should release throttle after idle period', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled('first')
    expect(fn).toHaveBeenCalledTimes(1)

    // Wait 100ms (well past throttle period)
    vi.advanceTimersByTime(100)

    throttled('second')
    expect(fn).toHaveBeenCalledTimes(2)
    expect(fn).toHaveBeenCalledWith('second')
  })

  it('should maintain exactly 20Hz rate (50ms intervals)', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    // Simulate 1 second of calls at high frequency
    for (let time = 0; time < 1000; time += 10) {
      throttled(time)
      vi.advanceTimersByTime(10)
    }

    // At 20Hz over 1 second, we expect exactly 20 calls
    // First call at 0ms, then at 50ms, 100ms, 150ms... up to 950ms
    expect(fn).toHaveBeenCalledTimes(20)
  })

  it('should preserve function arguments', () => {
    const fn = vi.fn()
    const throttled = throttle(fn, 50)

    throttled('arg1', 'arg2', 'arg3')
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2', 'arg3')

    vi.advanceTimersByTime(50)
    throttled(1, 2, 3)
    expect(fn).toHaveBeenCalledWith(1, 2, 3)
  })
})

