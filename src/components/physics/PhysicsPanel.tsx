/**
 * Physics Properties Panel
 * Configure physics properties for game objects
 * PR-31: Physics Preview System
 */

import { useState } from 'react'

export type BodyType = 'static' | 'dynamic' | 'kinematic'

export interface PhysicsProperties {
  enabled: boolean
  bodyType: BodyType
  mass: number
  friction: number
  bounce: number // restitution
  gravityScale: number
}

interface PhysicsPanelProps {
  shapeId: string | null
  properties?: PhysicsProperties
  onUpdate: (properties: PhysicsProperties) => void
}

const DEFAULT_PROPERTIES: PhysicsProperties = {
  enabled: false,
  bodyType: 'dynamic',
  mass: 1,
  friction: 0.5,
  bounce: 0.3,
  gravityScale: 1,
}

const PRESETS: Record<string, Partial<PhysicsProperties>> = {
  player: {
    bodyType: 'dynamic',
    mass: 1,
    friction: 0.8,
    bounce: 0,
    gravityScale: 1,
  },
  platform: {
    bodyType: 'static',
    mass: 0,
    friction: 0.6,
    bounce: 0,
    gravityScale: 0,
  },
  projectile: {
    bodyType: 'dynamic',
    mass: 0.1,
    friction: 0,
    bounce: 0.8,
    gravityScale: 0.5,
  },
}

/**
 * PhysicsPanel component
 * Allows configuration of physics properties for selected shapes
 */
export default function PhysicsPanel({
  shapeId,
  properties = DEFAULT_PROPERTIES,
  onUpdate,
}: PhysicsPanelProps) {
  const [localProps, setLocalProps] = useState<PhysicsProperties>(properties)

  if (!shapeId) {
    return (
      <div className="p-4 text-center text-gray-500">
        <p className="text-sm">Select an object to edit physics properties</p>
      </div>
    )
  }

  const handleChange = (updates: Partial<PhysicsProperties>) => {
    const updated = { ...localProps, ...updates }
    setLocalProps(updated)
    onUpdate(updated)
  }

  const applyPreset = (presetName: keyof typeof PRESETS) => {
    const preset = PRESETS[presetName]
    handleChange({ ...preset, enabled: true })
  }

  return (
    <div className="p-4 space-y-4">
      <h3 className="font-semibold text-gray-800 text-sm uppercase tracking-wide">
        Physics Properties
      </h3>

      {/* Enable Toggle */}
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Enable Physics
        </label>
        <button
          onClick={() => handleChange({ enabled: !localProps.enabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            localProps.enabled ? 'bg-blue-600' : 'bg-gray-300'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              localProps.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {localProps.enabled && (
        <>
          {/* Presets */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Presets
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => applyPreset('player')}
                className="px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded border border-blue-200"
              >
                Player
              </button>
              <button
                onClick={() => applyPreset('platform')}
                className="px-3 py-2 text-xs bg-gray-50 hover:bg-gray-100 text-gray-700 rounded border border-gray-200"
              >
                Platform
              </button>
              <button
                onClick={() => applyPreset('projectile')}
                className="px-3 py-2 text-xs bg-orange-50 hover:bg-orange-100 text-orange-700 rounded border border-orange-200"
              >
                Projectile
              </button>
            </div>
          </div>

          {/* Body Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Body Type
            </label>
            <select
              value={localProps.bodyType}
              onChange={(e) => handleChange({ bodyType: e.target.value as BodyType })}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="dynamic">Dynamic (moves with physics)</option>
              <option value="static">Static (fixed position)</option>
              <option value="kinematic">Kinematic (controlled movement)</option>
            </select>
          </div>

          {/* Mass */}
          {localProps.bodyType === 'dynamic' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700">Mass</label>
                <span className="text-sm text-gray-500">{localProps.mass}</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="10"
                step="0.1"
                value={localProps.mass}
                onChange={(e) => handleChange({ mass: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          )}

          {/* Friction */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700">Friction</label>
              <span className="text-sm text-gray-500">{localProps.friction.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localProps.friction}
              onChange={(e) => handleChange({ friction: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Bounce (Restitution) */}
          <div className="space-y-2">
            <div className="flex justify-between">
              <label className="text-sm font-medium text-gray-700">Bounce</label>
              <span className="text-sm text-gray-500">{localProps.bounce.toFixed(2)}</span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={localProps.bounce}
              onChange={(e) => handleChange({ bounce: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>

          {/* Gravity Scale */}
          {localProps.bodyType === 'dynamic' && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <label className="text-sm font-medium text-gray-700">Gravity Scale</label>
                <span className="text-sm text-gray-500">{localProps.gravityScale.toFixed(2)}</span>
              </div>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={localProps.gravityScale}
                onChange={(e) => handleChange({ gravityScale: parseFloat(e.target.value) })}
                className="w-full"
              />
            </div>
          )}

          {/* Info */}
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded text-xs text-blue-800">
            <p className="font-medium">Preview Only</p>
            <p className="mt-1">
              Physics simulation is for preview purposes. Export to your game engine for production physics.
            </p>
          </div>
        </>
      )}
    </div>
  )
}


