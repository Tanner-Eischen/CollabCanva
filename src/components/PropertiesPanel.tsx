import React, { useState } from 'react'
import { ColorPicker } from './ColorPicker'
import type { Shape } from '../types/canvas'

/**
 * PropertiesPanel Component
 * Right sidebar panel for editing selected shape properties
 */

interface PropertiesPanelProps {
  selectedShapes: Shape[]
  onUpdateColors: (
    fill?: string,
    stroke?: string,
    strokeWidth?: number
  ) => void
  onUpdateShapeProps?: (id: string, updates: Partial<Shape>) => void
  recentColors: string[]
  onRequestColorSample?: (callback: (color: string) => void) => void // PR-24: Color sampling callback
  onClose?: () => void // Performance: Close button callback
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedShapes,
  onUpdateColors,
  onUpdateShapeProps,
  recentColors,
  onRequestColorSample,
  onClose,
}) => {
  const [showFillPicker, setShowFillPicker] = useState(false)
  const [showStrokePicker, setShowStrokePicker] = useState(false)

  if (selectedShapes.length === 0) {
    return null
  }

  // Get common values or "Multiple" indicator
  const getCommonValue = <T,>(
    getValue: (shape: Shape) => T | undefined
  ): T | 'multiple' | undefined => {
    const values = selectedShapes.map(getValue)
    const firstValue = values[0]

    // Check if all values are the same
    const allSame = values.every(
      (val) => JSON.stringify(val) === JSON.stringify(firstValue)
    )

    return allSame ? firstValue : 'multiple'
  }

  const commonFill = getCommonValue((s) => s.fill)
  const commonStroke = getCommonValue((s) => s.stroke)
  const commonStrokeWidth = getCommonValue((s) => s.strokeWidth || 0)

  const handleFillChange = (color: string) => {
    onUpdateColors(color, undefined, undefined)
  }

  const handleStrokeChange = (color: string) => {
    onUpdateColors(undefined, color, undefined)
  }

  const handleStrokeWidthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const width = parseInt(e.target.value)
    onUpdateColors(undefined, undefined, width)
  }

  const handleRemoveStroke = () => {
    onUpdateColors(undefined, undefined, 0)
  }

  // Check if text shape is selected (PR-25)
  const isTextSelected = selectedShapes.length === 1 && selectedShapes[0].type === 'text'
  
  // Font family options
  const FONT_FAMILIES = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Georgia, serif',
    'Courier New, monospace',
    'Comic Sans MS, cursive',
    'Impact, fantasy',
  ]

  return (
    <div className="absolute right-0 top-0 h-full w-64 bg-white border-l border-gray-200 shadow-lg overflow-y-auto z-10">
      <div className="p-4 space-y-6">
        {/* Header with Close Button */}
        <div className="border-b pb-2 flex justify-between items-start">
          <div>
            <h3 className="text-sm font-semibold text-purple-700 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
              Design Properties
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              {selectedShapes.length === 1
                ? '1 shape selected'
                : `${selectedShapes.length} shapes selected`}
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors p-1 hover:bg-gray-100 rounded"
              title="Close design panel (Esc)"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Text Formatting Section (PR-25) */}
        {isTextSelected && (
          <div className="space-y-4 pb-4 border-b">
            <h4 className="text-xs font-semibold text-gray-500 uppercase">Text Formatting</h4>
            
            {/* Font Family */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">
                Font Family
              </label>
              <select
                value={selectedShapes[0].fontFamily || 'Inter, sans-serif'}
                onChange={(e) => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                  fontFamily: e.target.value
                })}
                className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              >
                {FONT_FAMILIES.map(font => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font.split(',')[0]}
                  </option>
                ))}
              </select>
            </div>
            
            {/* Font Size */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="text-sm font-medium text-gray-700">Font Size</label>
                <span className="text-xs text-gray-500">{selectedShapes[0].fontSize || 20}px</span>
              </div>
              <input
                type="range"
                min="12"
                max="72"
                step="1"
                value={selectedShapes[0].fontSize || 20}
                onChange={(e) => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                  fontSize: parseInt(e.target.value)
                })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>12px</span>
                <span>72px</span>
              </div>
            </div>
            
            {/* Style Toggles */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Style</label>
              <div className="flex gap-1">
                <button
                  onClick={() => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                    fontWeight: selectedShapes[0].fontWeight === 'bold' ? 'normal' : 'bold'
                  })}
                  className={`px-3 py-1 font-bold border rounded text-sm ${
                    selectedShapes[0].fontWeight === 'bold'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Bold"
                >
                  B
                </button>
                <button
                  onClick={() => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                    fontStyle: selectedShapes[0].fontStyle === 'italic' ? 'normal' : 'italic'
                  })}
                  className={`px-3 py-1 italic border rounded text-sm ${
                    selectedShapes[0].fontStyle === 'italic'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Italic"
                >
                  I
                </button>
                <button
                  onClick={() => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                    textDecoration: selectedShapes[0].textDecoration === 'underline' ? '' : 'underline'
                  })}
                  className={`px-3 py-1 underline border rounded text-sm ${
                    selectedShapes[0].textDecoration === 'underline'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Underline"
                >
                  U
                </button>
                <button
                  onClick={() => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                    textDecoration: selectedShapes[0].textDecoration === 'line-through' ? '' : 'line-through'
                  })}
                  className={`px-3 py-1 line-through border rounded text-sm ${
                    selectedShapes[0].textDecoration === 'line-through'
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                  }`}
                  title="Strikethrough"
                >
                  S
                </button>
              </div>
            </div>
            
            {/* Text Align */}
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1">Align</label>
              <div className="flex gap-1">
                {['left', 'center', 'right'].map(align => (
                  <button
                    key={align}
                    onClick={() => onUpdateShapeProps && onUpdateShapeProps(selectedShapes[0].id, {
                      textAlign: align as 'left' | 'center' | 'right'
                    })}
                    className={`flex-1 px-3 py-1 border rounded text-sm ${
                      (selectedShapes[0].textAlign || 'left') === align
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                    title={`Align ${align}`}
                  >
                    {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Fill Color */}
        <div>
          <button
            onClick={() => setShowFillPicker(!showFillPicker)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border-2 border-gray-300"
                style={{
                  backgroundColor:
                    commonFill === 'multiple' ? '#CCCCCC' : commonFill,
                  backgroundImage:
                    commonFill === 'multiple'
                      ? 'repeating-linear-gradient(45deg, #999 0, #999 2px, #CCC 2px, #CCC 4px)'
                      : undefined,
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {commonFill === 'multiple' ? 'Fill (Multiple)' : 'Fill'}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                showFillPicker ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showFillPicker && (
            <div className="mt-2 p-3 bg-gray-50 rounded">
              <ColorPicker
                value={
                  commonFill === 'multiple' ? '#3B82F6FF' : (commonFill as string)
                }
                onChange={handleFillChange}
                label=""
                recentColors={recentColors}
                showOpacity={true}
                onRequestCanvasSample={
                  onRequestColorSample
                    ? () => onRequestColorSample(handleFillChange)
                    : undefined
                }
              />
            </div>
          )}
        </div>

        {/* Stroke Color */}
        <div>
          <button
            onClick={() => setShowStrokePicker(!showStrokePicker)}
            className="w-full flex items-center justify-between p-2 rounded hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-6 h-6 rounded border-2 border-gray-300"
                style={{
                  backgroundColor:
                    commonStroke === 'multiple'
                      ? '#CCCCCC'
                      : commonStroke || 'transparent',
                  backgroundImage:
                    commonStroke === 'multiple'
                      ? 'repeating-linear-gradient(45deg, #999 0, #999 2px, #CCC 2px, #CCC 4px)'
                      : !commonStroke
                      ? 'linear-gradient(45deg, #ccc 25%, transparent 25%), linear-gradient(-45deg, #ccc 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #ccc 75%), linear-gradient(-45deg, transparent 75%, #ccc 75%)'
                      : undefined,
                  backgroundSize: '10px 10px',
                  backgroundPosition: '0 0, 0 5px, 5px -5px, -5px 0px',
                }}
              />
              <span className="text-sm font-medium text-gray-700">
                {commonStroke === 'multiple' ? 'Stroke (Multiple)' : 'Stroke'}
              </span>
            </div>
            <svg
              className={`w-4 h-4 text-gray-500 transition-transform ${
                showStrokePicker ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {showStrokePicker && (
            <div className="mt-2 p-3 bg-gray-50 rounded">
              <ColorPicker
                value={
                  commonStroke === 'multiple'
                    ? '#000000FF'
                    : (commonStroke as string) || '#000000FF'
                }
                onChange={handleStrokeChange}
                label=""
                recentColors={recentColors}
                showOpacity={true}
                onRequestCanvasSample={
                  onRequestColorSample
                    ? () => onRequestColorSample(handleStrokeChange)
                    : undefined
                }
              />
              {commonStroke && commonStroke !== 'multiple' && (
                <button
                  onClick={handleRemoveStroke}
                  className="mt-2 w-full px-3 py-1 text-xs bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors"
                >
                  Remove Stroke
                </button>
              )}
            </div>
          )}
        </div>

        {/* Stroke Width */}
        {(commonStroke || commonStroke === 'multiple') && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Stroke Width
              </span>
              <span className="text-xs text-gray-500">
                {commonStrokeWidth === 'multiple'
                  ? 'Multiple'
                  : `${commonStrokeWidth}px`}
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="1"
              value={
                commonStrokeWidth === 'multiple' ? 2 : (commonStrokeWidth as number)
              }
              onChange={handleStrokeWidthChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0px</span>
              <span>20px</span>
            </div>
          </div>
        )}

        {/* Shape-Specific Controls (PR-16) */}
        {selectedShapes.length === 1 && onUpdateShapeProps && (
          <>
            {/* Line: Arrow Controls */}
            {selectedShapes[0].type === 'line' && selectedShapes[0].arrows && (
              <div className="pt-4 border-t">
                <h4 className="text-sm font-semibold text-gray-800 mb-3">
                  Arrows
                </h4>
                <div className="space-y-2">
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedShapes[0].arrows.start || false}
                      onChange={(e) =>
                        onUpdateShapeProps(selectedShapes[0].id, {
                          arrows: {
                            ...selectedShapes[0].arrows,
                            start: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">Start Arrow</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={selectedShapes[0].arrows.end || false}
                      onChange={(e) =>
                        onUpdateShapeProps(selectedShapes[0].id, {
                          arrows: {
                            ...selectedShapes[0].arrows,
                            end: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300"
                    />
                    <span className="text-sm text-gray-700">End Arrow</span>
                  </label>
                </div>
              </div>
            )}

            {/* Polygon: Sides Control */}
            {selectedShapes[0].type === 'polygon' && selectedShapes[0].sides !== undefined && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    Sides
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedShapes[0].sides}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={selectedShapes[0].sides}
                  onChange={(e) =>
                    onUpdateShapeProps(selectedShapes[0].id, {
                      sides: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3</span>
                  <span>12</span>
                </div>
              </div>
            )}

            {/* Star: Points Control */}
            {selectedShapes[0].type === 'star' && selectedShapes[0].sides !== undefined && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    Points
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedShapes[0].sides}
                  </span>
                </div>
                <input
                  type="range"
                  min="3"
                  max="12"
                  step="1"
                  value={selectedShapes[0].sides}
                  onChange={(e) =>
                    onUpdateShapeProps(selectedShapes[0].id, {
                      sides: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3</span>
                  <span>12</span>
                </div>
              </div>
            )}

            {/* Rounded Rectangle: Corner Radius Control */}
            {selectedShapes[0].type === 'roundRect' && selectedShapes[0].cornerRadius !== undefined && (
              <div className="pt-4 border-t">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-semibold text-gray-800">
                    Corner Radius
                  </span>
                  <span className="text-xs text-gray-500">
                    {selectedShapes[0].cornerRadius}px
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={selectedShapes[0].cornerRadius}
                  onChange={(e) =>
                    onUpdateShapeProps(selectedShapes[0].id, {
                      cornerRadius: parseInt(e.target.value),
                    })
                  }
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>0px</span>
                  <span>50px</span>
                </div>
              </div>
            )}
          </>
        )}

        {/* Shape Info */}
        <div className="pt-4 border-t">
          <div className="text-xs text-gray-500 space-y-1">
            {selectedShapes.length === 1 && (
              <>
                <div className="flex justify-between">
                  <span>Type:</span>
                  <span className="font-medium text-gray-700 capitalize">
                    {selectedShapes[0].type}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="font-medium text-gray-700">
                    {Math.round(selectedShapes[0].width)} ×{' '}
                    {Math.round(selectedShapes[0].height)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Position:</span>
                  <span className="font-medium text-gray-700">
                    {Math.round(selectedShapes[0].x)},{' '}
                    {Math.round(selectedShapes[0].y)}
                  </span>
                </div>
                {selectedShapes[0].rotation && (
                  <div className="flex justify-between">
                    <span>Rotation:</span>
                    <span className="font-medium text-gray-700">
                      {Math.round(selectedShapes[0].rotation)}°
                    </span>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

