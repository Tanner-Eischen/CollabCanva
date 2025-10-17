/**
 * ParticleOverlay Component
 * Renders environmental FX particles (rain, dust, fireflies, etc.)
 * Uses Konva Layer for efficient rendering above tilemap layers
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { Layer, Circle, Line } from 'react-konva'
import type { FXPreset, FXParticle } from '../../types/fx'

interface ParticleOverlayProps {
  preset: FXPreset
  enabled: boolean
  opacity?: number // Overall layer opacity (0-1)
  viewportWidth: number
  viewportHeight: number
  viewportX: number // Camera X position
  viewportY: number // Camera Y position
}

/**
 * Particle Overlay
 *
 * Renders particle effects as a Konva Layer above tilemap layers.
 * Particles spawn, move, and fade based on preset configuration.
 *
 * @performance
 * - Uses requestAnimationFrame for smooth particle updates
 * - Particles are culled when outside viewport
 * - Efficient Konva rendering with listening=false
 */
export default function ParticleOverlay({
  preset,
  enabled,
  opacity = 1,
  viewportWidth,
  viewportHeight,
  viewportX,
  viewportY,
}: ParticleOverlayProps) {
  const [particles, setParticles] = useState<FXParticle[]>([])
  const lastSpawnTime = useRef<number>(Date.now())
  const lastUpdateTime = useRef<number>(Date.now())
  const animationFrameRef = useRef<number | null>(null)

  // Random helper
  const random = useCallback((min: number, max: number) => {
    return Math.random() * (max - min) + min
  }, [])

  // Spawn new particle
  const spawnParticle = useCallback((): FXParticle => {
    const size = random(preset.particleSize.min, preset.particleSize.max)
    const particleOpacity = random(preset.particleOpacity.min, preset.particleOpacity.max)
    const lifetime = random(preset.lifetime.min, preset.lifetime.max)
    
    return {
      x: random(viewportX - 100, viewportX + viewportWidth + 100),
      y: viewportY - 50, // Spawn above viewport
      vx: random(preset.velocity.x.min, preset.velocity.x.max),
      vy: random(preset.velocity.y.min, preset.velocity.y.max),
      life: 1, // Start at full life
      size,
      opacity: particleOpacity,
      rotation: random(0, Math.PI * 2),
      color: preset.particleColor,
    }
  }, [preset, viewportX, viewportY, viewportWidth, random])

  // Update particles (physics simulation)
  const updateParticles = useCallback((deltaTime: number) => {
    setParticles((prevParticles) => {
      return prevParticles
        .map((particle) => {
          // Apply physics
          const dt = deltaTime / 1000 // Convert to seconds

          // Apply gravity
          const newVy = particle.vy + preset.gravity * dt

          // Apply wind
          const newVx = particle.vx + preset.wind * dt * 0.1

          // Update position
          const newX = particle.x + newVx * dt
          const newY = particle.y + newVy * dt

          // Decay lifetime based on preset
          const lifetimeDuration = random(preset.lifetime.min, preset.lifetime.max)
          const newLife = particle.life - dt / lifetimeDuration

          return {
            ...particle,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
            life: newLife,
          }
        })
        .filter((particle) => {
          // Remove dead particles
          if (particle.life <= 0) return false

          // Remove particles far outside viewport (performance optimization)
          const margin = 200
          if (
            particle.x < viewportX - margin ||
            particle.x > viewportX + viewportWidth + margin ||
            particle.y < viewportY - margin ||
            particle.y > viewportY + viewportHeight + margin
          ) {
            return false
          }

          return true
        })
    })
  }, [preset, viewportX, viewportY, viewportWidth, viewportHeight, random])

  // Spawn particles based on spawn rate
  const spawnParticles = useCallback((deltaTime: number) => {
    const now = Date.now()
    const timeSinceLastSpawn = now - lastSpawnTime.current

    const spawnInterval = 1000 / preset.spawnRate // ms between spawns
    const particlesToSpawn = Math.floor(timeSinceLastSpawn / spawnInterval)

    if (particlesToSpawn > 0) {
      const newParticles: FXParticle[] = []
      for (let i = 0; i < particlesToSpawn; i++) {
        newParticles.push(spawnParticle())
      }

      setParticles((prev) => [...prev, ...newParticles])
      lastSpawnTime.current = now
    }
  }, [preset.spawnRate, spawnParticle])

  // Main animation loop
  useEffect(() => {
    if (!enabled) {
      // Clear particles when disabled
      setParticles([])
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastUpdateTime.current
      lastUpdateTime.current = now

      // Update existing particles
      updateParticles(deltaTime)

      // Spawn new particles
      spawnParticles(deltaTime)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    lastUpdateTime.current = Date.now()
    lastSpawnTime.current = Date.now()
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [enabled, updateParticles, spawnParticles])

  if (!enabled || opacity === 0) {
    return null
  }

  // Render particles based on shape
  return (
    <Layer
      listening={false}
      perfectDrawEnabled={false}
      opacity={opacity}
    >
      {particles.map((particle, index) => {
        const particleOpacity = particle.opacity * particle.life * opacity

        if (preset.particleShape === 'line') {
          // Render as line (rain, snow streaks)
          const lineLength = Math.max(5, particle.size * 3)
          const angle = Math.atan2(particle.vy, particle.vx)
          const endX = particle.x + Math.cos(angle) * lineLength
          const endY = particle.y + Math.sin(angle) * lineLength

          return (
            <Line
              key={`particle-${index}`}
              points={[particle.x, particle.y, endX, endY]}
              stroke={particle.color || preset.particleColor}
              strokeWidth={particle.size}
              opacity={particleOpacity}
              lineCap="round"
              listening={false}
              perfectDrawEnabled={false}
            />
          )
        } else {
          // Render as circle (dust, fireflies, sparkles)
          return (
            <Circle
              key={`particle-${index}`}
              x={particle.x}
              y={particle.y}
              radius={particle.size}
              fill={particle.color || preset.particleColor}
              opacity={particleOpacity}
              listening={false}
              perfectDrawEnabled={false}
              // Add glow for additive blending (fireflies, sparkles)
              shadowBlur={preset.blendMode === 'add' ? particle.size * 2 : 0}
              shadowColor={preset.blendMode === 'add' ? particle.color || preset.particleColor : undefined}
            />
          )
        }
      })}
    </Layer>
  )
}

