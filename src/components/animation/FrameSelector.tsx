/**
 * Frame Selector Component (PR-31)
 * Select frames from a sprite sheet for animations
 */

import { useState, useRef, useEffect } from 'react'
import type { AnimationFrame } from '../../types/animation'
import { autoGenerateFrames } from '../../services/assets/animation'

interface FrameSelectorProps {
  spriteSheetUrl: string
  spriteSheetWidth: number
  spriteSheetHeight: number
  onAddFrame: (frame: AnimationFrame) => void
  onAddMultipleFrames: (frames: AnimationFrame[]) => void
}

export function FrameSelector({
  spriteSheetUrl,
  spriteSheetWidth,
  spriteSheetHeight,
  onAddFrame,
  onAddMultipleFrames
}: FrameSelectorProps) {
  const [frameWidth, setFrameWidth] = useState(32)
  const [frameHeight, setFrameHeight] = useState(32)
  const [spacing, setSpacing] = useState(0)
  const [margin, setMargin] = useState(0)
  const [selectedRegion, setSelectedRegion] = useState<AnimationFrame | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null)
  const [spriteSheetImage, setSpriteSheetImage] = useState<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load sprite sheet
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setSpriteSheetImage(img)
    img.src = spriteSheetUrl
  }, [spriteSheetUrl])

  // Draw sprite sheet with grid overlay
  useEffect(() => {
    if (!canvasRef.current || !spriteSheetImage) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = spriteSheetImage.width
    canvas.height = spriteSheetImage.height

    // Draw sprite sheet
    ctx.drawImage(spriteSheetImage, 0, 0)

    // Draw grid overlay
    ctx.strokeStyle = 'rgba(0, 120, 255, 0.3)'
    ctx.lineWidth = 1

    for (let y = margin; y < spriteSheetImage.height; y += frameHeight + spacing) {
      for (let x = margin; x < spriteSheetImage.width; x += frameWidth + spacing) {
        if (x + frameWidth <= spriteSheetImage.width && y + frameHeight <= spriteSheetImage.height) {
          ctx.strokeRect(x, y, frameWidth, frameHeight)
        }
      }
    }

    // Draw selected region
    if (selectedRegion) {
      ctx.strokeStyle = 'rgba(0, 255, 0, 0.8)'
      ctx.lineWidth = 2
      ctx.strokeRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height)
      
      // Highlight fill
      ctx.fillStyle = 'rgba(0, 255, 0, 0.1)'
      ctx.fillRect(selectedRegion.x, selectedRegion.y, selectedRegion.width, selectedRegion.height)
    }
  }, [spriteSheetImage, frameWidth, frameHeight, spacing, margin, selectedRegion])

  // Handle canvas click/drag
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDragging(true)
    setDragStart({ x, y })
    setSelectedRegion({ x, y, width: 0, height: 0 })
  }

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDragging || !dragStart || !canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const currentX = e.clientX - rect.left
    const currentY = e.clientY - rect.top

    const x = Math.min(dragStart.x, currentX)
    const y = Math.min(dragStart.y, currentY)
    const width = Math.abs(currentX - dragStart.x)
    const height = Math.abs(currentY - dragStart.y)

    setSelectedRegion({ x, y, width, height })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
    setDragStart(null)
  }

  // Handle quick frame select (click on grid cell)
  const handleQuickSelect = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) return // Don't quick select while dragging
    if (!canvasRef.current) return

    const rect = canvasRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    // Snap to grid
    const gridX = Math.floor((x - margin) / (frameWidth + spacing))
    const gridY = Math.floor((y - margin) / (frameHeight + spacing))

    const frameX = margin + gridX * (frameWidth + spacing)
    const frameY = margin + gridY * (frameHeight + spacing)

    if (
      frameX >= 0 && frameX + frameWidth <= spriteSheetWidth &&
      frameY >= 0 && frameY + frameHeight <= spriteSheetHeight
    ) {
      setSelectedRegion({
        x: frameX,
        y: frameY,
        width: frameWidth,
        height: frameHeight
      })
    }
  }

  // Add selected frame to animation
  const handleAddFrame = () => {
    if (selectedRegion && selectedRegion.width > 0 && selectedRegion.height > 0) {
      onAddFrame(selectedRegion)
    }
  }

  // Auto-generate all frames
  const handleAutoGenerateFrames = () => {
    const frames = autoGenerateFrames(
      spriteSheetWidth,
      spriteSheetHeight,
      frameWidth,
      frameHeight,
      { spacing, margin }
    )
    onAddMultipleFrames(frames)
  }

  // Common frame sizes
  const commonSizes = [16, 32, 48, 64, 128]

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Frame Size
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Width</label>
              <input
                type="number"
                value={frameWidth}
                onChange={(e) => setFrameWidth(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Height</label>
              <input
                type="number"
                value={frameHeight}
                onChange={(e) => setFrameHeight(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="1"
              />
            </div>
          </div>

          {/* Quick sizes */}
          <div className="mt-2 flex flex-wrap gap-1">
            {commonSizes.map(size => (
              <button
                key={size}
                onClick={() => {
                  setFrameWidth(size)
                  setFrameHeight(size)
                }}
                className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
              >
                {size}×{size}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Grid Settings
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Spacing</label>
              <input
                type="number"
                value={spacing}
                onChange={(e) => setSpacing(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Margin</label>
              <input
                type="number"
                value={margin}
                onChange={(e) => setMargin(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <button
          onClick={handleAutoGenerateFrames}
          className="flex-1 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors text-sm"
        >
          Auto-Generate All Frames
        </button>
        <button
          onClick={handleAddFrame}
          disabled={!selectedRegion || selectedRegion.width === 0}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          Add Selected Frame
        </button>
      </div>

      {/* Sprite sheet preview */}
      <div className="border border-gray-300 rounded overflow-auto max-h-96 bg-gray-50">
        <canvas
          ref={canvasRef}
          className="cursor-crosshair"
          style={{ imageRendering: 'pixelated' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleQuickSelect}
        />
      </div>

      {/* Selected region info */}
      {selectedRegion && selectedRegion.width > 0 && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded text-sm">
          <div className="font-medium text-blue-800 mb-1">Selected Region</div>
          <div className="grid grid-cols-2 gap-2 text-xs text-blue-700">
            <div>X: {Math.round(selectedRegion.x)}</div>
            <div>Y: {Math.round(selectedRegion.y)}</div>
            <div>Width: {Math.round(selectedRegion.width)}</div>
            <div>Height: {Math.round(selectedRegion.height)}</div>
          </div>
        </div>
      )}
    </div>
  )
}


