/**
 * Layer Types (PR-19)
 * Type definitions for layer panel and hierarchy management
 */

export interface Layer {
  id: string
  name: string
  type: 'shape' | 'group'
  visible: boolean
  locked: boolean
  zIndex: number
  parentId?: string // For nested groups
  children?: Layer[] // For hierarchical display
}

export interface LayerVisibility {
  [id: string]: boolean
}

export interface LayerLock {
  [id: string]: boolean
}

export interface LayerTreeNode extends Layer {
  level: number // Nesting level (0 = root)
  expanded?: boolean // For collapsible groups
}


