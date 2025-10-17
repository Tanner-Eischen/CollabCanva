/**
 * Performance Profiler Service
 * Analyzes canvas performance and identifies bottlenecks
 * PR-32: AI Game-Aware Enhancement
 */

import type { Shape } from '../../types/canvas';

export interface PerformanceReport {
  fps: number;
  renderTime: number; // ms per frame
  objectCount: number;
  tilemapSize?: { width: number; height: number };
  tileCount: number;
  drawCalls: number;
  memoryUsage?: number; // MB (if available)
  score: number; // 0-100
  rating: 'excellent' | 'good' | 'fair' | 'poor';
  bottlenecks: string[];
}

export interface PerformanceMetrics {
  fps: number[];
  frameTime: number[];
  timestamp: number[];
}

/**
 * Performance profiler class
 */
export class PerformanceProfiler {
  private metrics: PerformanceMetrics = {
    fps: [],
    frameTime: [],
    timestamp: []
  };

  private lastFrameTime: number = 0;
  private maxSamples: number = 60; // Keep last 60 samples (1 second at 60fps)

  /**
   * Record a frame
   */
  recordFrame(): void {
    const now = performance.now();
    
    if (this.lastFrameTime > 0) {
      const frameTime = now - this.lastFrameTime;
      const fps = 1000 / frameTime;

      this.metrics.fps.push(fps);
      this.metrics.frameTime.push(frameTime);
      this.metrics.timestamp.push(now);

      // Keep only recent samples
      if (this.metrics.fps.length > this.maxSamples) {
        this.metrics.fps.shift();
        this.metrics.frameTime.shift();
        this.metrics.timestamp.shift();
      }
    }

    this.lastFrameTime = now;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Get average FPS
   */
  getAverageFPS(): number {
    if (this.metrics.fps.length === 0) return 60;
    return this.metrics.fps.reduce((sum, fps) => sum + fps, 0) / this.metrics.fps.length;
  }

  /**
   * Get average frame time
   */
  getAverageFrameTime(): number {
    if (this.metrics.frameTime.length === 0) return 16.67;
    return this.metrics.frameTime.reduce((sum, time) => sum + time, 0) / this.metrics.frameTime.length;
  }

  /**
   * Get minimum FPS (worst performance)
   */
  getMinFPS(): number {
    if (this.metrics.fps.length === 0) return 60;
    return Math.min(...this.metrics.fps);
  }

  /**
   * Reset metrics
   */
  reset(): void {
    this.metrics = {
      fps: [],
      frameTime: [],
      timestamp: []
    };
    this.lastFrameTime = 0;
  }
}

/**
 * Analyze canvas performance
 */
export function profileCanvas(
  objects: Shape[],
  tilemapSize?: { width: number; height: number },
  tileCount: number = 0,
  currentFPS?: number
): PerformanceReport {
  const objectCount = objects.length;
  const bottlenecks: string[] = [];

  // Estimate draw calls
  let drawCalls = objectCount;
  
  // Count objects by type
  const typeCount: Record<string, number> = {};
  const colorCount: Record<string, number> = {};
  
  for (const obj of objects) {
    typeCount[obj.type] = (typeCount[obj.type] || 0) + 1;
    if (obj.fill) {
      colorCount[obj.fill] = (colorCount[obj.fill] || 0) + 1;
    }
  }

  // Add tilemap draw calls (chunked)
  if (tileCount > 0) {
    drawCalls += Math.ceil(tileCount / 1000); // Assuming 1000 tiles per chunk
  }

  // FPS (use provided or assume based on load)
  const fps = currentFPS || estimateFPS(objectCount, tileCount);

  // Estimate render time
  const renderTime = 1000 / fps;

  // Identify bottlenecks
  if (objectCount > 1000) {
    bottlenecks.push(`High object count (${objectCount}). Consider using tilemap for repetitive elements.`);
  }

  if (objectCount > 500 && objectCount < 1000) {
    bottlenecks.push(`Moderate object count (${objectCount}). Monitor performance.`);
  }

  if (tileCount > 50000) {
    bottlenecks.push(`Large tilemap (${tileCount} tiles). May cause lag on lower-end devices.`);
  }

  // Check for many unique colors (prevents batching)
  const uniqueColors = Object.keys(colorCount).length;
  if (uniqueColors > 20 && objectCount > 100) {
    bottlenecks.push(`Many unique colors (${uniqueColors}). Reduce color palette for better batching.`);
  }

  // Check for complex shapes
  const complexShapes = (typeCount.polygon || 0) + (typeCount.star || 0);
  if (complexShapes > 50) {
    bottlenecks.push(`Many complex shapes (${complexShapes}). Consider caching or simplifying.`);
  }

  // Memory estimation (rough)
  const memoryUsage = estimateMemoryUsage(objectCount, tileCount);

  // Calculate performance score (0-100)
  let score = 100;

  // Deduct for high object count
  if (objectCount > 1000) score -= 30;
  else if (objectCount > 500) score -= 15;
  else if (objectCount > 200) score -= 5;

  // Deduct for large tilemap
  if (tileCount > 50000) score -= 25;
  else if (tileCount > 10000) score -= 10;

  // Deduct for FPS
  if (fps < 30) score -= 30;
  else if (fps < 45) score -= 15;
  else if (fps < 55) score -= 5;

  // Deduct for draw calls
  if (drawCalls > 2000) score -= 20;
  else if (drawCalls > 1000) score -= 10;

  score = Math.max(0, score);

  // Rating
  let rating: 'excellent' | 'good' | 'fair' | 'poor';
  if (score >= 80) rating = 'excellent';
  else if (score >= 60) rating = 'good';
  else if (score >= 40) rating = 'fair';
  else rating = 'poor';

  return {
    fps,
    renderTime,
    objectCount,
    tilemapSize,
    tileCount,
    drawCalls,
    memoryUsage,
    score,
    rating,
    bottlenecks
  };
}

/**
 * Estimate FPS based on load
 */
function estimateFPS(objectCount: number, tileCount: number): number {
  let fps = 60;

  // Reduce FPS estimate based on load
  if (objectCount > 1000) fps -= 20;
  else if (objectCount > 500) fps -= 10;
  else if (objectCount > 200) fps -= 5;

  if (tileCount > 50000) fps -= 15;
  else if (tileCount > 10000) fps -= 5;

  return Math.max(fps, 15);
}

/**
 * Estimate memory usage (MB)
 */
function estimateMemoryUsage(objectCount: number, tileCount: number): number {
  // Rough estimates
  const objectMemory = objectCount * 0.001; // ~1KB per object
  const tileMemory = tileCount * 0.0001; // ~0.1KB per tile
  return objectMemory + tileMemory;
}

/**
 * Identify bottlenecks
 */
export function identifyBottlenecks(
  report: PerformanceReport
): Array<{ issue: string; severity: 'low' | 'medium' | 'high'; suggestion: string }> {
  const issues: Array<{ issue: string; severity: 'low' | 'medium' | 'high'; suggestion: string }> = [];

  // FPS issues
  if (report.fps < 30) {
    issues.push({
      issue: `Low FPS (${report.fps.toFixed(1)})`,
      severity: 'high',
      suggestion: 'Reduce object count or enable viewport culling'
    });
  } else if (report.fps < 45) {
    issues.push({
      issue: `Moderate FPS (${report.fps.toFixed(1)})`,
      severity: 'medium',
      suggestion: 'Consider optimizations for smoother performance'
    });
  }

  // Object count
  if (report.objectCount > 1000) {
    issues.push({
      issue: `Too many objects (${report.objectCount})`,
      severity: 'high',
      suggestion: 'Use tilemap for terrain instead of individual shapes'
    });
  } else if (report.objectCount > 500) {
    issues.push({
      issue: `High object count (${report.objectCount})`,
      severity: 'medium',
      suggestion: 'Consider grouping or caching static objects'
    });
  }

  // Tilemap size
  if (report.tileCount > 50000) {
    issues.push({
      issue: `Very large tilemap (${report.tileCount} tiles)`,
      severity: 'high',
      suggestion: 'Reduce tilemap size or implement tile chunking'
    });
  }

  // Draw calls
  if (report.drawCalls > 2000) {
    issues.push({
      issue: `Excessive draw calls (${report.drawCalls})`,
      severity: 'high',
      suggestion: 'Batch objects with same properties or use instancing'
    });
  }

  // Memory
  if (report.memoryUsage && report.memoryUsage > 100) {
    issues.push({
      issue: `High memory usage (${report.memoryUsage.toFixed(1)} MB)`,
      severity: 'medium',
      suggestion: 'Reduce object count or compress assets'
    });
  }

  return issues;
}

/**
 * Generate optimization suggestions
 */
export function generateOptimizationSuggestions(report: PerformanceReport): string[] {
  const suggestions: string[] = [];

  // General optimizations
  if (report.objectCount > 200) {
    suggestions.push('Enable viewport culling to hide off-screen objects');
    suggestions.push('Cache static objects that don\'t change');
  }

  if (report.tileCount > 5000) {
    suggestions.push('Implement tile chunking to load only visible areas');
  }

  if (report.fps < 45) {
    suggestions.push('Reduce shadow/glow effects');
    suggestions.push('Lower animation frame rates');
    suggestions.push('Use simpler shapes where possible');
  }

  // Specific to content
  if (report.objectCount > 500) {
    suggestions.push('Consider using sprite sheets instead of individual objects');
    suggestions.push('Group static decorations into single cached layer');
  }

  if (report.drawCalls > 1000) {
    suggestions.push('Batch objects with same color/properties');
    suggestions.push('Use texture atlasing for sprites');
  }

  return suggestions;
}

/**
 * Compare performance against benchmarks
 */
export function compareAgainstBenchmarks(report: PerformanceReport): {
  vsTarget: string;
  vsTypical: string;
  recommendation: string;
} {
  // Target: 60 FPS with < 1000 objects
  const targetScore = 80;
  const vsTarget = report.score >= targetScore ? 'Above target' : 'Below target';

  // Typical: 45+ FPS with moderate content
  const typicalScore = 60;
  const vsTypical = report.score >= typicalScore ? 'Above typical' : 'Below typical';

  let recommendation: string;
  if (report.score >= 80) {
    recommendation = 'Performance is excellent. No optimizations needed.';
  } else if (report.score >= 60) {
    recommendation = 'Performance is good. Consider minor optimizations for smoother experience.';
  } else if (report.score >= 40) {
    recommendation = 'Performance is fair. Optimizations recommended.';
  } else {
    recommendation = 'Performance is poor. Significant optimizations required.';
  }

  return {
    vsTarget,
    vsTypical,
    recommendation
  };
}

// Global profiler instance
let globalProfiler: PerformanceProfiler | null = null;

/**
 * Get or create global profiler
 */
export function getProfiler(): PerformanceProfiler {
  if (!globalProfiler) {
    globalProfiler = new PerformanceProfiler();
  }
  return globalProfiler;
}

/**
 * Reset global profiler
 */
export function resetProfiler(): void {
  if (globalProfiler) {
    globalProfiler.reset();
  }
}

