/**
 * LayerPanel Component (PR-19)
 * Right sidebar showing layer hierarchy with visibility, lock, and reordering
 */

import { useState, useMemo } from 'react'
import { Layers, Settings } from 'lucide-react'
import { LayerItem } from './LayerItem'
import type { Layer, LayerTreeNode } from '../types/layer'
import type { Shape } from '../types/canvas'
import type { Group } from '../types/group'

interface LayerPanelProps {
  shapes: Shape[]
  groups: Group[]
  selectedIds: Set<string>
  onSelectLayer: (id: string) => void
  onToggleVisibility: (id: string) => void
  onToggleLock: (id: string) => void
  onRenameLayer: (id: string, newName: string) => void
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
}: LayerPanelProps) {
  const [activeTab, setActiveTab] = useState<'layers' | 'design'>('layers')
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set())

  /**
   * Convert shapes and groups into layer tree structure
   */
  const layerTree = useMemo(() => {
    const layers: Layer[] = []
    
    // Add shapes that are not in groups
    shapes.forEach((shape) => {
      const isInGroup = groups.some((g) => g.memberIds.includes(shape.id))
      if (!isInGroup) {
        layers.push({
          id: shape.id,
          name: `${shape.type} ${shape.id.slice(-4)}`,
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
            children.push({
              id: shape.id,
              name: `${shape.type} ${shape.id.slice(-4)}`,
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
        isExpanded={isExpanded}
        onToggleExpand={
          layer.type === 'group' ? () => toggleGroupExpand(layer.id) : undefined
        }
      >
        {layer.children?.map((child) => renderLayer(child, level + 1))}
      </LayerItem>
    )
  }

  return (
    <div className="w-64 h-full bg-white border-l border-gray-200 flex flex-col">
      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'layers'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('layers')}
        >
          <Layers size={16} />
          Layers
        </button>
        <button
          className={`flex-1 px-4 py-2.5 text-sm font-medium flex items-center justify-center gap-2 ${
            activeTab === 'design'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-600 hover:text-gray-900'
          }`}
          onClick={() => setActiveTab('design')}
        >
          <Settings size={16} />
          Design
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'layers' ? (
          <div className="py-2">
            {layerTree.length === 0 ? (
              <div className="px-4 py-8 text-center text-gray-400 text-sm">
                No layers yet
              </div>
            ) : (
              layerTree.map((layer) => renderLayer(layer))
            )}
          </div>
        ) : (
          <div className="px-4 py-8 text-center text-gray-400 text-sm">
            Properties panel coming soon
          </div>
        )}
      </div>
    </div>
  )
}

