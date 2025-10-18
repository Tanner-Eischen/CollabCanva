/**
 * AI Quick Actions Panel
 * Contextaware AI suggestions for tilemap operations
 * PR-34: AI Tilemap Orchestration
 * 
 * Follows pattern from SmartSuggestions.tsx but optimized for tilemap workflows
 */

import { useEffect, useState, useMemo } from 'react'
import type { TilemapMeta } from '../../types/tilemap'
import type { TileLayerMeta } from '../../types/tileLayer'
import { detectGameType } from '../../services/ai/gameTypeDetection'
import { PRESENCE_BAR_HEIGHT, HUD_SAFE_MARGIN } from '../../constants/layout'

export interface TilemapQuickAction {
  id: string
  text: string
  prompt: string // What to send to AI
  icon?: string
  category: 'generate' | 'improve' | 'beautify' | 'balance' | 'complete'
  layerSpecific?: boolean // Whether action targets specific layer
}

interface AIQuickActionsPanelProps {
  tilemapMeta: TilemapMeta
  tileCount: number
  onActionClick: (prompt: string, layerId?: string) => void
  maxActions?: number
}

export default function AIQuickActionsPanel({
  tilemapMeta,
  tileCount,
  onActionClick,
  maxActions = 6,
}: AIQuickActionsPanelProps) {
  const [actions, setActions] = useState<TilemapQuickAction[]>([])
  const [selectedLayer, setSelectedLayer] = useState<string | null>(null)

  const layers = useMemo(() => tilemapMeta.layers || [], [tilemapMeta.layers])
  const topOffset = PRESENCE_BAR_HEIGHT + HUD_SAFE_MARGIN

  // Generate context-aware actions
  useEffect(() => {
    const newActions = generateTilemapQuickActions(tilemapMeta, tileCount, layers, selectedLayer)
    setActions(newActions.slice(0, maxActions))
  }, [tilemapMeta, tileCount, layers, selectedLayer, maxActions])

  if (actions.length === 0) {
    return null
  }

  return (
    <div
      className="fixed right-4 w-72 z-30 animate-slide-in-right"
      style={{ top: topOffset }}
    >
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <span>✨</span>
              <span>AI Quick Actions</span>
            </h3>
          </div>

          {/* Layer Selector (if multi-layer) */}
          {layers.length > 1 && (
            <select
              value={selectedLayer || ''}
              onChange={(e) => setSelectedLayer(e.target.value || null)}
              className="w-full px-2 py-1 text-xs rounded bg-white/10 text-white border border-white/20 hover:bg-white/20 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-blue-400"
            >
              <option value="" className="bg-slate-800">
                All Layers
              </option>
              {layers.map((layer) => (
                <option key={layer.id} value={layer.id} className="bg-slate-800">
                  {layer.name} (z:{layer.z})
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-3 space-y-2 max-h-96 overflow-y-auto custom-scrollbar">
          {actions.map((action) => (
            <button
              key={action.id}
              onClick={() => onActionClick(action.prompt, selectedLayer || undefined)}
              className={`
                w-full px-3 py-2 rounded-lg text-left text-sm
                transition-all duration-200
                ${getCategoryStyle(action.category)}
                hover:scale-[1.02] active:scale-[0.98]
                flex items-start gap-2
              `}
              title={action.prompt}
            >
              {action.icon && <span className="text-base flex-shrink-0">{action.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="font-medium">{action.text}</div>
                <div className="text-[10px] opacity-70 mt-0.5 truncate">{action.prompt}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Footer Stats */}
        <div className="px-4 py-2 border-t border-white/10 bg-black/20">
          <div className="flex items-center justify-between text-[10px] text-white/50">
            <span>{tileCount} tiles</span>
            <span>{layers.length} layers</span>
            <span>{tilemapMeta.width}×{tilemapMeta.height}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Generate tilemap-specific actions
 */
export function generateTilemapQuickActions(
  meta: TilemapMeta,
  tileCount: number,
  layers: TileLayerMeta[],
  selectedLayerId: string | null
): TilemapQuickAction[] {
  const actions: TilemapQuickAction[] = []

  // Empty tilemap suggestions
  if (tileCount === 0) {
    actions.push({
      id: 'gen_terrain',
      text: 'Generate Terrain',
      prompt: 'Generate natural terrain using Perlin noise with grass, dirt, and stone',
      icon: '🌍',
      category: 'generate',
    })

    actions.push({
      id: 'gen_cave',
      text: 'Create Cave System',
      prompt: 'Generate a cave dungeon using cellular automata',
      icon: '🕳️',
      category: 'generate',
    })

    actions.push({
      id: 'gen_platformer',
      text: 'Generate Platformer Level',
      prompt: 'Create a platformer level with platforms, gaps, and terrain',
      icon: '🎮',
      category: 'generate',
    })

    return actions
  }

  // Detect game type for context
  const detection = detectGameType([], meta, tileCount)

  // Improvement suggestions for existing tilemaps
  if (tileCount > 0 && tileCount < 200) {
    actions.push({
      id: 'expand',
      text: 'Expand Tilemap',
      prompt: 'Expand the tilemap in all directions with matching terrain',
      icon: '➕',
      category: 'improve',
    })
  }

  // Beautification suggestions
  if (tileCount > 20) {
    actions.push({
      id: 'beautify',
      text: 'Beautify Terrain',
      prompt: 'Add natural variation and detail to the terrain (cliffs, edges, transitions)',
      icon: '🎨',
      category: 'beautify',
    })

    actions.push({
      id: 'add_decorations',
      text: 'Add Decorations',
      prompt: 'Add decorative elements like flowers, rocks, and props',
      icon: '🌸',
      category: 'beautify',
    })
  }

  // Layer-specific suggestions
  if (layers.length > 1 && selectedLayerId) {
    const selectedLayer = layers.find((l) => l.id === selectedLayerId)
    if (selectedLayer) {
      actions.push({
        id: 'fill_layer',
        text: `Fill ${selectedLayer.name}`,
        prompt: `Fill the ${selectedLayer.name} layer with appropriate tiles`,
        icon: '🪣',
        category: 'complete',
        layerSpecific: true,
      })
    }
  }

  // Collectibles and gameplay
  if (detection.type === 'platformer' && tileCount > 50) {
    actions.push({
      id: 'add_collectibles',
      text: 'Add Collectibles',
      prompt: 'Place collectible items (coins, gems) throughout the level in strategic positions',
      icon: '💰',
      category: 'complete',
    })

    actions.push({
      id: 'balance_difficulty',
      text: 'Balance Difficulty',
      prompt: 'Analyze and balance the level difficulty (gaps, platform spacing, challenges)',
      icon: '⚖️',
      category: 'balance',
    })
  }

  if (detection.type === 'top-down' && tileCount > 50) {
    actions.push({
      id: 'add_paths',
      text: 'Add Paths/Roads',
      prompt: 'Add winding paths or roads connecting areas',
      icon: '🛣️',
      category: 'improve',
    })

    actions.push({
      id: 'add_water',
      text: 'Add Water Features',
      prompt: 'Add rivers, lakes, or ponds to the terrain',
      icon: '🌊',
      category: 'beautify',
    })
  }

  // Animated tiles suggestion
  if (tileCount > 0) {
    actions.push({
      id: 'add_animated',
      text: 'Add Animated Tiles',
      prompt: 'Convert water tiles to animated water and add animated torch effects',
      icon: '🌀',
      category: 'beautify',
    })
  }

  // Symmetry and patterns
  if (tileCount > 100) {
    actions.push({
      id: 'create_symmetry',
      text: 'Create Symmetry',
      prompt: 'Make the tilemap symmetrical (horizontal or vertical)',
      icon: '🔄',
      category: 'improve',
    })
  }

  // Auto-tiling suggestion
  if (tileCount > 20) {
    actions.push({
      id: 'apply_autotile',
      text: 'Apply Auto-Tiling',
      prompt: 'Apply auto-tiling variants to all tiles for smooth transitions',
      icon: '🧩',
      category: 'beautify',
    })
  }

  // Optimization for large maps
  if (tileCount > 1000) {
    actions.push({
      id: 'optimize',
      text: 'Optimize Tilemap',
      prompt: 'Analyze and optimize the tilemap for better performance',
      icon: '⚡',
      category: 'balance',
    })
  }

  return actions
}

/**
 * Get style class for action category
 */
function getCategoryStyle(category: TilemapQuickAction['category']): string {
  switch (category) {
    case 'generate':
      return 'bg-green-500/20 hover:bg-green-500/30 text-green-100 border border-green-500/30'
    case 'improve':
      return 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-100 border border-blue-500/30'
    case 'beautify':
      return 'bg-purple-500/20 hover:bg-purple-500/30 text-purple-100 border border-purple-500/30'
    case 'balance':
      return 'bg-orange-500/20 hover:bg-orange-500/30 text-orange-100 border border-orange-500/30'
    case 'complete':
      return 'bg-pink-500/20 hover:bg-pink-500/30 text-pink-100 border border-pink-500/30'
    default:
      return 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
  }
}

