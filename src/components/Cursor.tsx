import { Group, Path, Text, Rect } from 'react-konva'

interface CursorProps {
  x: number
  y: number
  userName: string
  color: string
}

/**
 * Cursor component - Professional Figma-style multiplayer cursors (PR-20)
 * Shows an SVG arrow pointer with drop shadow and name label
 * Position jumps to coordinates (no smooth interpolation per MVP requirements)
 */
export default function Cursor({ x, y, userName, color }: CursorProps) {
  // Arrow pointer SVG path data (pointing up-left like a standard cursor)
  const arrowPath =
    'M 0 0 L 0 18 L 5 13 L 9 20 L 11 19 L 7 12 L 13 11 Z'

  // Measure text width for background pill with 4px padding (PR-20)
  const textWidth = userName.length * 6.5 + 8 // 11px font ~6.5px per char + 4px padding each side
  const textHeight = 19

  return (
    <Group x={x} y={y}>
      {/* Arrow pointer with 1px white stroke and drop shadow (PR-20) */}
      <Path
        data={arrowPath}
        fill={color}
        stroke="#FFFFFF"
        strokeWidth={1}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={2}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />

      {/* Name label background - rounded tag (PR-20) */}
      <Rect
        x={15}
        y={3}
        width={textWidth}
        height={textHeight}
        fill={color}
        cornerRadius={4}
        shadowColor="rgba(0, 0, 0, 0.2)"
        shadowBlur={2}
        shadowOffsetX={1}
        shadowOffsetY={1}
      />

      {/* Name label text - 11px Inter font, white text, 4px padding (PR-20) */}
      <Text
        x={19}
        y={6}
        text={userName}
        fontSize={11}
        fontFamily="Inter, system-ui, sans-serif"
        fill="#FFFFFF"
        fontStyle="normal"
      />
    </Group>
  )
}

