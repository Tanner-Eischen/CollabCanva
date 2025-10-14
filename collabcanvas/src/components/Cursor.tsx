import { Group, Path, Text, Rect } from 'react-konva'

interface CursorProps {
  x: number
  y: number
  userName: string
  color: string
}

/**
 * Cursor component - Renders other users' cursors on the canvas
 * Shows an arrow pointer with a name label
 * Position jumps to coordinates (no smooth interpolation per MVP requirements)
 */
export default function Cursor({ x, y, userName, color }: CursorProps) {
  // Arrow pointer SVG path data (pointing up-left like a standard cursor)
  const arrowPath =
    'M 0 0 L 0 18 L 5 13 L 9 20 L 11 19 L 7 12 L 13 11 Z'

  // Measure text width for background pill (approximate)
  const textWidth = userName.length * 7 + 16 // rough estimate
  const textHeight = 20

  return (
    <Group x={x} y={y}>
      {/* Arrow pointer */}
      <Path
        data={arrowPath}
        fill={color}
        stroke="white"
        strokeWidth={1}
        shadowColor="rgba(0, 0, 0, 0.3)"
        shadowBlur={4}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />

      {/* Name label background pill */}
      <Rect
        x={15}
        y={5}
        width={textWidth}
        height={textHeight}
        fill={color}
        cornerRadius={10}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={3}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />

      {/* Name label text */}
      <Text
        x={23}
        y={9}
        text={userName}
        fontSize={12}
        fontFamily="system-ui, Arial, sans-serif"
        fill="white"
        fontStyle="bold"
      />
    </Group>
  )
}

