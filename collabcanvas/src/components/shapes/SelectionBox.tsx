import { Rect } from 'react-konva'
import { getSelectionBoxBounds } from '../../types/selection'
import type { SelectionBox as SelectionBoxType } from '../../types/selection'

interface SelectionBoxProps {
  selectionBox: SelectionBoxType
}

/**
 * SelectionBox Component
 * 
 * Visual indicator for drag-to-select (marquee selection)
 * Shows a dashed rectangle with semi-transparent fill while dragging
 */
export function SelectionBox({ selectionBox }: SelectionBoxProps) {
  // Only render if selection box is visible
  if (!selectionBox.visible) {
    return null
  }

  // Calculate actual bounds (handles any drag direction)
  const bounds = getSelectionBoxBounds(selectionBox)

  return (
    <Rect
      x={bounds.x}
      y={bounds.y}
      width={bounds.width}
      height={bounds.height}
      fill="rgba(59, 130, 246, 0.1)" // semi-transparent blue (#3B82F6 at 10% opacity)
      stroke="#3B82F6" // solid blue border
      strokeWidth={1}
      dash={[5, 5]} // dashed border (5px dash, 5px gap)
      listening={false} // don't capture mouse events
    />
  )
}

