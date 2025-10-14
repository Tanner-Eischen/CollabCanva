import React, { useState, useEffect } from 'react'

/**
 * ColorPicker Component
 * Provides color selection with presets, hex input, opacity, and recent colors
 */

interface ColorPickerProps {
  value: string // Current color value (RGBA hex format)
  onChange: (color: string) => void
  label: string // "Fill" or "Stroke"
  recentColors?: string[] // Recently used colors
  showOpacity?: boolean // Show opacity slider (default: true)
}

// Preset color palette
const PRESET_COLORS = [
  '#EF4444FF', // red
  '#F97316FF', // orange
  '#F59E0BFF', // amber
  '#EAB308FF', // yellow
  '#84CC16FF', // lime
  '#22C55EFF', // green
  '#10B981FF', // emerald
  '#14B8A6FF', // teal
  '#06B6D4FF', // cyan
  '#0EA5E9FF', // sky
  '#3B82F6FF', // blue (default)
  '#6366F1FF', // indigo
  '#8B5CF6FF', // violet
  '#A855F7FF', // purple
  '#D946EFFF', // fuchsia
  '#EC4899FF', // pink
  '#64748BFF', // slate
  '#000000FF', // black
  '#FFFFFFFF', // white
  '#00000000', // transparent
]

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  recentColors = [],
  showOpacity = true,
}) => {
  const [hexInput, setHexInput] = useState(value.slice(0, 7)) // Remove alpha
  const [opacity, setOpacity] = useState(
    parseInt(value.slice(7, 9) || 'FF', 16) / 255
  )

  // Update hex input when value changes externally
  useEffect(() => {
    setHexInput(value.slice(0, 7))
    setOpacity(parseInt(value.slice(7, 9) || 'FF', 16) / 255)
  }, [value])

  const handleHexInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value
    setHexInput(input)

    // Validate hex color
    if (/^#[0-9A-Fa-f]{6}$/.test(input)) {
      const alpha = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
      onChange(input + alpha)
    }
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value)
    setOpacity(newOpacity)

    const alpha = Math.round(newOpacity * 255)
      .toString(16)
      .padStart(2, '0')
      .toUpperCase()
    onChange(hexInput + alpha)
  }

  const handlePresetClick = (color: string) => {
    setHexInput(color.slice(0, 7))
    setOpacity(parseInt(color.slice(7, 9) || 'FF', 16) / 255)
    onChange(color)
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="text-sm font-medium text-gray-700">{label}</div>

      {/* Current Color Preview */}
      <div className="flex items-center gap-2">
        <div
          className="w-12 h-12 rounded border-2 border-gray-300 shadow-sm"
          style={{
            backgroundColor: value,
            backgroundImage:
              'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
            backgroundSize: '10px 10px',
            backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
          }}
        />
        <div className="flex-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            placeholder="#000000"
            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={7}
          />
        </div>
      </div>

      {/* Opacity Slider */}
      {showOpacity && (
        <div>
          <div className="flex justify-between text-xs text-gray-600 mb-1">
            <span>Opacity</span>
            <span>{Math.round(opacity * 100)}%</span>
          </div>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={opacity}
            onChange={handleOpacityChange}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
        </div>
      )}

      {/* Preset Colors */}
      <div>
        <div className="text-xs text-gray-600 mb-2">Presets</div>
        <div className="grid grid-cols-10 gap-1">
          {PRESET_COLORS.map((color) => (
            <button
              key={color}
              onClick={() => handlePresetClick(color)}
              className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                value.toUpperCase() === color.toUpperCase()
                  ? 'border-blue-500 ring-2 ring-blue-200'
                  : 'border-gray-300'
              }`}
              style={{
                backgroundColor: color,
                backgroundImage:
                  color === '#00000000'
                    ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                    : undefined,
                backgroundSize: '10px 10px',
                backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
              }}
              title={color}
            />
          ))}
        </div>
      </div>

      {/* Recent Colors */}
      <div>
        <div className="text-xs text-gray-600 mb-2">Recent Colors</div>
        {recentColors.length > 0 ? (
          <div className="flex gap-1">
            {recentColors.map((color, index) => (
              <button
                key={`${color}-${index}`}
                onClick={() => handlePresetClick(color)}
                className={`w-6 h-6 rounded border-2 transition-all hover:scale-110 ${
                  value.toUpperCase() === color.toUpperCase()
                    ? 'border-blue-500 ring-2 ring-blue-200'
                    : 'border-gray-300'
                }`}
                style={{
                  backgroundColor: color,
                  backgroundImage:
                    'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)',
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                }}
                title={color}
              />
            ))}
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic">No recent colors</div>
        )}</div>
    </div>
  )
}

