import type { ViewportTransform, ToolType } from '../types/canvas'
import type { TileMode } from '../types/tilemap'
import ShapeCanvas from './canvas/ShapeCanvas'
import TilemapCanvas from './tilemap/TilemapCanvas'

interface CanvasProps {
  selectedTool: ToolType
  onShapeSelect: (id: string | null) => void
  deleteTriggered?: number
  onUndoRedoChange?: (canUndo: boolean, canRedo: boolean, undo: () => void, redo: () => void) => void
  canvasId?: string
  onViewportChange?: (viewport: ViewportTransform) => void
  onZoomChange?: (scale: number) => void
  onZoomControlsReady?: (zoomIn: () => void, zoomOut: () => void, zoomReset: () => void, zoomFit: () => void) => void
  snapToGrid?: boolean
  onColorSamplingReady?: (fn: (callback: (color: string) => void) => void) => void
  // NEW: Tilemap mode support
  isTilemapMode?: boolean
  onExportFunctionsReady?: (exportJSON: () => void, exportPNG: () => void) => void
  // Tilemap state props (passed through when in tilemap mode)
  tileMode?: TileMode
  onTileModeChange?: (mode: TileMode) => void
  brushSize?: number
  onBrushSizeChange?: (size: number) => void
  autoTilingEnabled?: boolean
  onAutoTilingToggle?: () => void
  showTileGrid?: boolean
  onTileGridToggle?: () => void
  selectedPaletteIndex?: number
  onPaletteIndexChange?: (index: number) => void
  selectedVariant?: number
  onVariantChange?: (variant: number | undefined) => void
  plainColor?: string
  onPlainColorChange?: (color: string) => void
}

/**
 * Canvas Component - Main orchestrator between Shape and Tilemap modes
 * 
 * This component acts as a simple mode switcher that delegates to specialized canvas implementations:
 * 
 * - **ShapeCanvas**: Traditional vector drawing with shapes, text, paths, lines, etc.
 *   - Supports full shape editing, grouping, alignment, z-index control
 *   - Includes undo/redo, copy/paste, keyboard shortcuts
 *   - Real-time collaboration with presence cursors
 * 
 * - **TilemapCanvas**: Grid-based tile painting for game development
 *   - Grid-aligned tile painting with stamp/erase/fill/pick modes
 *   - Chunked Firebase storage for scalability
 *   - Optimized rendering with viewport culling
 *   - Export/import functionality for game engines
 * 
 * This refactored architecture keeps each mode self-contained and maintainable.
 * Each canvas mode shares the viewport hook for consistent pan/zoom behavior.
 */
export default function Canvas({
  selectedTool,
  onShapeSelect,
  deleteTriggered,
  onUndoRedoChange,
  canvasId = 'default-canvas',
  onViewportChange,
  onZoomChange,
  onZoomControlsReady,
  snapToGrid: snapToGridProp = false,
  onColorSamplingReady,
  isTilemapMode = false,
  onExportFunctionsReady,
  tileMode = 'stamp',
  onTileModeChange = () => {},
  brushSize = 1,
  onBrushSizeChange = () => {},
  autoTilingEnabled = false,
  onAutoTilingToggle = () => {},
  showTileGrid = true,
  onTileGridToggle = () => {},
  selectedPaletteIndex = 0,
  onPaletteIndexChange = () => {},
  selectedVariant,
  onVariantChange,
  plainColor = '#ffffff',
  onPlainColorChange = () => {},
}: CanvasProps) {
  // Simple orchestrator - delegate to the appropriate canvas mode
  if (isTilemapMode) {
    return (
      <TilemapCanvas
        canvasId={canvasId}
        onViewportChange={onViewportChange}
        onZoomChange={onZoomChange}
        onZoomControlsReady={onZoomControlsReady}
        onUndoRedoChange={onUndoRedoChange}
        onExportFunctionsReady={onExportFunctionsReady}
        tileMode={tileMode}
        onTileModeChange={onTileModeChange}
        brushSize={brushSize}
        onBrushSizeChange={onBrushSizeChange}
        autoTilingEnabled={autoTilingEnabled}
        onAutoTilingToggle={onAutoTilingToggle}
        showGrid={showTileGrid}
        onGridToggle={onTileGridToggle}
        selectedPaletteIndex={selectedPaletteIndex}
        onPaletteIndexChange={onPaletteIndexChange}
        selectedVariant={selectedVariant}
        onVariantChange={onVariantChange}
        plainColor={plainColor}
        onPlainColorChange={onPlainColorChange}
      />
    )
  }

  return (
    <ShapeCanvas
      selectedTool={selectedTool}
      onShapeSelect={onShapeSelect}
      deleteTriggered={deleteTriggered}
      onUndoRedoChange={onUndoRedoChange}
      canvasId={canvasId}
      onViewportChange={onViewportChange}
      onZoomChange={onZoomChange}
      onZoomControlsReady={onZoomControlsReady}
      snapToGrid={snapToGridProp}
      onColorSamplingReady={onColorSamplingReady}
    />
  )
}
