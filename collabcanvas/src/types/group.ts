/**
 * Group Types (PR-19)
 * Type definitions for grouping shapes together
 */

export interface GroupMember {
  id: string
  type: 'shape' | 'group' // Can contain shapes or nested groups
}

export interface Group {
  id: string
  name: string
  memberIds: string[] // IDs of shapes or groups in this group
  x: number // Group position (calculated from members)
  y: number
  width: number // Group bounding box (calculated from members)
  height: number
  rotation: number
  locked: boolean
  visible: boolean
  createdAt: number
  updatedAt: number
  createdBy: string
  zIndex: number
}

export interface GroupBounds {
  x: number
  y: number
  width: number
  height: number
}


