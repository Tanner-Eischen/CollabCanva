import { useState, useEffect } from 'react'
import { ToolButton } from '../ToolButton'
import type { TileMode, PaletteColor } from '../../types/tilemap'
import { hasSpriteAsset, getTilePath } from '../../constants/tilemapDefaults'

interface TilemapToolbarProps {
  mode: TileMode
  onModeChange: (mode: TileMode) => void
  brushSize: number
  onBrushSizeChange: (size: number) => void
  autoTilingEnabled: boolean
  onToggleAutoTiling: () => void
  showGrid: boolean
  onToggleGrid: () => void
  canUndo?: boolean
  canRedo?: boolean
  onUndo?: () => void
  onRedo?: () => void
  palette: PaletteColor[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  selectedVariant?: number
  onVariantChange?: (variant: number) => void
  plainColor?: string
  onPlainColorChange?: (color: string) => void
}

export default function TilemapToolbar({
  mode,
  onModeChange,
  brushSize,
  onBrushSizeChange,
  autoTilingEnabled,
  onToggleAutoTiling,
  showGrid,
  onToggleGrid,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  palette,
  selectedIndex,
  onSelectIndex,
  selectedVariant = 0,
  onVariantChange,
  plainColor = '#ffffff',
  onPlainColorChange,
}: TilemapToolbarProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [variantPopupTile, setVariantPopupTile] = useState<number | null>(null)

  const selectedTile = palette[selectedIndex]
  const isPlainTile = selectedTile?.type === 'plain'
  const hasSprite = selectedTile && hasSpriteAsset(selectedTile.type)

  const modes: Array<{
    mode: TileMode
    icon: string
    iconPath?: string
    label: string
    shortcut: string
  }> = [
    { mode: 'stamp', iconPath: '/assets/paint-brush-32.ico', icon: '✎', label: 'Paint', shortcut: 'B' },
    { mode: 'erase', iconPath: '/assets/eraser-32.ico', icon: '⌫', label: 'Erase', shortcut: 'E' },
    { mode: 'fill', icon: '▰', label: 'Fill', shortcut: 'F' },
    { mode: 'pick', iconPath: '/assets/eyedropper-32.ico', icon: '▼', label: 'Eyedropper', shortcut: 'I' },
  ]

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Number keys 1-9 for palette selection
      const key = parseInt(e.key)
      if (key >= 1 && key <= Math.min(9, palette.length)) {
        onSelectIndex(key - 1)
        e.preventDefault()
      }

      // Mode shortcuts
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
        case 'g':
          onToggleGrid()
          e.preventDefault()
          break
        case 'a':
          if (hasSprite) {
            onToggleAutoTiling()
            e.preventDefault()
          }
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [palette.length, onSelectIndex, onModeChange, onToggleGrid, onToggleAutoTiling, hasSprite])

  return (
    <>
      <div
        className="shadow-lg flex flex-col rounded-lg transition-all duration-300 ease-in-out overflow-hidden"
        style={{
          background: 'linear-gradient(to bottom right, #475569, #374151)',
          width: isExpanded ? '220px' : '48px',
          height: 'calc(100% - 16px)',
          margin: '8px 0 8px 8px',
        }}
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => {
          setIsExpanded(false)
          setVariantPopupTile(null)
        }}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px',
          }}
        />

        {/* Content */}
        <div className="relative z-10 w-full flex flex-col h-full overflow-y-auto overflow-x-hidden py-3 px-1.5 gap-1">
          {/* Mode Buttons */}
          {modes.map((modeOption, index) => (
            <div key={modeOption.mode}>
              {isExpanded ? (
                <button
                  onClick={() => onModeChange(modeOption.mode)}
                  className={`
                    w-full rounded transition-all flex items-center gap-2 p-1.5
                    ${
                      mode === modeOption.mode
                        ? 'bg-white/30 text-white shadow-lg'
                        : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
                    }
                  `}
                  title={`${modeOption.label} (${modeOption.shortcut})`}
                >
                  {modeOption.iconPath ? (
                    <img
                      src={modeOption.iconPath}
                      alt={modeOption.label}
                      className="flex-shrink-0 w-4 h-4"
                      style={{ filter: mode === modeOption.mode ? 'brightness(1)' : 'brightness(0.7)' }}
                    />
                  ) : (
                    <span className="flex-shrink-0 text-base leading-none">{modeOption.icon}</span>
                  )}
                  <span className="text-[10px] font-medium">{modeOption.label}</span>
                </button>
              ) : (
                <ToolButton
                  icon={modeOption.icon}
                  iconPath={modeOption.iconPath}
                  label={modeOption.label}
                  shortcut={modeOption.shortcut}
                  active={mode === modeOption.mode}
                  onClick={() => onModeChange(modeOption.mode)}
                  themed={true}
                />
              )}

              {index === 3 && <div className="w-full h-px my-1 bg-white/20" />}
            </div>
          ))}

          {/* Brush Size Slider */}
          <div className="flex flex-col gap-1">
            {isExpanded && (
              <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold px-1">
                Brush Size
              </div>
            )}
            {isExpanded ? (
              <>
                <input
                  type="range"
                  min="1"
                  max="5"
                  step="1"
                  value={brushSize}
                  onChange={(e) => onBrushSizeChange(Number(e.target.value))}
                  className="w-full cursor-pointer brush-slider"
                  style={{
                    background: `linear-gradient(to right, white 0%, white ${
                      ((brushSize - 1) / 4) * 100
                    }%, rgba(255,255,255,0.2) ${((brushSize - 1) / 4) * 100}%, rgba(255,255,255,0.2) 100%)`,
                  }}
                />
                <div className="text-white/70 text-[9px] text-center font-mono">
                  {brushSize}×{brushSize}
                </div>
              </>
            ) : (
              <div className="text-white/90 text-[10px] text-center font-mono bg-white/5 py-1.5 rounded">
                {brushSize}
              </div>
            )}
          </div>

          <div className="w-full h-px my-1 bg-white/20" />

          {/* Grid Toggle */}
          {isExpanded ? (
            <button
              onClick={onToggleGrid}
              className={`
                w-full rounded transition-all flex items-center gap-2 p-1.5
                ${
                  showGrid
                    ? 'bg-white/30 text-white shadow-md'
                    : 'bg-white/5 text-white/60 hover:bg-white/15'
                }
              `}
              title="Toggle Grid (G)"
            >
              <span className="flex-shrink-0 text-base leading-none">#</span>
              <span className="text-[10px] font-medium">Grid</span>
            </button>
          ) : (
            <ToolButton
              icon="#"
              label="Grid"
              shortcut="G"
              active={showGrid}
              onClick={onToggleGrid}
              themed={true}
            />
          )}

          <div className="w-full h-px my-1 bg-white/20" />

          {/* Tile Palette */}
          <div className="flex flex-col gap-1">
            {isExpanded && (
              <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold px-1">
                Tiles
              </div>
            )}
            <div className="flex flex-col gap-1">
              {palette.slice(0, 5).map((paletteColor, index) => {
                const hasSprite = hasSpriteAsset(paletteColor.type)
                const tilePath = hasSprite ? getTilePath(paletteColor.type, 4) : null
                const isPlain = paletteColor.type === 'plain'

                return (
                  <div key={index} className="relative">
                    <button
                      onClick={() => {
                        onSelectIndex(index)
                        if (!autoTilingEnabled && hasSprite) {
                          setVariantPopupTile(index)
                        }
                      }}
                      onMouseEnter={() => {
                        if (isExpanded && !autoTilingEnabled && hasSprite) {
                          setVariantPopupTile(index)
                        }
                      }}
                      className={`
                        w-full rounded transition-all flex items-center gap-2
                        ${
                          selectedIndex === index
                            ? 'ring-2 ring-white/60 bg-white/25 shadow-md'
                            : 'ring-1 ring-white/10 hover:ring-white/30 hover:bg-white/10'
                        }
                        ${isExpanded ? 'p-1.5' : 'p-1 justify-center'}
                      `}
                      title={`${paletteColor.name}${index < 9 ? ` (${index + 1})` : ''}`}
                    >
                      {/* Tile Preview */}
                      <div
                        className={`rounded flex-shrink-0 overflow-hidden flex items-center justify-center ${
                          isExpanded ? 'w-6 h-6' : 'w-7 h-7'
                        }`}
                        style={{
                          backgroundColor: isPlain
                            ? index === selectedIndex
                              ? plainColor
                              : paletteColor.color
                            : '#2a2a2a',
                          border: '1px solid rgba(255,255,255,0.2)',
                        }}
                      >
                        {hasSprite && tilePath && (
                          <img
                            src={tilePath}
                            alt={paletteColor.name}
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'contain',
                              imageRendering: 'pixelated',
                            }}
                          />
                        )}
                      </div>

                      {isExpanded && (
                        <>
                          <span className="text-white/90 text-[10px] font-medium flex-1 text-left">
                            {paletteColor.name}
                          </span>
                          {index < 9 && (
                            <span className="text-[8px] font-mono text-white/40">{index + 1}</span>
                          )}
                        </>
                      )}
                    </button>

                    {/* Variant Popup on Hover */}
                    {variantPopupTile === index && !autoTilingEnabled && hasSprite && isExpanded && (
                      <div
                        className="absolute left-full ml-2 top-0 z-50 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-2xl p-2 border border-white/20"
                        style={{
                          backgroundImage:
                            'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
                          backgroundSize: '16px 16px',
                        }}
                        onMouseLeave={() => setVariantPopupTile(null)}
                      >
                        <div className="text-white/90 text-[9px] font-semibold mb-1.5 px-1">
                          {paletteColor.name} Variants
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          {Array.from({ length: 9 }, (_, variant) => {
                            const variantPath = getTilePath(paletteColor.type, variant)

                            return (
                              <button
                                key={variant}
                                onClick={() => {
                                  onVariantChange?.(variant)
                                  setVariantPopupTile(null)
                                }}
                                className={`
                                  w-8 h-8 rounded transition-all relative overflow-hidden flex items-center justify-center
                                  ${
                                    selectedVariant === variant
                                      ? 'ring-2 ring-white/70 bg-white/30 shadow-lg'
                                      : 'ring-1 ring-white/20 hover:ring-white/50 hover:bg-white/15'
                                  }
                                `}
                                style={{
                                  backgroundColor: selectedVariant === variant ? undefined : '#2a2a2a',
                                  padding: '2px',
                                }}
                                title={`Variant ${variant + 1}`}
                              >
                                <img
                                  src={variantPath}
                                  alt={`Variant ${variant + 1}`}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'contain',
                                    imageRendering: 'pixelated',
                                  }}
                                />
                                <div className="absolute bottom-0 right-0 text-[7px] font-mono bg-black/80 text-white px-0.5 leading-none rounded-tl">
                                  {variant + 1}
                                </div>
                              </button>
                            )
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Color Picker for Plain Tile */}
          {isPlainTile && isExpanded && (
            <div className="flex flex-col gap-1">
              <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold px-1">
                Color
              </div>
              <input
                type="color"
                value={plainColor}
                onChange={(e) => onPlainColorChange?.(e.target.value)}
                className="w-full h-8 rounded cursor-pointer border border-white/20"
              />
            </div>
          )}

          {/* Auto-Tiling Toggle */}
          {hasSprite && (
            <>
              <div className="w-full h-px my-1 bg-white/20" />
              {isExpanded ? (
                <button
                  onClick={onToggleAutoTiling}
                  className={`
                    w-full rounded transition-all flex items-center gap-2 p-1.5
                    ${
                      autoTilingEnabled
                        ? 'bg-white/30 text-white shadow-md'
                        : 'bg-white/5 text-white/60 hover:bg-white/15'
                    }
                  `}
                  title="Toggle Auto-Tiling (A)"
                >
                  <span className="flex-shrink-0 text-base leading-none">⚡</span>
                  <span className="text-[10px] font-medium">Auto-Tile</span>
                </button>
              ) : (
                <ToolButton
                  icon="⚡"
                  label="Auto-Tile"
                  shortcut="A"
                  active={autoTilingEnabled}
                  onClick={onToggleAutoTiling}
                  themed={true}
                />
              )}
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Undo/Redo Buttons */}
          {onUndo && (
            <ToolButton
              icon="↶"
              label="Undo"
              shortcut="Ctrl+Z"
              disabled={!canUndo}
              onClick={onUndo}
              themed={true}
            />
          )}

          {onRedo && (
            <ToolButton
              icon="↷"
              label="Redo"
              shortcut="Ctrl+Shift+Z"
              disabled={!canRedo}
              onClick={onRedo}
              themed={true}
            />
          )}
        </div>
      </div>
    </>
  )
}
