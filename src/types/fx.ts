/**
 * Environmental FX Types
 * For ambient particle effects and environmental animations (rain, dust, fireflies, etc.)
 */

/**
 * FX Particle Configuration
 */
export interface FXParticle {
  x: number // X position
  y: number // Y position
  vx: number // X velocity
  vy: number // Y velocity
  life: number // Remaining lifetime (0-1)
  size: number // Particle size
  opacity: number // Particle opacity
  rotation?: number // Rotation angle
  color?: string // Particle color
}

/**
 * FX Preset Types
 */
export type FXPresetType = 'rain' | 'snow' | 'dust' | 'fireflies' | 'leaves' | 'sparkles' | 'fog' | 'custom'

/**
 * FX Preset Configuration
 */
export interface FXPreset {
  id: string
  name: string
  type: FXPresetType
  description: string
  
  // Particle appearance
  particleColor: string
  particleSize: { min: number; max: number }
  particleOpacity: { min: number; max: number }
  particleShape: 'circle' | 'line' | 'custom' // circle for dots, line for rain/snow
  
  // Particle behavior
  spawnRate: number // Particles per second
  lifetime: { min: number; max: number } // Seconds
  velocity: { x: { min: number; max: number }; y: { min: number; max: number } }
  gravity: number // Downward acceleration
  wind: number // Horizontal force
  
  // Rendering
  blendMode?: 'normal' | 'add' | 'multiply' | 'screen'
  layerZ?: number // Z-index for layer ordering (default: 25, above props)
}

/**
 * FX Layer State
 */
export interface FXLayerState {
  id: string
  preset: FXPreset
  enabled: boolean
  particles: FXParticle[]
  lastSpawnTime: number
  opacity: number // Overall layer opacity
}

/**
 * FX Export Format
 */
export interface FXExport {
  presetId: string
  enabled: boolean
  opacity: number
  customConfig?: Partial<FXPreset>
}

