/**
 * QuickPropertiesPopup - Compact properties tooltip near selected shape
 * Small, tablet-style window that appears next to shape for quick edits
 */

import { useState, useEffect, useRef } from 'react'
import type { Shape } from '../types/canvas'

interface QuickPropertiesPopupProps {
  shape: Shape
  screenX: number
  screenY: number
  onUpdateColors: (fill?: string, stroke?: string, strokeWidth?: number) => void
  onOpenFullPanel: () => void
  onClose: () => void
}

export function QuickPropertiesPopup({
  shape,
  screenX,
  screenY,
  onUpdateColors,
  onOpenFullPanel,
  onClose,
}: QuickPropertiesPopupProps) {
  const [localFill, setLocalFill] = useState(shape.fill || '#3B82F6FF')
  const [localStroke, setLocalStroke] = useState(shape.stroke || '#000000FF')
  const [localStrokeWidth, setLocalStrokeWidth] = useState(shape.strokeWidth || 0)
  const popupRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [onClose])

  const handleFillChange = (color: string) => {
    setLocalFill(color)
    onUpdateColors(color, undefined, undefined)
  }

  const handleStrokeChange = (color: string) => {
    setLocalStroke(color)
    onUpdateColors(undefined, color, undefined)
  }

  const handleStrokeWidthChange = (width: number) => {
    setLocalStrokeWidth(width)
    onUpdateColors(undefined, undefined, width)
  }

  // Extract RGB and opacity from hex color
  const getRGBFromHex = (hex: string) => {
    const rgb = hex.slice(1, 7)
    const alpha = hex.slice(7, 9) || 'FF'
    return { rgb: `#${rgb}`, opacity: parseInt(alpha, 16) / 255 }
  }

  const fillData = getRGBFromHex(localFill)
  const strokeData = getRGBFromHex(localStroke)

  return (
    <div
      ref={popupRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 z-50 p-2"
      style={{
        left: Math.min(screenX + 10, window.innerWidth - 220),
        top: Math.min(screenY - 10, window.innerHeight - 200),
        width: '200px',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-1 border-b border-gray-200">
        <span className="text-xs font-semibold text-gray-700 uppercase tracking-wide">
          {shape.type}
        </span>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-0.5"
          title="Close (Esc)"
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Fill Color */}
      <div className="mb-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">Fill</label>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={fillData.rgb}
            onChange={(e) => handleFillChange(e.target.value + localFill.slice(7))}
            className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={localFill.slice(0, 7).toUpperCase()}
            onChange={(e) => {
              if (/^#[0-9A-F]{0,6}$/i.test(e.target.value)) {
                handleFillChange(e.target.value.padEnd(7, '0') + localFill.slice(7))
              }
            }}
            className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
            maxLength={7}
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={fillData.opacity}
            onChange={(e) => {
              const alpha = Math.round(parseFloat(e.target.value) * 255).toString(16).padStart(2, '0')
              handleFillChange(localFill.slice(0, 7) + alpha.toUpperCase())
            }}
            className="w-12 h-1"
            title={`Opacity: ${Math.round(fillData.opacity * 100)}%`}
          />
        </div>
      </div>

      {/* Stroke Color */}
      <div className="mb-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">Stroke</label>
        <div className="flex items-center gap-1.5">
          <input
            type="color"
            value={strokeData.rgb}
            onChange={(e) => handleStrokeChange(e.target.value + localStroke.slice(7))}
            className="w-8 h-6 rounded border border-gray-300 cursor-pointer"
          />
          <input
            type="text"
            value={localStroke.slice(0, 7).toUpperCase()}
            onChange={(e) => {
              if (/^#[0-9A-F]{0,6}$/i.test(e.target.value)) {
                handleStrokeChange(e.target.value.padEnd(7, '0') + localStroke.slice(7))
              }
            }}
            className="flex-1 px-1.5 py-0.5 text-xs border border-gray-300 rounded"
            maxLength={7}
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div className="mb-2">
        <label className="text-xs font-medium text-gray-600 block mb-1">
          Width: {localStrokeWidth}px
        </label>
        <input
          type="range"
          min="0"
          max="20"
          step="1"
          value={localStrokeWidth}
          onChange={(e) => handleStrokeWidthChange(parseInt(e.target.value))}
          className="w-full h-1"
        />
      </div>

      {/* Position Info */}
      <div className="mb-2 pb-2 border-b border-gray-200">
        <div className="text-xs text-gray-500 flex justify-between">
          <span>X: {Math.round(shape.x)}</span>
          <span>Y: {Math.round(shape.y)}</span>
          <span>W: {Math.round(shape.width || 0)}</span>
          <span>H: {Math.round(shape.height || 0)}</span>
        </div>
      </div>

      {/* More Options Button */}
      <button
        onClick={onOpenFullPanel}
        className="w-full py-1 text-xs font-medium text-blue-600 hover:bg-blue-50 rounded transition-colors"
      >
        More Options →
      </button>
    </div>
  )
}


