/**
 * TilePalette Component
 * Left-side panel for selecting tiles, modes, and tile size
 * Reuses Toolbar styling for consistency
 */

import { useEffect, useState } from 'react'
import type { TileMode, PaletteColor } from '../../types/tilemap'
import { hasSpriteAsset, getTilePath } from '../../constants/tilemapDefaults'

interface TilePaletteProps {
  palette: PaletteColor[]
  selectedIndex: number
  onSelectIndex: (index: number) => void
  selectedVariant?: number
  onVariantChange?: (variant: number) => void
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
}

/**
 * Tile palette panel - Figma-style vertical panel
 * Shows palette colors, drawing modes, and tile size selector
 */
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
}: TilePaletteProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [variantPopupTile, setVariantPopupTile] = useState<number | null>(null)
  const [backdropActive, setBackdropActive] = useState(false)
  const selectedTile = palette[selectedIndex]
  const isPlainTile = selectedTile?.type === 'plain'
  const hasSprite = selectedTile && hasSpriteAsset(selectedTile.type)
  
  // Activate backdrop after a brief delay to prevent immediate closure
  useEffect(() => {
    if (variantPopupTile !== null) {
      const timer = setTimeout(() => setBackdropActive(true), 100)
      return () => clearTimeout(timer)
    } else {
      setBackdropActive(false)
    }
  }, [variantPopupTile])
  // Keyboard shortcuts for palette selection (1-9)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check if typing in an input
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
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [palette.length, onSelectIndex, onModeChange])
  
  const modes: Array<{
    mode: TileMode
    iconPath?: string
    icon?: string
    label: string
    shortcut: string
  }> = [
    { 
      mode: 'stamp', 
      iconPath: '/assets/paint-brush-32.ico',
      label: 'Paint', 
      shortcut: 'B' 
    },
    { 
      mode: 'erase', 
      iconPath: '/assets/eraser-32.ico',
      label: 'Erase', 
      shortcut: 'E' 
    },
    { 
      mode: 'fill', 
      icon: '▰',
      label: 'Fill', 
      shortcut: 'F' 
    },
    { 
      mode: 'pick', 
      iconPath: '/assets/eyedropper-32.ico',
      label: 'Eyedropper', 
      shortcut: 'I' 
    },
  ]
  
  return (
    <>
    <div 
      className="shadow-lg flex flex-col absolute z-50 rounded-lg transition-all duration-300 ease-in-out overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom right, #475569, #374151)',
        width: isExpanded ? '206px' : '60px',
        left: '8px',
        top: '8px',
        bottom: '48px', // 40px footer + 8px margin
      }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0 pointer-events-none" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      ></div>

      {/* Content */}
      <div className={`relative z-10 flex flex-col h-full overflow-y-auto overflow-x-hidden tilemap-panel-scroll ${isExpanded ? 'p-1.75 gap-1.75' : 'p-1.75 gap-1.75'}`}>
        {/* Header */}
        {isExpanded && (
          <div className="text-white font-bold text-[10px] flex-shrink-0 uppercase tracking-wider border-b border-white/10 pb-1">
            Tilemap
        </div>
        )}
        
        {/* Mode Buttons */}
        <div className="flex flex-col gap-0.5 flex-shrink-0">
          {isExpanded && (
            <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold">Mode</div>
          )}
          <div className="flex flex-col gap-0.5">
            {modes.map((modeOption) => (
              <button
                key={modeOption.mode}
                onClick={() => onModeChange(modeOption.mode)}
                className={`
                  rounded transition-all flex items-center gap-2
                  ${mode === modeOption.mode
                    ? 'bg-white/30 text-white shadow-lg'
                    : 'bg-white/5 text-white/60 hover:bg-white/15 hover:text-white'
                  }
                  ${isExpanded ? 'justify-start p-1.5' : 'justify-center p-1.5'}
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
                      {isExpanded && <span className="text-[10px] font-medium">{modeOption.label}</span>}
              </button>
            ))}
          </div>
        </div>
        
        {/* Brush Size Control */}
        {onBrushSizeChange && (
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            {isExpanded && (
              <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold">Brush</div>
            )}
            {isExpanded ? (
              <div className="flex flex-col gap-0.5">
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
                <div className="text-white/70 text-[9px] text-center font-mono">{brushSize}×{brushSize}</div>
              </div>
            ) : (
              <div className="text-white/90 text-[9px] text-center font-mono bg-white/5 py-1 rounded">
                {brushSize}
          </div>
            )}
        </div>
        )}
        
                {/* Grid Toggle */}
                {onToggleGrid && (
                  <button
                    onClick={onToggleGrid}
                    className={`
                      rounded transition-all flex items-center gap-2 p-1.5
                      ${showGrid
                        ? 'bg-white/30 text-white shadow-md'
                        : 'bg-white/5 text-white/60 hover:bg-white/15'
                      }
                      ${isExpanded ? 'justify-start' : 'justify-center'}
                    `}
                    title="Toggle Grid (G)"
                  >
                    <span className="flex-shrink-0 text-base leading-none">#</span>
                    {isExpanded && <span className="text-[10px] font-medium">Grid</span>}
                  </button>
                )}
        
        {/* Palette Tiles */}
        <div className={`flex flex-col flex-shrink-0 ${isExpanded ? 'gap-1' : 'gap-0.5'}`}>
          {isExpanded && (
            <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold">
              Tiles
          </div>
        )}
          <div className={`flex flex-col ${isExpanded ? 'gap-1' : 'gap-0.5'}`}>
            {palette.map((paletteColor, index) => {
              const hasSprite = hasSpriteAsset(paletteColor.type)
              const tilePath = hasSprite ? getTilePath(paletteColor.type, 4) : null // Use variant 4 (center) for preview
              const isPlain = paletteColor.type === 'plain'
              
              return (
                <button
                  key={index}
                  onClick={(e) => {
                    e.stopPropagation() // Prevent click from bubbling to backdrop
                    onSelectIndex(index)
                    // Show variant popup if auto-tiling is off and this is a sprite tile
                    if (!autoTilingEnabled && hasSpriteAsset(paletteColor.type)) {
                      setVariantPopupTile(index)
                    }
                  }}
                  className={`
                    rounded transition-all relative overflow-hidden flex items-center gap-2
                    ${selectedIndex === index
                      ? 'ring-2 ring-white/60 bg-white/25 shadow-md'
                      : 'ring-1 ring-white/10 hover:ring-white/30 hover:bg-white/10'
                    }
                    ${isExpanded ? 'p-1.5' : 'p-1 justify-center'}
                  `}
                  title={`${paletteColor.name}${index < 9 ? ` (${index + 1})` : ''}`}
                >
                  {/* Tile Preview */}
                  <div 
                    className={`rounded flex-shrink-0 overflow-hidden flex items-center justify-center ${isExpanded ? 'w-6 h-6' : 'w-5 h-5'}`}
                    style={{ 
                      backgroundColor: isPlain ? (index === selectedIndex ? plainColor : paletteColor.color) : '#2a2a2a',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}
                  >
                    {hasSprite && tilePath ? (
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
                    ) : null}
                  </div>
                  
                  {isExpanded && (
                    <>
                      {/* Tile name */}
                      <span className="text-white/90 text-[10px] font-medium flex-1 text-left">
                        {paletteColor.name}
                      </span>
                      
                      {/* Keyboard shortcut */}
                {index < 9 && (
                        <span className="text-[8px] font-mono text-white/40">
                    {index + 1}
                        </span>
                      )}
                    </>
                )}
              </button>
              )
            })}
          </div>
        </div>
        
        {/* Color Picker for Plain Tile */}
        {isPlainTile && isExpanded && (
          <div className="flex flex-col gap-1 flex-shrink-0">
            <div className="text-white/50 text-[8px] uppercase tracking-wider font-semibold">
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
        
                {/* Auto-Tiling Toggle (only show for sprite tiles) */}
                {hasSprite && onToggleAutoTiling && (
                  <button
                    onClick={onToggleAutoTiling}
                    className={`
                      rounded transition-all flex items-center gap-2 p-1.5
                      ${autoTilingEnabled
                        ? 'bg-white/30 text-white shadow-md'
                        : 'bg-white/5 text-white/60 hover:bg-white/15'
                      }
                      ${isExpanded ? 'justify-start' : 'justify-center'}
                    `}
                    title="Toggle Auto-Tiling (A)"
                  >
                    <span className="flex-shrink-0 text-base leading-none">⚡</span>
                    {isExpanded && <span className="text-[10px] font-medium">Auto-Tile</span>}
                  </button>
                )}
        
        {/* Variant info (only show when auto-tiling is OFF) - removed in favor of popup */}
        
        {/* Status Info (only show when expanded) */}
        {isExpanded && (
          <div className="flex flex-col gap-1 text-[8px] flex-shrink-0 mt-auto pt-2 border-t border-white/10">
            {cursorPosition && (
              <div className="flex justify-between text-white/50 px-1">
                <span className="font-semibold">Position</span>
                <span className="font-mono text-white/80">
                  {cursorPosition.x},{cursorPosition.y}
                </span>
              </div>
            )}
            <div className="flex justify-between text-white/50 px-1">
              <span className="font-semibold">Tiles</span>
              <span className="font-mono text-white/80">{tileCount}</span>
            </div>
          </div>
        )}
      </div>
    </div>

    {/* Horizontal Variant Popup (shows when clicking a tile with auto-tiling off) */}
    {variantPopupTile !== null && !autoTilingEnabled && (
      <>
        {/* Backdrop to close popup */}
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => {
            if (backdropActive) {
              setVariantPopupTile(null)
            }
          }}
        />
        
        {/* Variant selector popup - positioned relative to the toolbar */}
        <div 
          className="absolute z-50 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-2xl p-2 border border-white/20"
          onClick={(e) => e.stopPropagation()}
          style={{
            left: isExpanded ? '234px' : '88px', // Position to the right of toolbar (8px + width + 8px margin)
            top: '50%',
            transform: 'translateY(-50%)',
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '16px 16px'
          }}
        >
            <div className="text-white/90 text-[10px] font-semibold mb-2 px-1">
              {palette[variantPopupTile]?.name} Variants
            </div>
            <div className="flex gap-1">
              {Array.from({ length: 9 }, (_, variant) => {
                const tilePath = getTilePath(palette[variantPopupTile].type, variant)
                
                return (
                  <button
                    key={variant}
                    onClick={() => {
                      onVariantChange?.(variant)
                      setVariantPopupTile(null)
                    }}
                    className={`
                      w-10 h-10 rounded-lg transition-all relative overflow-hidden flex items-center justify-center
                      ${selectedVariant === variant
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
                      src={tilePath}
                      alt={`Variant ${variant + 1}`}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'contain',
                        imageRendering: 'pixelated',
                      }}
                    />
                    <div className="absolute bottom-0 right-0 text-[7px] font-mono bg-black/80 text-white px-1 leading-none rounded-tl">
                      {variant + 1}
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        </>
      )}
    </>
  )
}

