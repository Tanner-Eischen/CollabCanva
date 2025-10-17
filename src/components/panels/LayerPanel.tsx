/**
 * LayerPanel Component (PR-19)
 * Right sidebar showing layer hierarchy with visibility, lock, and reordering
 */

import { useState, useMemo } from 'react'
import { LayerItem } from '../LayerItem'
import { ColorPicker } from '../ui/ColorPicker'
import type { Layer } from '../../types/layer'
import type { Shape } from '../../types/canvas'
import type { Group } from '../../types/group'

interface LayerPanelProps {
  shapes: Shape[]
  groups: Group[]
  selectedIds: Set<string>
  onSelectLayer: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onRenameLayer: (id: string, newName: string) => void
  onDelete?: (id: string) => void
  // Design panel props
  onUpdateColors?: (fill: string, stroke: string, strokeWidth: number) => void
  onUpdateShapeProps?: (id: string, updates: Partial<Shape>) => void
  recentColors?: string[]
  onRequestColorSample?: (callback: (color: string) => void) => void
  // Theme for collab spaces
  collabTheme?: { 
    primary: string
    secondary: string
    gradient: string
    displayName: string
    softBg: string
    softBorder: string
  } | null
}

/**
 * LayerPanel component for displaying and managing layer hierarchy
 * Shows all objects and groups in a hierarchical list with controls
 */
export function LayerPanel({
  shapes,
  groups,
  selectedIds,
  onSelectLayer,
  onToggleVisibility,
  onToggleLock,
  onRenameLayer,
  onDelete,
  onUpdateColors,
  onUpdateShapeProps,
  recentColors = [],
  onRequestColorSample,
  collabTheme,
}: LayerPanelProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'design'>('layers')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())
  const [panelState, setPanelState] = useState<'hidden' | 'expanded'>('expanded')
  
  // Design panel state
  const [showFillPicker, setShowFillPicker] = useState(false)
  const [showStrokePicker, setShowStrokePicker] = useState(false)
  
  // Get selected shapes
  const selectedShapes = Array.from(selectedIds)
    .map(id => shapes.find(s => s.id === id))
    .filter((s): s is Shape => s !== undefined)
  
  // Check if any selected shape is text
  const isTextSelected = selectedShapes.length === 1 && selectedShapes[0].type === 'text'
  
  // Get common fill color
  const commonFill = useMemo(() => {
    if (selectedShapes.length === 0) return '#3B82F6FF'
    const fills = selectedShapes.map(s => s.fill || '#3B82F6FF')
    return fills.every(f => f === fills[0]) ? fills[0] : 'multiple'
  }, [selectedShapes])
  
  // Get common stroke color
  const commonStroke = useMemo(() => {
    if (selectedShapes.length === 0) return '#000000FF'
    const strokes = selectedShapes.map(s => s.stroke || '#000000FF')
    return strokes.every(s => s === strokes[0]) ? strokes[0] : 'multiple'
  }, [selectedShapes])
  
  // Get common stroke width
  const commonStrokeWidth = useMemo(() => {
    if (selectedShapes.length === 0) return 2
    const widths = selectedShapes.map(s => s.strokeWidth || 2)
    return widths.every(w => w === widths[0]) ? widths[0] : 2
  }, [selectedShapes])
  
  // Font families for text
  const FONT_FAMILIES = [
    'Inter, sans-serif',
    'Arial, sans-serif',
    'Georgia, serif',
    'Times New Roman, serif',
    'Courier New, monospace',
    'Comic Sans MS, cursive',
    'Impact, fantasy',
  ]

  /**
   * Convert shapes and groups into layer tree structure
   */
  const layerTree = useMemo(() => {
    const layers: Layer[] = []
    
    // Add shapes that are not in groups
    shapes.forEach((shape) => {
      const isInGroup = groups.some((g) => g.memberIds.includes(shape.id))
      if (!isInGroup) {
        // Generate readable names for each shape type
        let layerName = ''
        
        switch (shape.type) {
          case 'rectangle':
            layerName = `Rectangle ${shape.id.slice(-4)}`
            break
          case 'circle':
            layerName = `Circle ${shape.id.slice(-4)}`
            break
          case 'text':
            layerName = shape.text ? `"${shape.text.slice(0, 15)}"` : `Text ${shape.id.slice(-4)}`
            break
          case 'line':
            layerName = `Line ${shape.id.slice(-4)}`
            break
          case 'path':
            layerName = `Path ${shape.id.slice(-4)}`
            break
          case 'polygon':
            layerName = `Polygon ${shape.id.slice(-4)}`
            break
          case 'star':
            layerName = `Star ${shape.id.slice(-4)}`
            break
          case 'roundRect':
            layerName = `Rounded Rect ${shape.id.slice(-4)}`
            break
          default:
            layerName = `${shape.type} ${shape.id.slice(-4)}`
        }
        
        layers.push({
          id: shape.id,
          name: layerName,
          type: 'shape',
          visible: true,
          locked: false,
          zIndex: shape.zIndex || 0,
        })
      }
    })
    
    // Add groups with their children
    groups.forEach((group) => {
      // Check if this group is itself a member of another group
      const isInGroup = groups.some((g) => g.memberIds.includes(group.id))
      if (!isInGroup) {
        const children: Layer[] = []
        
        // Add group members as children
        group.memberIds.forEach((memberId) => {
          const shape = shapes.find((s) => s.id === memberId)
          const childGroup = groups.find((g) => g.id === memberId)
          
          if (shape) {
            // Use same naming as ungrouped shapes
            let childName = ''
            switch (shape.type) {
              case 'rectangle': childName = `Rectangle ${shape.id.slice(-4)}`; break
              case 'circle': childName = `Circle ${shape.id.slice(-4)}`; break
              case 'text': childName = shape.text ? `"${shape.text.slice(0, 15)}"` : `Text ${shape.id.slice(-4)}`; break
              case 'line': childName = `Line ${shape.id.slice(-4)}`; break
              case 'path': childName = `Path ${shape.id.slice(-4)}`; break
              case 'polygon': childName = `Polygon ${shape.id.slice(-4)}`; break
              case 'star': childName = `Star ${shape.id.slice(-4)}`; break
              case 'roundRect': childName = `Rounded Rect ${shape.id.slice(-4)}`; break
              default: childName = `${shape.type} ${shape.id.slice(-4)}`
            }
            
            children.push({
              id: shape.id,
              name: childName,
              type: 'shape',
              visible: true,
              locked: false,
              zIndex: shape.zIndex || 0,
              parentId: group.id,
            })
          } else if (childGroup) {
            // Nested group
            children.push({
              id: childGroup.id,
              name: childGroup.name,
              type: 'group',
              visible: childGroup.visible,
              locked: childGroup.locked,
              zIndex: childGroup.zIndex || 0,
              parentId: group.id,
            })
          }
        })
        
        layers.push({
          id: group.id,
          name: group.name,
          type: 'group',
          visible: group.visible,
          locked: group.locked,
          zIndex: group.zIndex || 0,
          children,
        })
      }
    })
    
    // Sort by z-index (highest first in layer panel)
    return layers.sort((a, b) => (b.zIndex || 0) - (a.zIndex || 0))
  }, [shapes, groups])

  const toggleGroupExpand = (groupId: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(groupId)) {
      newExpanded.delete(groupId)
    } else {
      newExpanded.add(groupId)
    }
    setExpandedGroups(newExpanded)
  }

  const renderLayer = (layer: Layer, level: number = 0): React.ReactNode => {
    const isSelected = selectedIds.has(layer.id)
    const isExpanded = expandedGroups.has(layer.id)

    return (
      <LayerItem
        key={layer.id}
        layer={layer}
        isSelected={isSelected}
        level={level}
        onSelect={onSelectLayer}
        onToggleVisibility={onToggleVisibility}
        onToggleLock={onToggleLock}
        onRename={onRenameLayer}
        onDelete={onDelete}
        isExpanded={isExpanded}
        onToggleExpand={
          layer.type === 'group' ? () => toggleGroupExpand(layer.id) : undefined
        }
        themed={!!collabTheme}
      >
        {layer.children?.map((child) => renderLayer(child, level + 1))}
      </LayerItem>
    )
  }

  const togglePanelState = () => {
    if (panelState === 'expanded') setPanelState('hidden')
    else setPanelState('expanded')
  }

  if (panelState === 'hidden') {
    // Floating toggle button when hidden (positioned above status bar)
    return (
      <button
        onClick={togglePanelState}
        className="fixed right-4 bottom-[16px] z-30 w-10 h-10 bg-white rounded-full shadow-lg border border-gray-300 hover:bg-gray-50 flex items-center justify-center"
        title="Show layers panel"
      >
        <span className="text-lg text-gray-700">☰</span>
      </button>
    )
  }

  return (
    <div
      className="w-80 h-[calc(100%-16px)] my-2 mr-2 rounded-lg shadow-lg flex flex-col transition-all duration-200 relative overflow-hidden bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md"
    >
      {/* Dot pattern overlay */}
      <div 
        className="absolute inset-0" 
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.15) 1px, transparent 1px)',
          backgroundSize: '16px 16px'
        }}
      ></div>
      
      {/* Content wrapper */}
      <div className="relative z-10 flex flex-col h-full">
      {/* Header with Toggle Button */}
      <div className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-slate-900/95 to-slate-800/95 border-b border-white/10">
        <h3 className="text-sm font-semibold text-white/90 uppercase tracking-wider">
          Layers
        </h3>
        <button
          onClick={togglePanelState}
          className="p-1 rounded transition-colors hover:bg-white/20 text-white"
          title="Hide layers panel"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/20">
        <button
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'layers'
              ? 'text-white border-b-2 border-white'
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('layers')}
        >
          <span className="text-base">☰</span>
          Layers
        </button>
        <button
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 transition-colors ${
            activeTab === 'design'
              ? 'text-white border-b-2 border-white'
              : 'text-white/70 hover:text-white'
          }`}
          onClick={() => setActiveTab('design')}
        >
          <span className="text-base">◐</span>
          Design
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto" id="layers-content">
        {activeTab === 'layers' ? (
          <div className="py-2">
            {layerTree.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-white/60">
                No layers yet
              </div>
            ) : (
              layerTree.map((layer) => renderLayer(layer))
            )}
          </div>
        ) : (
          <div className="p-4 space-y-4 overflow-y-auto">
            {selectedShapes.length === 0 ? (
              <div className="text-center text-sm py-8 text-white/60">
                Select a shape to edit properties
              </div>
            ) : (
              <>
                {/* Text Formatting Section */}
                {isTextSelected && (
                  <div className="space-y-3 pb-4 rounded-lg p-3 bg-white/10 border-b border-white/20">
                    <h4 className="text-xs font-semibold uppercase text-white/90">Text</h4>
                    
                    {/* Font Family */}
                    <div>
                      <label className="text-xs font-medium block mb-1 text-white/90">Font</label>
                      <select
                        value={selectedShapes[0].fontFamily || 'Inter, sans-serif'}
                        onChange={(e) => onUpdateShapeProps?.(selectedShapes[0].id, {
                          fontFamily: e.target.value
                        })}
                        className="w-full px-2 py-1.5 border rounded text-xs focus:outline-none focus:ring-1 bg-white/20 border-white/30 text-white focus:ring-white/50"
                      >
                        {FONT_FAMILIES.map(font => (
                          <option key={font} value={font}>
                            {font.split(',')[0]}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    {/* Font Size */}
                    <div>
                      <div className="flex justify-between items-center mb-1">
                        <label className="text-xs font-medium text-white/90">Size</label>
                        <span className="text-xs text-white/70">{selectedShapes[0].fontSize || 20}px</span>
                      </div>
                      <input
                        type="range"
                        min="12"
                        max="72"
                        value={selectedShapes[0].fontSize || 20}
                        onChange={(e) => onUpdateShapeProps?.(selectedShapes[0].id, {
                          fontSize: parseInt(e.target.value)
                        })}
                        className="w-full"
                      />
                    </div>
                    
                    {/* Style Toggles */}
                    <div>
                      <label className="text-xs font-medium block mb-1 text-white/90">Style</label>
                      <div className="flex gap-1">
                        <button
                          onClick={() => onUpdateShapeProps?.(selectedShapes[0].id, {
                            fontWeight: selectedShapes[0].fontWeight === 'bold' ? 'normal' : 'bold'
                          })}
                          className={`px-2 py-1 text-xs font-bold border rounded transition-colors ${
                            selectedShapes[0].fontWeight === 'bold'
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          }`}
                        >
                          B
                        </button>
                        <button
                          onClick={() => onUpdateShapeProps?.(selectedShapes[0].id, {
                            fontStyle: selectedShapes[0].fontStyle === 'italic' ? 'normal' : 'italic'
                          })}
                          className={`px-2 py-1 text-xs italic border rounded transition-colors ${
                            selectedShapes[0].fontStyle === 'italic'
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          }`}
                        >
                          I
                        </button>
                        <button
                          onClick={() => onUpdateShapeProps?.(selectedShapes[0].id, {
                            textDecoration: selectedShapes[0].textDecoration === 'underline' ? '' : 'underline'
                          })}
                          className={`px-2 py-1 text-xs underline border rounded transition-colors ${
                            selectedShapes[0].textDecoration === 'underline'
                              ? 'bg-blue-500 text-white border-blue-500'
                              : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                          }`}
                        >
                          U
                        </button>
                      </div>
                    </div>
                    
                    {/* Text Align */}
                    <div>
                      <label className="text-xs font-medium block mb-1 text-white/90">Align</label>
                      <div className="flex gap-1">
                        {(['left', 'center', 'right'] as const).map(align => (
                          <button
                            key={align}
                            onClick={() => onUpdateShapeProps?.(selectedShapes[0].id, {
                              textAlign: align
                            })}
                            className={`flex-1 px-2 py-1 text-xs border rounded transition-colors ${
                              (selectedShapes[0].textAlign || 'left') === align
                                ? 'bg-blue-500 text-white border-blue-500'
                                : 'bg-white/20 text-white border-white/30 hover:bg-white/30'
                            }`}
                          >
                            {align === 'left' ? '⬅' : align === 'center' ? '↔' : '➡'}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Fill Color */}
                <div className="rounded-lg p-2 bg-white/10">
                  <button
                    onClick={() => setShowFillPicker(!showFillPicker)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded border border-white/40"
                        style={{ backgroundColor: commonFill === 'multiple' ? '#CCCCCC' : commonFill }}
                      />
                      <span className="text-xs font-medium text-white/90">Fill</span>
                    </div>
                    <svg className={`w-3 h-3 transition-transform text-white/80 ${showFillPicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showFillPicker && (
                    <div className="mt-2">
                      <ColorPicker
                        value={commonFill === 'multiple' ? '#3B82F6FF' : commonFill}
                        onChange={(color) => onUpdateColors?.(color, commonStroke === 'multiple' ? '#000000FF' : commonStroke, commonStrokeWidth)}
                        label="Fill"
                        recentColors={recentColors}
                        onRequestCanvasSample={onRequestColorSample ? () => onRequestColorSample((color) => {
                          onUpdateColors?.(color, commonStroke === 'multiple' ? '#000000FF' : commonStroke, commonStrokeWidth)
                        }) : undefined}
                      />
                    </div>
                  )}
                </div>

                {/* Stroke Color */}
                <div className="rounded-lg p-2 bg-white/10">
                  <button
                    onClick={() => setShowStrokePicker(!showStrokePicker)}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-white/20 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded border border-white/40"
                        style={{ backgroundColor: commonStroke === 'multiple' ? '#CCCCCC' : commonStroke }}
                      />
                      <span className="text-xs font-medium text-white/90">Stroke</span>
                    </div>
                    <svg className={`w-3 h-3 transition-transform text-white/80 ${showStrokePicker ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showStrokePicker && (
                    <div className="mt-2">
                      <ColorPicker
                        value={commonStroke === 'multiple' ? '#000000FF' : commonStroke}
                        onChange={(color) => onUpdateColors?.(commonFill === 'multiple' ? '#3B82F6FF' : commonFill, color, commonStrokeWidth)}
                        label="Stroke"
                        recentColors={recentColors}
                        onRequestCanvasSample={onRequestColorSample ? () => onRequestColorSample((color) => {
                          onUpdateColors?.(commonFill === 'multiple' ? '#3B82F6FF' : commonFill, color, commonStrokeWidth)
                        }) : undefined}
                      />
                    </div>
                  )}
                </div>

                {/* Stroke Width */}
                <div className="rounded-lg p-3 bg-white/10">
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-xs font-medium text-white/90">Stroke Width</label>
                    <span className="text-xs text-white/70">{commonStrokeWidth}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    value={commonStrokeWidth}
                    onChange={(e) => onUpdateColors?.(
                      commonFill === 'multiple' ? '#3B82F6FF' : commonFill,
                      commonStroke === 'multiple' ? '#000000FF' : commonStroke,
                      parseInt(e.target.value)
                    )}
                    className="w-full"
                  />
                </div>
              </>
            )}
          </div>
        )}
      </div>
      </div>
    </div>
  )
}

