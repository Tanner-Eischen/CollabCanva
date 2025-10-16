import React, { useState, useEffect } from 'react'

/**
 * ColorPicker Component
 * Provides color selection with presets, hex input, opacity, recent colors, and eyedropper
 */

// TypeScript declarations for EyeDropper API
interface EyeDropperResult {
  sRGBHex: string
}

interface EyeDropperAPI {
  open: () => Promise<EyeDropperResult>
}

declare global {
  interface Window {
    EyeDropper?: new () => EyeDropperAPI
  }
}

interface ColorPickerProps {
  value: string // Current color value (RGBA hex format)
  onChange: (color: string) => void
  label: string // "Fill" or "Stroke"
  recentColors?: string[] // Recently used colors
  showOpacity?: boolean // Show opacity slider (default: true)
  onRequestCanvasSample?: () => void // Callback for fallback canvas sampling
}

// Expanded preset color palette (80 colors organized by hue)
const PRESET_COLORS = [
  // Row 1: Grays & Basics
  '#FFFFFFFF', '#F3F4F6FF', '#E5E7EBFF', '#D1D5DBFF', '#9CA3AFFF', 
  '#6B7280FF', '#4B5563FF', '#374151FF', '#1F2937FF', '#000000FF',
  
  // Row 2: Reds
  '#FEE2E2FF', '#FECACAFF', '#FCA5A5FF', '#F87171FF', '#EF4444FF',
  '#DC2626FF', '#B91C1CFF', '#991B1BFF', '#7F1D1DFF', '#450A0AFF',
  
  // Row 3: Oranges
  '#FFEDD5FF', '#FED7AAFF', '#FDBA74FF', '#FB923CFF', '#F97316FF',
  '#EA580CFF', '#C2410CFF', '#9A3412FF', '#7C2D12FF', '#431407FF',
  
  // Row 4: Yellows
  '#FEF3C7FF', '#FDE68AFF', '#FCD34DFF', '#FBBF24FF', '#F59E0BFF',
  '#D97706FF', '#B45309FF', '#92400EFF', '#78350FFF', '#451A03FF',
  
  // Row 5: Greens
  '#D1FAE5FF', '#A7F3D0FF', '#6EE7B7FF', '#34D399FF', '#10B981FF',
  '#059669FF', '#047857FF', '#065F46FF', '#064E3BFF', '#022C22FF',
  
  // Row 6: Blues
  '#DBEAFEFF', '#BFDBFEFF', '#93C5FDFF', '#60A5FAFF', '#3B82F6FF',
  '#2563EBFF', '#1D4ED8FF', '#1E40AFFF', '#1E3A8AFF', '#172554FF',
  
  // Row 7: Purples
  '#F3E8FFFF', '#E9D5FFFF', '#D8B4FEFF', '#C084FCFF', '#A855F7FF',
  '#9333EAFF', '#7E22CEFF', '#6B21A8FF', '#581C87FF', '#3B0764FF',
  
  // Row 8: Pinks
  '#FCE7F3FF', '#FBCFE8FF', '#F9A8D4FF', '#F472B6FF', '#EC4899FF',
  '#DB2777FF', '#BE185DFF', '#9D174DFF', '#831843FF', '#500724FF',
]

// Color names for tooltips
const COLOR_NAMES: Record<string, string> = {
  '#FFFFFFFF': 'White',
  '#F3F4F6FF': 'Gray 100',
  '#E5E7EBFF': 'Gray 200',
  '#D1D5DBFF': 'Gray 300',
  '#9CA3AFFF': 'Gray 400',
  '#6B7280FF': 'Gray 500',
  '#4B5563FF': 'Gray 600',
  '#374151FF': 'Gray 700',
  '#1F2937FF': 'Gray 800',
  '#000000FF': 'Black',
  '#FEE2E2FF': 'Red 100',
  '#EF4444FF': 'Red 500',
  '#450A0AFF': 'Red 950',
  '#FFEDD5FF': 'Orange 100',
  '#F97316FF': 'Orange 500',
  '#431407FF': 'Orange 950',
  '#FEF3C7FF': 'Yellow 100',
  '#F59E0BFF': 'Yellow 500',
  '#451A03FF': 'Yellow 950',
  '#D1FAE5FF': 'Green 100',
  '#10B981FF': 'Green 500',
  '#022C22FF': 'Green 950',
  '#DBEAFEFF': 'Blue 100',
  '#3B82F6FF': 'Blue 500',
  '#172554FF': 'Blue 950',
  '#F3E8FFFF': 'Purple 100',
  '#A855F7FF': 'Purple 500',
  '#3B0764FF': 'Purple 950',
  '#FCE7F3FF': 'Pink 100',
  '#EC4899FF': 'Pink 500',
  '#500724FF': 'Pink 950',
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  recentColors = [],
  showOpacity = true,
  onRequestCanvasSample,
}) => {
  const [hexInput, setHexInput] = useState(value.slice(0, 7)) // Remove alpha
  const [opacity, setOpacity] = useState(
    parseInt(value.slice(7, 9) || 'FF', 16) / 255
  )
  const [isPickingColor, setIsPickingColor] = useState(false)
  
  // Check if EyeDropper API is supported
  const supportsEyeDropper = typeof window !== 'undefined' && 'EyeDropper' in window

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
  
  // Handle eyedropper tool
  const handleEyedropper = async () => {
    if (!window.EyeDropper) {
      // Fallback to canvas sampling
      if (onRequestCanvasSample) {
        onRequestCanvasSample()
      } else {
        alert('Eyedropper not supported in this browser. Try Chrome or Edge.')
      }
      return
    }
    
    try {
      setIsPickingColor(true)
      const eyeDropper = new window.EyeDropper()
      const result = await eyeDropper.open()
      
      // Convert picked color to uppercase and add current opacity
      const pickedHex = result.sRGBHex.toUpperCase()
      const alpha = Math.round(opacity * 255)
        .toString(16)
        .padStart(2, '0')
        .toUpperCase()
      
      const colorWithAlpha = pickedHex + alpha
      setHexInput(pickedHex)
      onChange(colorWithAlpha)
    } catch (error) {
      // User cancelled or error occurred
      console.log('Eyedropper cancelled:', error)
    } finally {
      setIsPickingColor(false)
    }
  }

  return (
    <div className="space-y-3">
      {/* Label */}
      <div className="text-sm font-medium text-gray-700">{label}</div>

      {/* Current Color Preview with Eyedropper */}
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
        <div className="flex-1 flex gap-1">
          <input
            type="text"
            value={hexInput}
            onChange={handleHexInputChange}
            placeholder="#000000"
            className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={7}
          />
          <button
            onClick={handleEyedropper}
            disabled={isPickingColor}
            className={`px-2 py-1 border rounded transition-colors ${
              isPickingColor
                ? 'bg-gray-100 text-gray-400 border-gray-300 cursor-wait'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50 hover:border-blue-500'
            }`}
            title={
              supportsEyeDropper
                ? 'Pick color from screen'
                : 'Pick color from canvas (fallback)'
            }
          >
            {isPickingColor ? (
              <span className="text-sm">⏳</span>
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            )}
          </button>
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

      {/* Preset Colors - Scrollable Grid */}
      <div>
        <div className="text-xs text-gray-600 mb-2">Presets (80 colors)</div>
        <div 
          className="grid grid-cols-10 gap-1 max-h-60 overflow-y-auto pr-1"
          style={{ scrollbarWidth: 'thin' }}
        >
          {PRESET_COLORS.map((color, index) => (
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
              }}
              title={COLOR_NAMES[color] || color}
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

