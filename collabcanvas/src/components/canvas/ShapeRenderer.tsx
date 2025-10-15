import { Line as KonvaLine, Circle as KonvaCircle } from 'react-konva'
import Konva from 'konva'
import type { Shape, ViewportTransform } from '../../types/canvas'
import type { Group as GroupType } from '../../types/group'
import Rectangle from '../shapes/Rectangle'
import Circle from '../shapes/Circle'
import TextShape from '../shapes/TextShape'
import Line from '../shapes/Line'
import Polygon from '../shapes/Polygon'
import Star from '../shapes/Star'
import RoundedRect from '../shapes/RoundedRect'
import Path from '../shapes/Path'
import Group from '../Group'

interface ShapeRendererProps {
  shapes: Shape[]
  groups: GroupType[]
  selectedIds: Set<string>
  viewport: ViewportTransform
  containerWidth: number
  containerHeight: number
  isDrawingLine: boolean
  lineStartPoint: { x: number; y: number } | null
  linePreviewEnd: { x: number; y: number } | null
  isDrawingPath: boolean
  currentPathPoints: number[]
  selectedTool: 'select' | 'pen' | 'pencil' | string
  sortShapesByZIndex: () => Shape[]
  isShapeInGroup: (shapeId: string) => boolean
  calculateBounds: (groupId: string, shapes: Shape[]) => { x: number; y: number; width: number; height: number } | null
  handleShapeSelect: (shapeId: string, shiftKey: boolean) => void
  handleShapeDragStart: (shapeId: string, x: number, y: number) => void
  handleShapeDragEnd: (shapeId: string, x: number, y: number) => void
  handleShapeTransformEnd: (shapeId: string, width: number, height: number, rotation: number, x: number, y: number) => void
  handleTextDoubleClick: (shape: Shape) => void
  updateShape: (shapeId: string, updates: Partial<Shape>) => void
  dragStartPosRef: React.MutableRefObject<{ x: number; y: number } | null>
}

export function ShapeRenderer({
  shapes,
  groups,
  selectedIds,
  viewport,
  containerWidth,
  containerHeight,
  isDrawingLine,
  lineStartPoint,
  linePreviewEnd,
  isDrawingPath,
  currentPathPoints,
  selectedTool,
  sortShapesByZIndex,
  isShapeInGroup,
  calculateBounds,
  handleShapeSelect,
  handleShapeDragStart,
  handleShapeDragEnd,
  handleShapeTransformEnd,
  handleTextDoubleClick,
  updateShape,
  dragStartPosRef,
}: ShapeRendererProps) {
  const getUserColor = () => '#3B82F6'

  const isShapeInViewport = (shape: Shape): boolean => {
    const margin = 500
    const viewportLeft = -viewport.x / viewport.scale - margin
    const viewportTop = -viewport.y / viewport.scale - margin
    const viewportRight = viewportLeft + (containerWidth / viewport.scale) + margin * 2
    const viewportBottom = viewportTop + (containerHeight / viewport.scale) + margin * 2
    
    if ((shape.type === 'path' || shape.type === 'line') && shape.points && shape.points.length >= 2) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
      for (let i = 0; i < shape.points.length; i += 2) {
        const x = shape.type === 'line' ? shape.points[i] : shape.points[i] + (shape.x || 0)
        const y = shape.type === 'line' ? shape.points[i + 1] : shape.points[i + 1] + (shape.y || 0)
        minX = Math.min(minX, x)
        minY = Math.min(minY, y)
        maxX = Math.max(maxX, x)
        maxY = Math.max(maxY, y)
      }
      
      return !(
        maxX < viewportLeft ||
        minX > viewportRight ||
        maxY < viewportTop ||
        minY > viewportBottom
      )
    }
    
    const shapeRight = shape.x + (shape.width || 0)
    const shapeBottom = shape.y + (shape.height || 0)
    
    return !(
      shapeRight < viewportLeft ||
      shape.x > viewportRight ||
      shapeBottom < viewportTop ||
      shape.y > viewportBottom
    )
  }

  return (
    <>
      {sortShapesByZIndex()
        .filter((shape) => !isShapeInGroup(shape.id))
        .filter((shape) => {
          if (selectedIds.has(shape.id)) {
            return true
          }
          return isShapeInViewport(shape)
        })
        .map((shape) => {
        const isSelected = selectedIds.has(shape.id)
        const userColor = getUserColor()

        if (shape.type === 'rectangle') {
          return (
            <Rectangle
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rotation={shape.rotation}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
            />
          )
        } else if (shape.type === 'circle') {
          const radius = shape.width / 2
          const centerX = shape.x + radius
          const centerY = shape.y + radius
          
          return (
            <KonvaCircle
              key={shape.id}
              x={centerX}
              y={centerY}
              radius={radius}
              fill={shape.fill}
              stroke={shape.stroke || '#000000'}
              strokeWidth={shape.strokeWidth || 2}
              draggable
              onClick={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(e) => {
                const node = e.target
                handleShapeDragStart(shape.id, node.x() - radius, node.y() - radius)
              }}
              onDragEnd={(e) => {
                const node = e.target
                handleShapeDragEnd(shape.id, node.x() - radius, node.y() - radius)
              }}
            />
          )
        } else if (shape.type === 'text' && shape.text) {
          return (
            <TextShape
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              text={shape.text}
              width={shape.width}
              height={shape.height}
              rotation={shape.rotation}
              fill={shape.fill}
              fontFamily={shape.fontFamily}
              fontSize={shape.fontSize}
              fontWeight={shape.fontWeight}
              fontStyle={shape.fontStyle}
              textAlign={shape.textAlign}
              textDecoration={shape.textDecoration}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
              onDoubleClick={() => handleTextDoubleClick(shape)}
            />
          )
        } else if (shape.type === 'line' && shape.points) {
          return (
            <Line
              key={shape.id}
              id={shape.id}
              points={shape.points}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              arrows={shape.arrows}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(pts: number[], x: number, y: number) => {
                updateShape(shape.id, { points: pts, x, y })
              }}
            />
          )
        } else if (shape.type === 'polygon' && shape.sides) {
          return (
            <Polygon
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rotation={shape.rotation}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              sides={shape.sides}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
            />
          )
        } else if (shape.type === 'star' && shape.sides) {
          return (
            <Star
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rotation={shape.rotation}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              sides={shape.sides}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
            />
          )
        } else if (shape.type === 'roundRect' && shape.cornerRadius !== undefined) {
          return (
            <RoundedRect
              key={shape.id}
              id={shape.id}
              x={shape.x}
              y={shape.y}
              width={shape.width}
              height={shape.height}
              rotation={shape.rotation}
              fill={shape.fill}
              stroke={shape.stroke}
              strokeWidth={shape.strokeWidth}
              cornerRadius={shape.cornerRadius}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(w, h, r, x, y) => handleShapeTransformEnd(shape.id, w, h, r, x, y)}
            />
          )
        } else if (shape.type === 'path' && shape.points) {
          return (
            <Path
              key={shape.id}
              id={shape.id}
              points={shape.points}
              stroke={shape.stroke || '#3B82F6'}
              strokeWidth={shape.strokeWidth || 2}
              tension={shape.tension}
              closed={shape.closed}
              isSelected={isSelected}
              selectionColor={isSelected ? userColor : undefined}
              onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(shape.id, e.evt.shiftKey)}
              onDragStart={(x: number, y: number) => handleShapeDragStart(shape.id, x, y)}
              onDragEnd={(x: number, y: number) => handleShapeDragEnd(shape.id, x, y)}
              onTransformEnd={(pts: number[], x: number, y: number) => {
                updateShape(shape.id, { points: pts, x, y })
              }}
            />
          )
        }
        return null
      })}
      
      {/* Line preview while drawing */}
      {isDrawingLine && lineStartPoint && linePreviewEnd && (
        <KonvaLine
          points={[lineStartPoint.x, lineStartPoint.y, linePreviewEnd.x, linePreviewEnd.y]}
          stroke="#6366F1"
          strokeWidth={2}
          lineCap="round"
          listening={false}
          opacity={0.7}
          dash={[5, 5]}
        />
      )}
      
      {/* Path preview while drawing */}
      {isDrawingPath && currentPathPoints.length >= 2 && (
        <KonvaLine
          points={currentPathPoints}
          stroke="#6366F1"
          strokeWidth={2}
          tension={selectedTool === 'pen' ? 0.5 : 0}
          lineCap="round"
          lineJoin="round"
          listening={false}
          opacity={0.7}
        />
      )}
      
      {/* Render groups */}
      {groups.map((group) => {
        const isSelected = selectedIds.has(group.id)
        const userColor = getUserColor()
        const bounds = calculateBounds(group.id, shapes)
        
        if (!bounds) return null
        
        const renderGroupMember = (shapeId: string) => {
          const shape = shapes.find((s) => s.id === shapeId)
          if (!shape) return null
          
          const relativeX = shape.x - bounds.x
          const relativeY = shape.y - bounds.y
          
          if (shape.type === 'rectangle') {
            return (
              <Rectangle
                key={shape.id}
                id={shape.id}
                x={relativeX}
                y={relativeY}
                width={shape.width}
                height={shape.height}
                rotation={shape.rotation}
                fill={shape.fill}
                stroke={shape.stroke}
                strokeWidth={shape.strokeWidth}
                isSelected={false}
                onSelect={() => {}}
                onDragStart={() => {}}
                onDragEnd={() => {}}
                onTransformEnd={() => {}}
              />
            )
          } else if (shape.type === 'circle') {
            return (
              <Circle
                key={shape.id}
                id={shape.id}
                x={relativeX}
                y={relativeY}
                width={shape.width}
                height={shape.height}
                rotation={shape.rotation}
                fill={shape.fill}
                stroke={shape.stroke}
                strokeWidth={shape.strokeWidth}
                isSelected={false}
                onSelect={() => {}}
                onDragStart={() => {}}
                onDragEnd={() => {}}
                onTransformEnd={() => {}}
              />
            )
          }
          return null
        }
        
        return (
          <Group
            key={group.id}
            id={group.id}
            x={bounds.x}
            y={bounds.y}
            width={bounds.width}
            height={bounds.height}
            rotation={group.rotation}
            isSelected={isSelected}
            selectionColor={isSelected ? userColor : undefined}
            locked={group.locked}
            visible={group.visible}
            onSelect={(e: Konva.KonvaEventObject<MouseEvent>) => handleShapeSelect(group.id, e.evt.shiftKey)}
            onDragStart={() => {
              dragStartPosRef.current = { x: bounds.x, y: bounds.y }
            }}
            onDragEnd={(x: number, y: number) => {
              if (dragStartPosRef.current) {
                const deltaX = x - dragStartPosRef.current.x
                const deltaY = y - dragStartPosRef.current.y
                
                group.memberIds.forEach((memberId) => {
                  const shape = shapes.find((s) => s.id === memberId)
                  if (shape) {
                    updateShape(memberId, {
                      x: shape.x + deltaX,
                      y: shape.y + deltaY,
                    })
                  }
                })
                
                dragStartPosRef.current = null
              }
            }}
          >
            {group.memberIds.map(renderGroupMember)}
          </Group>
        )
      })}
    </>
  )
}

