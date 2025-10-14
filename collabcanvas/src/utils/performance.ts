/**
 * Performance monitoring utilities for CollabCanvas
 * Provides FPS measurement and performance metrics
 */

interface PerformanceMetrics {
  fps: number
  avgFrameTime: number
  minFps: number
  maxFps: number
  sampleCount: number
}

/**
 * FPS Monitor class
 * Measures and tracks frames per second
 */
export class FPSMonitor {
  private lastTime: number = performance.now()
  private frames: number = 0
  private fps: number = 0
  private frameTimes: number[] = []
  private readonly maxSamples: number = 60
  private animationFrameId: number | null = null
  private callback: ((metrics: PerformanceMetrics) => void) | null = null

  constructor() {
    this.lastTime = performance.now()
  }

  /**
   * Start monitoring FPS
   */
  start(callback?: (metrics: PerformanceMetrics) => void): void {
    this.callback = callback || null
    this.lastTime = performance.now()
    this.frames = 0
    this.frameTimes = []
    this.loop()
  }

  /**
   * Stop monitoring FPS
   */
  stop(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId)
      this.animationFrameId = null
    }
  }

  /**
   * Get current FPS
   */
  getFPS(): number {
    return this.fps
  }

  /**
   * Get performance metrics
   */
  getMetrics(): PerformanceMetrics {
    const minFps = this.frameTimes.length > 0 ? 
      Math.min(...this.frameTimes.map(t => 1000 / t)) : 0
    const maxFps = this.frameTimes.length > 0 ? 
      Math.max(...this.frameTimes.map(t => 1000 / t)) : 0
    const avgFrameTime = this.frameTimes.length > 0 ?
      this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length : 0

    return {
      fps: this.fps,
      avgFrameTime,
      minFps: Math.round(minFps),
      maxFps: Math.round(maxFps),
      sampleCount: this.frameTimes.length
    }
  }

  /**
   * Main loop for FPS calculation
   */
  private loop = (): void => {
    const currentTime = performance.now()
    const deltaTime = currentTime - this.lastTime
    
    this.frames++
    
    // Update FPS every second
    if (deltaTime >= 1000) {
      this.fps = Math.round((this.frames * 1000) / deltaTime)
      this.frames = 0
      this.lastTime = currentTime
      
      // Call callback with metrics if provided
      if (this.callback) {
        this.callback(this.getMetrics())
      }
    }

    // Track frame times for more detailed metrics
    this.frameTimes.push(deltaTime)
    if (this.frameTimes.length > this.maxSamples) {
      this.frameTimes.shift()
    }

    this.animationFrameId = requestAnimationFrame(this.loop)
  }
}

/**
 * Measure latency of an async operation
 */
export async function measureLatency<T>(
  operation: () => Promise<T>,
  label?: string
): Promise<{ result: T; latency: number }> {
  const startTime = performance.now()
  const result = await operation()
  const latency = performance.now() - startTime

  if (label && import.meta.env.DEV) {
    console.log(`[Performance] ${label}: ${latency.toFixed(2)}ms`)
  }

  return { result, latency }
}

/**
 * Measure execution time of a sync operation
 */
export function measureExecutionTime<T>(
  operation: () => T,
  label?: string
): { result: T; time: number } {
  const startTime = performance.now()
  const result = operation()
  const time = performance.now() - startTime

  if (label && import.meta.env.DEV) {
    console.log(`[Performance] ${label}: ${time.toFixed(2)}ms`)
  }

  return { result, time }
}

/**
 * Create a performance mark
 */
export function mark(name: string): void {
  if (typeof performance !== 'undefined' && performance.mark) {
    performance.mark(name)
  }
}

/**
 * Measure time between two marks
 */
export function measure(
  name: string,
  startMark: string,
  endMark: string
): number | null {
  if (typeof performance !== 'undefined' && performance.measure) {
    try {
      performance.measure(name, startMark, endMark)
      const entries = performance.getEntriesByName(name)
      if (entries.length > 0) {
        const duration = entries[entries.length - 1].duration
        if (import.meta.env.DEV) {
          console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`)
        }
        return duration
      }
    } catch (error) {
      console.error('Performance measurement error:', error)
    }
  }
  return null
}

/**
 * Log memory usage (Chrome only)
 */
export function logMemoryUsage(): void {
  if (import.meta.env.DEV && 'memory' in performance) {
    const memory = (performance as any).memory
    console.log('[Performance] Memory Usage:', {
      usedJSHeapSize: `${(memory.usedJSHeapSize / 1048576).toFixed(2)} MB`,
      totalJSHeapSize: `${(memory.totalJSHeapSize / 1048576).toFixed(2)} MB`,
      jsHeapSizeLimit: `${(memory.jsHeapSizeLimit / 1048576).toFixed(2)} MB`,
    })
  }
}

/**
 * React hook for FPS monitoring
 * Usage: const fps = useFPSMonitor()
 */
export function createFPSHook() {
  let monitor: FPSMonitor | null = null
  let currentFps = 0

  return function useFPSMonitor(): number {
    if (typeof window === 'undefined') return 0
    
    if (!monitor) {
      monitor = new FPSMonitor()
      monitor.start((metrics) => {
        currentFps = metrics.fps
      })
    }

    return currentFps
  }
}

/**
 * Performance benchmarking utility
 */
export class PerformanceBenchmark {
  private metrics: Map<string, number[]> = new Map()

  /**
   * Record a metric
   */
  record(key: string, value: number): void {
    if (!this.metrics.has(key)) {
      this.metrics.set(key, [])
    }
    this.metrics.get(key)!.push(value)
  }

  /**
   * Get statistics for a metric
   */
  getStats(key: string): {
    min: number
    max: number
    avg: number
    median: number
    p95: number
    p99: number
  } | null {
    const values = this.metrics.get(key)
    if (!values || values.length === 0) return null

    const sorted = [...values].sort((a, b) => a - b)
    const sum = sorted.reduce((a, b) => a + b, 0)

    return {
      min: sorted[0],
      max: sorted[sorted.length - 1],
      avg: sum / sorted.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    }
  }

  /**
   * Get all statistics
   */
  getAllStats(): Map<string, any> {
    const stats = new Map()
    this.metrics.forEach((_, key) => {
      stats.set(key, this.getStats(key))
    })
    return stats
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear()
  }

  /**
   * Print all statistics to console
   */
  printStats(): void {
    console.log('=== Performance Benchmark Results ===')
    this.metrics.forEach((_, key) => {
      const stats = this.getStats(key)
      if (stats) {
        console.log(`\n${key}:`)
        console.log(`  Min: ${stats.min.toFixed(2)}ms`)
        console.log(`  Max: ${stats.max.toFixed(2)}ms`)
        console.log(`  Avg: ${stats.avg.toFixed(2)}ms`)
        console.log(`  Median: ${stats.median.toFixed(2)}ms`)
        console.log(`  P95: ${stats.p95.toFixed(2)}ms`)
        console.log(`  P99: ${stats.p99.toFixed(2)}ms`)
      }
    })
    console.log('\n=====================================')
  }
}

// Export a global benchmark instance for development
export const globalBenchmark = new PerformanceBenchmark()

// Log performance metrics in development
if (import.meta.env.DEV) {
  // Log memory usage every 30 seconds
  setInterval(() => {
    logMemoryUsage()
  }, 30000)
}

