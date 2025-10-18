/**
 * Tileset Configurator Component (PR-31)
 * Configure sprite sheet slicing and auto-tile mapping
 */

import { useState, useEffect, useRef, useMemo } from 'react'
import {
  autoDetectTileSize,
  sliceTileset,
  validateTilesetConfig,
  loadImage,
  getImageData
} from '../../utils/tilemap/tilesetSlicer'
import type { Asset, TilesetMetadata } from '../../types/asset'

interface TilesetConfiguratorProps {
  asset: Asset
  onSave: (metadata: TilesetMetadata) => Promise<void>
  onClose: () => void
}

export function TilesetConfigurator({ asset, onSave, onClose }: TilesetConfiguratorProps) {
  const [tileWidth, setTileWidth] = useState(32)
  const [tileHeight, setTileHeight] = useState(32)
  const [spacing, setSpacing] = useState(0)
  const [margin, setMargin] = useState(0)
  const [isDetecting, setIsDetecting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [validation, setValidation] = useState<{ valid: boolean; errors: string[]; warnings: string[] } | null>(null)
  const [previewImage, setPreviewImage] = useState<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // Load image
  useEffect(() => {
    const loadImg = async () => {
      try {
        const img = await loadImage(asset.url)
        setPreviewImage(img)

        // Auto-detect on initial load
        handleAutoDetect(img)
      } catch (error) {
        console.error('Failed to load image:', error)
      }
    }

    loadImg()
  }, [asset.url])

  // Auto-detect tile size
  const handleAutoDetect = async (img?: HTMLImageElement) => {
    const image = img || previewImage
    if (!image) return

    setIsDetecting(true)
    try {
      const imageData = getImageData(image)
      const detection = autoDetectTileSize(imageData)
      
      setTileWidth(detection.tileWidth)
      setTileHeight(detection.tileHeight)
      setSpacing(detection.spacing)
      setMargin(detection.margin)
    } catch (error) {
      console.error('Auto-detection failed:', error)
    } finally {
      setIsDetecting(false)
    }
  }

  // Validate configuration
  useEffect(() => {
    if (!previewImage) return

    const result = validateTilesetConfig(
      previewImage.width,
      previewImage.height,
      tileWidth,
      tileHeight,
      spacing,
      margin
    )
    setValidation(result)
  }, [previewImage, tileWidth, tileHeight, spacing, margin])

  // Calculate tile grid
  const tileGrid = useMemo(() => {
    if (!previewImage || !validation?.valid) return null

    const imageData = getImageData(previewImage)
    return sliceTileset(imageData, tileWidth, tileHeight, spacing, margin)
  }, [previewImage, tileWidth, tileHeight, spacing, margin, validation])

  // Draw preview
  useEffect(() => {
    if (!canvasRef.current || !previewImage || !tileGrid) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    canvas.width = previewImage.width
    canvas.height = previewImage.height

    // Draw image
    ctx.drawImage(previewImage, 0, 0)

    // Draw grid overlay
    ctx.strokeStyle = 'rgba(255, 0, 0, 0.5)'
    ctx.lineWidth = 1

    tileGrid.tiles.forEach(tile => {
      ctx.strokeRect(tile.x, tile.y, tile.width, tile.height)
    })

    // Draw tile indices
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'
    ctx.font = `${Math.min(tileWidth, tileHeight) / 3}px sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    tileGrid.tiles.forEach(tile => {
      const centerX = tile.x + tile.width / 2
      const centerY = tile.y + tile.height / 2
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.9)'
      ctx.fillText(tile.index.toString(), centerX, centerY)
    })
  }, [previewImage, tileGrid, tileWidth, tileHeight])

  // Save configuration
  const handleSave = async () => {
    if (!validation?.valid || !tileGrid) return

    setIsSaving(true)
    try {
      await onSave(tileGrid.metadata)
      onClose()
    } catch (error) {
      console.error('Failed to save tileset config:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Common tile sizes
  const commonSizes = [8, 16, 24, 32, 48, 64, 128]

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Configure Tileset</h2>
            <p className="text-sm text-gray-600 mt-1">{asset.name}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isSaving}
          >
            ×
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Preview */}
          <div className="flex-1 p-4 overflow-auto bg-gray-50">
            <div className="flex items-center justify-center min-h-full">
              <canvas
                ref={canvasRef}
                className="border border-gray-300 shadow-sm max-w-full"
                style={{
                  imageRendering: 'pixelated',
                  maxHeight: '70vh'
                }}
              />
            </div>
          </div>

          {/* Configuration panel */}
          <div className="w-80 border-l border-gray-200 p-4 overflow-y-auto">
            <div className="space-y-4">
              {/* Auto-detect button */}
              <button
                onClick={() => handleAutoDetect()}
                disabled={isDetecting || !previewImage}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDetecting ? 'Detecting...' : 'Auto-Detect Grid'}
              </button>

              {/* Tile size */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tile Size
                </label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Width</label>
                    <input
                      type="number"
                      value={tileWidth}
                      onChange={(e) => setTileWidth(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Height</label>
                    <input
                      type="number"
                      value={tileHeight}
                      onChange={(e) => setTileHeight(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      min="1"
                    />
                  </div>
                </div>

                {/* Common sizes */}
                <div className="flex flex-wrap gap-1">
                  {commonSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => {
                        setTileWidth(size)
                        setTileHeight(size)
                      }}
                      className="px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                    >
                      {size}×{size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Spacing */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Spacing
                  <span className="text-xs text-gray-500 ml-1">(between tiles)</span>
                </label>
                <input
                  type="number"
                  value={spacing}
                  onChange={(e) => setSpacing(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* Margin */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Margin
                  <span className="text-xs text-gray-500 ml-1">(around grid)</span>
                </label>
                <input
                  type="number"
                  value={margin}
                  onChange={(e) => setMargin(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="0"
                />
              </div>

              {/* Stats */}
              {tileGrid && validation?.valid && (
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  <h3 className="text-sm font-medium text-green-800 mb-2">Grid Info</h3>
                  <div className="space-y-1 text-xs text-green-700">
                    <p>Columns: {tileGrid.metadata.columns}</p>
                    <p>Rows: {tileGrid.metadata.rows}</p>
                    <p>Total Tiles: {tileGrid.metadata.tileCount}</p>
                  </div>
                </div>
              )}

              {/* Validation errors */}
              {validation && !validation.valid && (
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Configuration Issues</h3>
                  <div className="space-y-1">
                    {validation.errors.map((error, i) => (
                      <p key={i} className="text-xs text-red-700">• {error}</p>
                    ))}
                  </div>
                </div>
              )}

              {/* Image info */}
              {previewImage && (
                <div className="pt-4 border-t border-gray-200">
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Image Info</h3>
                  <div className="space-y-1 text-xs text-gray-600">
                    <p>Dimensions: {previewImage.width} × {previewImage.height}</p>
                    <p>File Size: {(asset.metadata.fileSize / 1024).toFixed(1)} KB</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!validation?.valid || isSaving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? 'Saving...' : 'Save Configuration'}
          </button>
        </div>
      </div>
    </div>
  )
}


