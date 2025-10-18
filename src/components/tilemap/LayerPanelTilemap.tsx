/**
 * LayerPanelTilemap Component
 * Figma-style layer management panel for tilemap editing
 * Features: visibility toggles, layer locking, z-order management, drag-to-reorder
 */

import { useState, useCallback } from 'react'
import { Tooltip } from '../ui/Tooltip'
import { useLayerContext, useSortedLayers } from '../../hooks/useLayerManagement'
import type { TileLayerMeta } from '../../types/tileLayer'
import { PRESENCE_BAR_HEIGHT, HUD_SAFE_MARGIN } from '../../constants/layout'

interface LayerPanelTilemapProps {
  canvasId: string
  onLayerUpdate: (layerId: string, updates: Partial<TileLayerMeta>) => Promise<void>
  onLayerReorder?: (layerId: string, newZ: number) => Promise<void>
  onAddLayer?: () => void
  onDeleteLayer?: (layerId: string) => void
}

/**
 * Individual layer item with controls
 */
function LayerItem({
  layer,
  isActive,
  onSelect,
  onToggleVisibility,
  onToggleLock,
  onMove,
  canMoveUp,
  canMoveDown,
}: {
  layer: TileLayerMeta
  isActive: boolean
  onSelect: () => void
  onToggleVisibility: () => void
  onToggleLock: () => void
  onMove: (direction: 'up' | 'down') => void
  canMoveUp: boolean
  canMoveDown: boolean
}) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      className={`
        group relative flex items-center gap-2 px-3 py-2 rounded-md cursor-pointer transition-all
        ${isActive 
          ? 'bg-blue-500/20 border border-blue-500/50' 
          : 'hover:bg-white/5 border border-transparent'
        }
      `}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Layer Color Indicator */}
      <div 
        className="w-3 h-3 rounded-sm flex-shrink-0"
        style={{ 
          background: layer.z < 0 
            ? 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)' 
            : layer.z > 10
            ? 'linear-gradient(135deg, #f59e0b 0%, #b45309 100%)'
            : 'linear-gradient(135deg, #10b981 0%, #047857 100%)'
        }}
      />

      {/* Layer Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">
            {layer.name}
          </span>
          {layer.parallax && (
            <span className="text-[10px] text-blue-400 font-mono bg-blue-500/10 px-1 rounded">
              ✨ {layer.parallax.x}x
            </span>
          )}
        </div>
        <div className="text-[10px] text-white/50 font-mono">
          z: {layer.z} {layer.opacity !== undefined && layer.opacity < 1 && `• ${Math.round(layer.opacity * 100)}%`}
        </div>
      </div>

      {/* Layer Controls */}
      <div className="flex items-center gap-1 flex-shrink-0">
        {/* Visibility Toggle */}
        <Tooltip content={layer.visible ? 'Hide Layer' : 'Show Layer'} side="top" delay={500}>
          <button
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all
              ${layer.visible 
                ? 'text-white hover:bg-white/10' 
                : 'text-white/30 hover:bg-white/10'
              }
            `}
            onClick={(e) => {
              e.stopPropagation()
              onToggleVisibility()
            }}
          >
            {layer.visible ? '👁️' : '👁️‍🗨️'}
          </button>
        </Tooltip>

        {/* Lock Toggle */}
        <Tooltip content={layer.locked ? 'Unlock Layer' : 'Lock Layer'} side="top" delay={500}>
          <button
            className={`
              w-6 h-6 rounded flex items-center justify-center transition-all
              ${layer.locked 
                ? 'text-amber-400 hover:bg-amber-500/10' 
                : 'text-white/30 hover:bg-white/10'
              }
            `}
            onClick={(e) => {
              e.stopPropagation()
              onToggleLock()
            }}
          >
            {layer.locked ? '🔒' : '🔓'}
          </button>
        </Tooltip>

        {/* Move Controls (visible on hover or active) */}
        {(isHovered || isActive) && (
          <div className="flex flex-col gap-0">
            <Tooltip content="Move Up" side="top" delay={500}>
              <button
                className={`
                  w-5 h-3 rounded-t flex items-center justify-center text-[10px] transition-all
                  ${canMoveUp 
                    ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                    : 'text-white/20 cursor-not-allowed'
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation()
                  if (canMoveUp) onMove('up')
                }}
                disabled={!canMoveUp}
              >
                ▲
              </button>
            </Tooltip>
            <Tooltip content="Move Down" side="top" delay={500}>
              <button
                className={`
                  w-5 h-3 rounded-b flex items-center justify-center text-[10px] transition-all
                  ${canMoveDown 
                    ? 'text-white/70 hover:bg-white/10 hover:text-white' 
                    : 'text-white/20 cursor-not-allowed'
                  }
                `}
                onClick={(e) => {
                  e.stopPropagation()
                  if (canMoveDown) onMove('down')
                }}
                disabled={!canMoveDown}
              >
                ▼
              </button>
            </Tooltip>
          </div>
        )}
      </div>
    </div>
  )
}

/**
 * Main Layer Panel Component
 */
export default function LayerPanelTilemap({
  canvasId,
  onLayerUpdate,
  onLayerReorder,
  onAddLayer,
  onDeleteLayer,
}: LayerPanelTilemapProps) {
  const { isPanelOpen, togglePanel, activeLayerId, setActiveLayer } = useLayerContext()
  const layers = useSortedLayers()
  const topOffset = PRESENCE_BAR_HEIGHT + HUD_SAFE_MARGIN

  const handleToggleVisibility = useCallback(async (layer: TileLayerMeta) => {
    await onLayerUpdate(layer.id, { visible: !layer.visible })
  }, [onLayerUpdate])

  const handleToggleLock = useCallback(async (layer: TileLayerMeta) => {
    await onLayerUpdate(layer.id, { locked: !layer.locked })
  }, [onLayerUpdate])

  const handleMove = useCallback(async (layer: TileLayerMeta, direction: 'up' | 'down') => {
    if (!onLayerReorder) return

    const sortedLayers = [...layers]
    const currentIndex = sortedLayers.findIndex(l => l.id === layer.id)
    
    if (direction === 'up' && currentIndex < layers.length - 1) {
      const targetLayer = sortedLayers[currentIndex + 1]
      const newZ = targetLayer.z + 1
      await onLayerReorder(layer.id, newZ)
    } else if (direction === 'down' && currentIndex > 0) {
      const targetLayer = sortedLayers[currentIndex - 1]
      const newZ = targetLayer.z - 1
      await onLayerReorder(layer.id, newZ)
    }
  }, [layers, onLayerReorder])

  if (!isPanelOpen) {
    return (
      <div className="fixed right-4 z-50" style={{ top: topOffset }}>
        <Tooltip content="Show Layers Panel" side="left">
          <button
            onClick={togglePanel}
            className="
              w-10 h-10 rounded-lg flex items-center justify-center
              bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md
              border border-white/10 shadow-lg hover:shadow-xl transition-all
              text-white text-xl
            "
          >
            📋
          </button>
        </Tooltip>
      </div>
    )
  }

  return (
    <div
      className="
        fixed right-4 w-80 z-50
        bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md
        rounded-lg shadow-2xl border border-white/10
        flex flex-col max-h-[calc(100vh-32px)]
        animate-slide-in-right
      "
      style={{ top: topOffset }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="text-lg">🎨</span>
          <h3 className="text-sm font-semibold text-white">Layers</h3>
          <span className="text-xs text-white/50 font-mono">({layers.length})</span>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Add Layer Button */}
          {onAddLayer && (
            <Tooltip content="Add New Layer" side="left">
              <button
                onClick={onAddLayer}
                className="
                  w-7 h-7 rounded flex items-center justify-center
                  text-white/70 hover:text-white hover:bg-white/10 transition-all
                "
              >
                ➕
              </button>
            </Tooltip>
          )}
          
          {/* Close Panel */}
          <Tooltip content="Hide Layers Panel" side="left">
            <button
              onClick={togglePanel}
              className="
                w-7 h-7 rounded flex items-center justify-center
                text-white/70 hover:text-white hover:bg-white/10 transition-all
              "
            >
              ✕
            </button>
          </Tooltip>
        </div>
      </div>

      {/* Layer List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
        {layers.length === 0 ? (
          <div className="text-center text-white/50 text-sm py-8">
            No layers yet
            {onAddLayer && (
              <button
                onClick={onAddLayer}
                className="block mx-auto mt-2 text-blue-400 hover:text-blue-300"
              >
                + Add First Layer
              </button>
            )}
          </div>
        ) : (
          // Render layers in reverse z-order (top to bottom = high z to low z)
          [...layers].reverse().map((layer, index) => (
            <LayerItem
              key={layer.id}
              layer={layer}
              isActive={activeLayerId === layer.id}
              onSelect={() => setActiveLayer(layer.id)}
              onToggleVisibility={() => handleToggleVisibility(layer)}
              onToggleLock={() => handleToggleLock(layer)}
              onMove={(direction) => handleMove(layer, direction)}
              canMoveUp={index > 0}
              canMoveDown={index < layers.length - 1}
            />
          ))
        )}
      </div>

      {/* Footer with Keyboard Shortcuts */}
      <div className="px-4 py-2 border-t border-white/10 text-[10px] text-white/40 font-mono">
        <div className="flex items-center justify-between">
          <span>Active: {layers.find(l => l.id === activeLayerId)?.name || 'None'}</span>
          <span>L: Toggle Panel</span>
        </div>
      </div>
    </div>
  )
}

