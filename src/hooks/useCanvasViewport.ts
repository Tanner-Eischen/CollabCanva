import { useState, useCallback, useEffect, useRef } from 'react'
import Konva from 'konva'
import type { ViewportTransform } from '../types/canvas'
import { DEFAULT_CANVAS_CONFIG, DEFAULT_CANVAS_BOUNDS } from '../types/canvas'

const CANVAS_CONFIG = DEFAULT_CANVAS_CONFIG
const CANVAS_BOUNDS = DEFAULT_CANVAS_BOUNDS

interface UseCanvasViewportProps {
  containerWidth: number
  containerHeight: number
  onViewportChange?: (viewport: ViewportTransform) => void
  onZoomChange?: (scale: number) => void
}

export function useCanvasViewport({
  containerWidth,
  containerHeight,
  onViewportChange,
  onZoomChange,
}: UseCanvasViewportProps) {
  const [viewport, setViewport] = useState<ViewportTransform>({
    x: 0,
    y: 0,
    scale: 1,
  })

  // Center canvas on initial load
  useEffect(() => {
    const centerX = (containerWidth / 2) - (CANVAS_BOUNDS.maxX / 2)
    const centerY = (containerHeight / 2) - (CANVAS_BOUNDS.maxY / 2)
    
    const initialViewport = {
      x: centerX,
      y: centerY,
      scale: 1,
    }
    setViewport(initialViewport)
    onViewportChange?.(initialViewport)
    onZoomChange?.(1)
  }, [containerWidth, containerHeight]) // eslint-disable-line react-hooks/exhaustive-deps

  // Notify parent of viewport changes
  const viewportCallbacksRef = useRef({ onViewportChange, onZoomChange })
  useEffect(() => {
    viewportCallbacksRef.current = { onViewportChange, onZoomChange }
  }, [onViewportChange, onZoomChange])

  useEffect(() => {
    viewportCallbacksRef.current.onViewportChange?.(viewport)
    viewportCallbacksRef.current.onZoomChange?.(viewport.scale)
  }, [viewport])

  /**
   * Zoom towards a specific point
   */
  const zoomToPoint = useCallback((newScale: number, pointX: number, pointY: number) => {
    const clampedScale = Math.max(
      CANVAS_CONFIG.minScale,
      Math.min(CANVAS_CONFIG.maxScale, newScale)
    )

    const mousePointTo = {
      x: (pointX - viewport.x) / viewport.scale,
      y: (pointY - viewport.y) / viewport.scale,
    }

    const newX = pointX - mousePointTo.x * clampedScale
    const newY = pointY - mousePointTo.y * clampedScale

    setViewport({
      x: newX,
      y: newY,
      scale: clampedScale,
    })
  }, [viewport])

  /**
   * Handle mouse wheel for zoom functionality
   */
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>, stageRef: Konva.Stage) => {
      e.evt.preventDefault()

      const pointer = stageRef.getPointerPosition()
      if (!pointer) return

      const scaleBy = 1.05
      const newScale =
        e.evt.deltaY > 0 ? viewport.scale / scaleBy : viewport.scale * scaleBy

      zoomToPoint(newScale, pointer.x, pointer.y)
    },
    [viewport.scale, zoomToPoint]
  )

  /**
   * Handle drag end for pan functionality with boundary enforcement
   */
  const handleDragEnd = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      const stage = e.target.getStage()
      if (e.target !== stage) {
        return // This is a shape drag, not a stage pan
      }

      const newX = stage.x()
      const newY = stage.y()
      const scale = stage.scaleX()

      // Enforce hard boundaries
      const clampedX = Math.min(
        0,
        Math.max(newX, containerWidth - CANVAS_BOUNDS.maxX * scale)
      )
      const clampedY = Math.min(
        0,
        Math.max(newY, containerHeight - CANVAS_BOUNDS.maxY * scale)
      )

      if (clampedX !== newX || clampedY !== newY) {
        stage.position({ x: clampedX, y: clampedY })
      }

      setViewport({
        x: clampedX,
        y: clampedY,
        scale,
      })
    },
    [containerWidth, containerHeight]
  )

  /**
   * Zoom control functions
   */
  const handleZoomIn = useCallback(() => {
    const newScale = Math.min(viewport.scale * 1.2, CANVAS_CONFIG.maxScale)
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    zoomToPoint(newScale, centerX, centerY)
  }, [viewport.scale, containerWidth, containerHeight, zoomToPoint])

  const handleZoomOut = useCallback(() => {
    const newScale = Math.max(viewport.scale / 1.2, CANVAS_CONFIG.minScale)
    const centerX = containerWidth / 2
    const centerY = containerHeight / 2
    zoomToPoint(newScale, centerX, centerY)
  }, [viewport.scale, containerWidth, containerHeight, zoomToPoint])

  const handleZoomReset = useCallback(() => {
    setViewport((prev) => ({
      ...prev,
      scale: 1,
    }))
  }, [])

  const handleZoomFit = useCallback(() => {
    const scaleX = containerWidth / CANVAS_BOUNDS.maxX
    const scaleY = containerHeight / CANVAS_BOUNDS.maxY
    const newScale = Math.min(scaleX, scaleY) * 0.9

    const newX = (containerWidth - CANVAS_BOUNDS.maxX * newScale) / 2
    const newY = (containerHeight - CANVAS_BOUNDS.maxY * newScale) / 2

    setViewport({
      x: newX,
      y: newY,
      scale: Math.max(CANVAS_CONFIG.minScale, Math.min(CANVAS_CONFIG.maxScale, newScale)),
    })
  }, [containerWidth, containerHeight])

  return {
    viewport,
    setViewport,
    handleWheel,
    handleDragEnd,
    handleZoomIn,
    handleZoomOut,
    handleZoomReset,
    handleZoomFit,
    zoomToPoint,
  }
}

