/**
 * Environmental FX Presets
 * Pre-configured particle effects for common environmental scenarios
 */

import type { FXPreset } from '../types/fx'

/**
 * Rain FX Preset
 * Vertical rainfall with slight wind
 */
export const RAIN_PRESET: FXPreset = {
  id: 'rain',
  name: 'Rain',
  type: 'rain',
  description: 'Vertical rainfall with wind effects',
  particleColor: '#a0c4ff',
  particleSize: { min: 1, max: 2 },
  particleOpacity: { min: 0.3, max: 0.7 },
  particleShape: 'line',
  spawnRate: 50, // 50 particles per second
  lifetime: { min: 1, max: 2 },
  velocity: { x: { min: -20, max: 20 }, y: { min: 300, max: 500 } },
  gravity: 200,
  wind: 30,
  blendMode: 'normal',
  layerZ: 25,
}

/**
 * Snow FX Preset
 * Gentle snowfall with floating motion
 */
export const SNOW_PRESET: FXPreset = {
  id: 'snow',
  name: 'Snow',
  type: 'snow',
  description: 'Gentle snowfall with floating motion',
  particleColor: '#ffffff',
  particleSize: { min: 2, max: 4 },
  particleOpacity: { min: 0.5, max: 0.9 },
  particleShape: 'circle',
  spawnRate: 20,
  lifetime: { min: 3, max: 5 },
  velocity: { x: { min: -30, max: 30 }, y: { min: 50, max: 100 } },
  gravity: 10,
  wind: 20,
  blendMode: 'normal',
  layerZ: 25,
}

/**
 * Dust FX Preset
 * Ambient dust particles floating in air
 */
export const DUST_PRESET: FXPreset = {
  id: 'dust',
  name: 'Dust',
  type: 'dust',
  description: 'Ambient dust particles floating in air',
  particleColor: '#d4af37',
  particleSize: { min: 1, max: 2 },
  particleOpacity: { min: 0.1, max: 0.3 },
  particleShape: 'circle',
  spawnRate: 10,
  lifetime: { min: 5, max: 10 },
  velocity: { x: { min: -10, max: 10 }, y: { min: -20, max: 20 } },
  gravity: 0,
  wind: 5,
  blendMode: 'normal',
  layerZ: 25,
}

/**
 * Fireflies FX Preset
 * Glowing fireflies with pulsing animation
 */
export const FIREFLIES_PRESET: FXPreset = {
  id: 'fireflies',
  name: 'Fireflies',
  type: 'fireflies',
  description: 'Glowing fireflies with pulsing animation',
  particleColor: '#ffeb3b',
  particleSize: { min: 2, max: 3 },
  particleOpacity: { min: 0.3, max: 0.8 },
  particleShape: 'circle',
  spawnRate: 5,
  lifetime: { min: 8, max: 15 },
  velocity: { x: { min: -30, max: 30 }, y: { min: -30, max: 30 } },
  gravity: 0,
  wind: 0,
  blendMode: 'add', // Additive blending for glow effect
  layerZ: 25,
}

/**
 * Falling Leaves FX Preset
 * Autumn leaves falling with rotation
 */
export const LEAVES_PRESET: FXPreset = {
  id: 'leaves',
  name: 'Falling Leaves',
  type: 'leaves',
  description: 'Autumn leaves falling with swaying motion',
  particleColor: '#d97706',
  particleSize: { min: 3, max: 6 },
  particleOpacity: { min: 0.6, max: 0.9 },
  particleShape: 'circle',
  spawnRate: 8,
  lifetime: { min: 4, max: 8 },
  velocity: { x: { min: -50, max: 50 }, y: { min: 30, max: 80 } },
  gravity: 30,
  wind: 40,
  blendMode: 'normal',
  layerZ: 25,
}

/**
 * Sparkles FX Preset
 * Magical sparkle particles
 */
export const SPARKLES_PRESET: FXPreset = {
  id: 'sparkles',
  name: 'Sparkles',
  type: 'sparkles',
  description: 'Magical sparkle particles',
  particleColor: '#ffffff',
  particleSize: { min: 1, max: 3 },
  particleOpacity: { min: 0.5, max: 1 },
  particleShape: 'circle',
  spawnRate: 15,
  lifetime: { min: 0.5, max: 1.5 },
  velocity: { x: { min: -20, max: 20 }, y: { min: -50, max: -100 } },
  gravity: -50, // Negative gravity (upward)
  wind: 0,
  blendMode: 'add',
  layerZ: 25,
}

/**
 * Fog FX Preset
 * Low-lying fog effect
 */
export const FOG_PRESET: FXPreset = {
  id: 'fog',
  name: 'Fog',
  type: 'fog',
  description: 'Low-lying fog effect',
  particleColor: '#e5e7eb',
  particleSize: { min: 20, max: 40 },
  particleOpacity: { min: 0.1, max: 0.3 },
  particleShape: 'circle',
  spawnRate: 3,
  lifetime: { min: 10, max: 20 },
  velocity: { x: { min: -10, max: 10 }, y: { min: -5, max: 5 } },
  gravity: 0,
  wind: 15,
  blendMode: 'normal',
  layerZ: 25,
}

/**
 * All available FX presets
 */
export const FX_PRESETS: FXPreset[] = [
  RAIN_PRESET,
  SNOW_PRESET,
  DUST_PRESET,
  FIREFLIES_PRESET,
  LEAVES_PRESET,
  SPARKLES_PRESET,
  FOG_PRESET,
]

/**
 * Get FX preset by ID
 */
export function getFXPreset(id: string): FXPreset | undefined {
  return FX_PRESETS.find((preset) => preset.id === id)
}

/**
 * Get FX presets by type
 */
export function getFXPresetsByType(type: string): FXPreset[] {
  return FX_PRESETS.filter((preset) => preset.type === type)
}

/**
 * Create custom FX preset based on existing preset
 */
export function createCustomFXPreset(
  basePreset: FXPreset,
  overrides: Partial<FXPreset>
): FXPreset {
  return {
    ...basePreset,
    ...overrides,
    id: `custom-${Date.now()}`,
    type: 'custom',
  }
}

