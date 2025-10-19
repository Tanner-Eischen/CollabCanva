/**
 * TilePalette Component
 * Tilemap toolbar styled like the primary canvas toolbar with nested popovers
 */

import { useEffect, useMemo, useState } from 'react'
import type { TileMode, PaletteColor } from '../../types/tilemap'
import { getTilePath } from '../../constants/tilemapDefaults'
import { PRESENCE_BAR_HEIGHT, TILE_STATUS_BAR_HEIGHT, HUD_SAFE_MARGIN } from '../../constants/layout'
import { ToolButton } from '../toolbar/ToolButton'
import type { TilemapQuickAction } from '../ai/AIQuickActionsPanel'
import { tilesetRegistry } from '../../services/tilemap/tilesetRegistry'

// Icon asset paths from public/assets used throughout the palette toolbar
const paintBrushIcon = '/assets/paint-brush-32.png'
const eraserIcon = '/assets/eraser-32.png'
const paintBucketIcon = '/assets/paint-bucket-32.png'
const eyedropperIcon = '/assets/eyedropper-32.png'
const handToolIcon = '/assets/hand-tool-32.svg'
const autoTileIcon = '/assets/auto-tile-32.svg'
const gridIcon = '/assets/grid-32.svg'
const tilePaletteIcon = '/assets/tile-palette-32.svg'
const aiSparkIcon = '/assets/ai-spark-32.svg'

interface TilePaletteProps {
  palette: PaletteColor[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  selectedVariant?: number
  onVariantChange?: (variant: number | undefined) => void
  plainColor?: string
  onPlainColorChange?: (color: string) => void
  autoTilingEnabled?: boolean
  onToggleAutoTiling?: () => void
  brushSize?: number
  onBrushSizeChange?: (size: number) => void
  mode: TileMode
  onModeChange: (mode: TileMode) => void
  tileCount: number
  cursorPosition?: { x: number; y: number }
  showGrid?: boolean
  onToggleGrid?: () => void
  isPanModeActive?: boolean
  onPanModeToggle?: () => void
  isAIQuickActionsVisible?: boolean
  onAIQuickActionsToggle?: () => void
  isAdvancedAIOpen?: boolean
  onAdvancedAIToggle?: () => void
  quickActionsPreview?: TilemapQuickAction[]
}

const MODE_BUTTONS: Array<{
  mode: TileMode
  iconPath?: string
  icon?: string
  label: string
  shortcut: string
}> = [
  {
    mode: 'stamp',
    iconPath: paintBrushIcon,
    label: 'Paint',
    shortcut: 'B'
  },
  {
    mode: 'erase',
    iconPath: eraserIcon,
    label: 'Erase',
    shortcut: 'E'
  },
  {
    mode: 'fill',
    iconPath: paintBucketIcon,
    label: 'Fill',
    shortcut: 'F'
  },
  {
    mode: 'pick',
    iconPath: eyedropperIcon,
    label: 'Eyedropper',
    shortcut: 'I'
  },
]

const VARIANT_COUNT = 9

interface TilesetPaletteEntry {
  type: string
  preview?: string
  color?: string
}

export default function TilePalette({
  palette,
  selectedIndex,
  onSelectIndex,
  selectedVariant = 0,
  onVariantChange,
  plainColor = '#ffffff',
  onPlainColorChange,
  autoTilingEnabled = true,
  onToggleAutoTiling,
  brushSize = 1,
  onBrushSizeChange,
  mode,
  onModeChange,
  tileCount,
  cursorPosition,
  showGrid = true,
  onToggleGrid,
  isPanModeActive = false,
  onPanModeToggle,
  isAIQuickActionsVisible = false,
  onAIQuickActionsToggle,
  isAdvancedAIOpen = false,
  onAdvancedAIToggle,
  quickActionsPreview,
}: TilePaletteProps) {
  const [isTilePanelOpen, setIsTilePanelOpen] = useState(false)
  const [isAIOptionsOpen, setIsAIOptionsOpen] = useState(false)
  const [variantPopupTile, setVariantPopupTile] = useState<number | null>(null)
  const [tilesetPalette, setTilesetPalette] = useState<TilesetPaletteEntry[]>([])

  const selectedTile = palette[selectedIndex]
  const isPlainTile = selectedTile?.type === 'plain'
  const tilesetPaletteMap = useMemo(() => {
    const map = new Map<string, TilesetPaletteEntry>()
    for (const entry of tilesetPalette) {
      map.set(entry.type, entry)
    }
    return map
  }, [tilesetPalette])
  const selectedTilesetEntry = selectedTile ? tilesetPaletteMap.get(selectedTile.type) : undefined
  const hasSprite = Boolean(selectedTilesetEntry?.preview)
  const previewTilePath = hasSprite ? selectedTilesetEntry?.preview ?? null : null

  const topOffset = PRESENCE_BAR_HEIGHT + HUD_SAFE_MARGIN
  const bottomOffset = TILE_STATUS_BAR_HEIGHT + HUD_SAFE_MARGIN

  // Keyboard shortcuts for palette selection and mode switching
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      const key = parseInt(e.key, 10)
      if (key >= 1 && key <= Math.min(9, palette.length)) {
        onSelectIndex(key - 1)
        e.preventDefault()
      }

      switch (e.key.toLowerCase()) {
        case 'b':
          onModeChange('stamp')
          e.preventDefault()
          break
        case 'e':
          onModeChange('erase')
          e.preventDefault()
          break
        case 'f':
          onModeChange('fill')
          e.preventDefault()
          break
        case 'i':
          onModeChange('pick')
          e.preventDefault()
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [palette.length, onSelectIndex, onModeChange])

  // Close variant selector when auto-tiling changes or panel closes
  useEffect(() => {
    if (!isTilePanelOpen || autoTilingEnabled) {
      setVariantPopupTile(null)
    }
  }, [isTilePanelOpen, autoTilingEnabled])

  const tilePreviewBackground = isPlainTile
    ? plainColor
    : selectedTilesetEntry?.color ?? '#2a2a2a'

  const aiToolbarActive = isAIOptionsOpen || isAIQuickActionsVisible || isAdvancedAIOpen
  const quickActionsSummary = useMemo(
    () => (quickActionsPreview ?? []).slice(0, 5),
    [quickActionsPreview]
  )

  useEffect(() => {
    let isActive = true

    const loadTilesetPalette = async () => {
      try {
        const types = await tilesetRegistry.getAllTypes()
        const entries = await Promise.all(
          types.map(async (type) => {
            const [preview, color] = await Promise.all([
              tilesetRegistry.getTilePath(type, 4),
              tilesetRegistry.getTerrainColor(type),
            ])

            return { type, preview, color }
          })
        )

        if (isActive) {
          setTilesetPalette(entries)
        }
      } catch (error) {
        console.error('Failed to load tileset palette from registry:', error)
        if (isActive) {
          setTilesetPalette([])
        }
      }
    }

    void loadTilesetPalette()

    return () => {
      isActive = false
    }
  }, [])

  const handleTileSelect = (index: number, type?: string) => {
    const resolvedIndex = type ? palette.findIndex((entry) => entry.type === type) : index
    const nextIndex = resolvedIndex >= 0 ? resolvedIndex : index

    if (nextIndex < 0 || nextIndex >= palette.length) {
      setVariantPopupTile(null)
      return
    }

    onSelectIndex(nextIndex)

    const tile = palette[nextIndex]
    const tilesetEntry = tile ? tilesetPaletteMap.get(tile.type) : undefined
    if (!autoTilingEnabled && tile && tilesetEntry?.preview) {
      setVariantPopupTile(nextIndex)
    } else {
      setVariantPopupTile(null)
    }
  }

  return (
    <>
      <div
        className="absolute left-2 z-50"
        style={{
          top: `${topOffset}px`,
          bottom: `${bottomOffset}px`,
        }}
      >
        <div className="w-12 h-full rounded-lg shadow-lg relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }}
          />

          <div className="relative z-10 w-full h-full flex flex-col items-center gap-2 py-3 overflow-y-auto overflow-x-hidden toolbar-scrollable">
            {MODE_BUTTONS.map((modeOption) => (
              <ToolButton
                key={modeOption.mode}
                icon={modeOption.icon}
                iconPath={modeOption.iconPath}
                label={modeOption.label}
                shortcut={modeOption.shortcut}
                active={mode === modeOption.mode}
                onClick={() => onModeChange(modeOption.mode)}
                themed
              />
            ))}

            <div className="w-9 h-px my-1 bg-white/20" />

            <ToolButton
              iconPath={handToolIcon}
              label="Hand Tool"
              shortcut="Space"
              active={isPanModeActive}
              onClick={() => onPanModeToggle?.()}
              themed
            />

            <ToolButton
              iconPath={autoTileIcon}
              label="Auto-Tile"
              shortcut="A"
              active={autoTilingEnabled}
              onClick={() => onToggleAutoTiling?.()}
              themed
              disabled={!onToggleAutoTiling}
            />

            <ToolButton
              iconPath={gridIcon}
              label="Toggle Grid"
              shortcut="G"
              active={showGrid}
              onClick={() => onToggleGrid?.()}
              themed
              disabled={!onToggleGrid}
            />

            <div className="flex-1" />

            <ToolButton
              iconPath={tilePaletteIcon}
              label="Tile Palette"
              shortcut="T"
              active={isTilePanelOpen}
              ariaHasPopup="dialog"
              ariaExpanded={isTilePanelOpen}
              ariaControls="tile-palette-popover"
              onClick={() => {
                setIsTilePanelOpen(prev => !prev)
                setIsAIOptionsOpen(false)
              }}
              themed
            />

            <ToolButton
              iconPath={aiSparkIcon}
              label="AI Commands"
              active={aiToolbarActive}
              ariaHasPopup="menu"
              ariaExpanded={isAIOptionsOpen}
              ariaControls="tile-ai-popover"
              onClick={() => {
                setIsAIOptionsOpen(prev => !prev)
                setIsTilePanelOpen(false)
              }}
              themed
            />
          </div>
        </div>
      </div>

      {isTilePanelOpen && (
        <div
          id="tile-palette-popover"
          className="absolute z-40"
          style={{
            left: '72px',
            top: `${topOffset}px`,
            bottom: `${bottomOffset}px`,
            width: '260px',
          }}
        >
          <div className="h-full flex flex-col rounded-xl shadow-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="text-white/80 text-[11px] uppercase tracking-wide font-semibold">Tile Palette</div>
              <button
                onClick={() => setIsTilePanelOpen(false)}
                className="text-white/60 hover:text-white transition-colors text-sm"
                aria-label="Close tile palette"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 px-3 py-3 space-y-3 overflow-y-auto overflow-x-hidden tilemap-panel-scroll">
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg border border-white/20 flex items-center justify-center overflow-hidden"
                  style={{
                    backgroundColor: tilePreviewBackground,
                  }}
                >
                  {hasSprite && previewTilePath ? (
                    <img
                      src={previewTilePath}
                      alt={selectedTile?.name || 'Tile preview'}
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                    />
                  ) : null}
                </div>
                <div className="flex-1 text-white/80 text-xs leading-tight space-y-1">
                  <div className="font-semibold text-sm text-white">{selectedTile?.name || 'Select a tile'}</div>
                  <div className="text-white/50">Type: {selectedTile?.type || '—'}</div>
                  <div className="text-white/50">Brush: {brushSize}×{brushSize}</div>
                </div>
              </div>

              {isPlainTile && (
                <div className="space-y-1">
                  <div className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">Plain Tile Color</div>
                  <input
                    type="color"
                    value={plainColor}
                    onChange={(e) => onPlainColorChange?.(e.target.value)}
                    className="w-full h-8 rounded cursor-pointer border border-white/20"
                  />
                </div>
              )}

              {onBrushSizeChange && (
                <div className="space-y-2">
                  <div className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">Brush Size</div>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    step="1"
                    value={brushSize}
                    onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                    className="w-full cursor-pointer brush-slider"
                    style={{
                      background: `linear-gradient(to right, white 0%, white ${((brushSize - 1) / 4) * 100}%, rgba(255,255,255,0.2) ${((brushSize - 1) / 4) * 100}%, rgba(255,255,255,0.2) 100%)`
                    }}
                  />
                </div>
              )}

              <div className="space-y-2">
                <div className="text-white/70 text-[10px] uppercase tracking-wide font-semibold">Tiles</div>
                <div className="flex flex-col gap-1">
                  {(tilesetPalette.length > 0 ? tilesetPalette.map((entry) => entry.type) : palette.map((p) => p.type))
                    .map((type, orderIndex) => {
                      const paletteIndex = palette.findIndex((paletteColor) => paletteColor.type === type)
                      const paletteColor = paletteIndex >= 0 ? palette[paletteIndex] : undefined
                      const registryEntry = tilesetPaletteMap.get(type)
                      const isPlain = type === 'plain'
                      const resolvedIndex = paletteIndex >= 0 ? paletteIndex : orderIndex
                      const isSelected = palette[selectedIndex]?.type === type || selectedIndex === resolvedIndex
                      const baseColor = paletteColor?.color ?? registryEntry?.color ?? '#2a2a2a'
                      const displayColor = isPlain
                        ? (palette[selectedIndex]?.type === 'plain' ? plainColor : baseColor)
                        : baseColor
                      const hasPreview = Boolean(registryEntry?.preview)
                      const tilePath = hasPreview ? registryEntry?.preview : null
                      const name = paletteColor?.name ?? type

                      return (
                        <button
                          key={`${type}-${resolvedIndex}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            handleTileSelect(resolvedIndex, type)
                          }}
                          className={`
                          w-full rounded-lg transition-all relative overflow-hidden flex items-center gap-2 p-2
                          ${isSelected
                            ? 'ring-2 ring-white/60 bg-white/20 shadow-lg'
                            : 'ring-1 ring-white/10 hover:ring-white/30 hover:bg-white/10'
                          }
                        `}
                        title={`${name}${resolvedIndex < 9 ? ` (${resolvedIndex + 1})` : ''}`}
                      >
                        <div
                          className="w-8 h-8 rounded flex-shrink-0 border border-white/20 overflow-hidden flex items-center justify-center"
                          style={{
                            backgroundColor: hasPreview ? '#2a2a2a' : displayColor
                          }}
                        >
                          {hasPreview && tilePath ? (
                            <img
                              src={tilePath}
                              alt={name}
                              className="w-full h-full object-contain"
                              style={{ imageRendering: 'pixelated' }}
                            />
                          ) : null}
                        </div>
                        <div className="flex-1 flex items-center justify-between">
                          <span className="text-white/90 text-sm font-medium text-left truncate">
                            {name}
                          </span>
                          {resolvedIndex < 9 && (
                            <span className="text-[9px] font-mono text-white/40">{resolvedIndex + 1}</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {!autoTilingEnabled && variantPopupTile !== null && palette[variantPopupTile] && (
                <div className="space-y-2 border border-white/10 rounded-lg p-2 bg-white/5">
                  <div className="flex items-center justify-between text-white/80 text-[11px] font-semibold">
                    <span>{palette[variantPopupTile].name} Variants</span>
                    <button
                      onClick={() => setVariantPopupTile(null)}
                      className="text-white/50 hover:text-white text-xs"
                    >
                      Close
                    </button>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {Array.from({ length: VARIANT_COUNT }, (_, variant) => {
                      const tilePath = getTilePath(palette[variantPopupTile].type, variant)

                      return (
                        <button
                          key={variant}
                          onClick={() => {
                            onVariantChange?.(variant)
                            setVariantPopupTile(null)
                          }}
                          className={`
                            w-full aspect-square rounded-lg transition-all relative overflow-hidden flex items-center justify-center
                            ${selectedVariant === variant
                              ? 'ring-2 ring-white/70 bg-white/20 shadow-lg'
                              : 'ring-1 ring-white/20 hover:ring-white/50 hover:bg-white/10'
                            }
                          `}
                          style={{
                            backgroundColor: selectedVariant === variant ? undefined : '#2a2a2a',
                            padding: '2px',
                          }}
                          title={`Variant ${variant + 1}`}
                        >
                          <img
                            src={tilePath}
                            alt={`Variant ${variant + 1}`}
                            className="w-full h-full object-contain"
                            style={{ imageRendering: 'pixelated' }}
                          />
                          <div className="absolute bottom-0 right-0 text-[8px] font-mono bg-black/80 text-white px-1 leading-none rounded-tl">
                            {variant + 1}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-[10px] text-white/50">
                    Auto-tiling is off. Pick a specific edge variant to paint.
                  </p>
                </div>
              )}

              {hasSprite && onToggleAutoTiling && (
                <button
                  onClick={onToggleAutoTiling}
                  className={`
                    w-full rounded-lg px-3 py-2 text-left text-sm transition-all
                    ${autoTilingEnabled
                      ? 'bg-white/20 text-white shadow-md'
                      : 'bg-white/10 text-white/70 hover:bg-white/15'}
                  `}
                >
                  {autoTilingEnabled ? 'Auto-Tiling Enabled' : 'Enable Auto-Tiling'}
                </button>
              )}

              <div className="grid grid-cols-2 gap-2 text-[10px] text-white/60 pt-1">
                {cursorPosition && (
                  <div className="flex flex-col gap-0.5">
                    <span className="font-semibold uppercase tracking-wide">Position</span>
                    <span className="font-mono text-white/80">
                      {cursorPosition.x},{cursorPosition.y}
                    </span>
                  </div>
                )}
                <div className="flex flex-col gap-0.5">
                  <span className="font-semibold uppercase tracking-wide">Tiles</span>
                  <span className="font-mono text-white/80">{tileCount}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {isAIOptionsOpen && (
        <div
          id="tile-ai-popover"
          className="absolute z-40"
          style={{
            left: '72px',
            top: `${topOffset}px`,
            width: '220px',
          }}
        >
          <div className="rounded-xl shadow-2xl bg-gradient-to-br from-slate-900/95 to-slate-800/95 border border-white/10 backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
              <div className="text-white/80 text-[11px] uppercase tracking-wide font-semibold">AI Commands</div>
              <button
                onClick={() => setIsAIOptionsOpen(false)}
                className="text-white/60 hover:text-white transition-colors text-sm"
                aria-label="Close AI options"
              >
                ✕
              </button>
            </div>
            <div className="p-3 space-y-3 text-sm text-white/80">
              <div>
                <p className="text-xs text-white/60 leading-snug">
                  Choose which AI interface you want to open.
                </p>
                <div className="mt-2 flex flex-col gap-2">
                  <button
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2 ${isAIQuickActionsVisible ? 'bg-white/25 text-white shadow-md' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={() => {
                      onAIQuickActionsToggle?.()
                      setIsAIOptionsOpen(false)
                    }}
                  >
                    <span>✨</span>
                    <span className="font-medium">Quick Commands</span>
                  </button>
                  <button
                    className={`w-full px-3 py-2 rounded-lg text-left transition-all flex items-center gap-2 ${isAdvancedAIOpen ? 'bg-white/25 text-white shadow-md' : 'bg-white/10 hover:bg-white/20'}`}
                    onClick={() => {
                      onAdvancedAIToggle?.()
                      setIsAIOptionsOpen(false)
                    }}
                  >
                    <span>🧠</span>
                    <span className="font-medium">Advanced Commands</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 border-t border-white/10">
                <div className="text-[10px] uppercase tracking-wide text-white/50 font-semibold">
                  Quick command previews
                </div>
                {quickActionsSummary.length > 0 ? (
                  <ul className="mt-2 space-y-2 text-xs text-white/80">
                    {quickActionsSummary.map((action) => (
                      <li
                        key={action.id}
                        className="flex gap-2 items-start bg-white/5 rounded-lg px-2 py-1.5"
                      >
                        <span className="text-base leading-tight flex-shrink-0">
                          {action.icon ?? '•'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium leading-tight">
                            {action.text}
                          </div>
                          <div className="text-[10px] text-white/60 leading-snug break-words">
                            {action.prompt}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-[11px] text-white/60 leading-snug">
                    Start painting your map to unlock context-aware quick commands.
                  </p>
                )}
                <p className="mt-2 text-[10px] text-white/40 leading-snug">
                  Use “Quick Commands” to open the full list and run one instantly.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
