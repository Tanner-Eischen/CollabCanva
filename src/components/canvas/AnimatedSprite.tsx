/**
 * AnimatedSprite Component
 * Renders a sprite with frame-by-frame animation on the canvas
 * PR-31: Animation Integration
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { Image as KonvaImage, Transformer } from 'react-konva'
import type Konva from 'konva'
import useImage from 'use-image'
import { ref, onValue } from 'firebase/database'
import { db } from '../../services/firebase'
import type { Animation } from '../../types/animation'

interface AnimatedSpriteProps {
  id: string
  x: number
  y: number
  width: number
  height: number
  rotation?: number
  animationId: string
  spriteSheetId?: string
  currentFrame?: number
  isPlaying?: boolean
  flipX?: boolean
  flipY?: boolean
  opacity?: number
  isSelected: boolean
  selectionColor?: string
  onSelect: (e: Konva.KonvaEventObject<MouseEvent>) => void
  onDragStart: (x: number, y: number) => void
  onDragEnd: (x: number, y: number) => void
  onTransformEnd: (width: number, height: number, rotation: number, x: number, y: number) => void
  onFrameChange?: (frame: number) => void
}

/**
 * AnimatedSprite shape component
 * Plays sprite sheet animations with frame cycling
 */
export default function AnimatedSprite({
  id: _id,
  x,
  y,
  width,
  height,
  rotation = 0,
  animationId,
  spriteSheetId,
  currentFrame: initialFrame = 0,
  isPlaying = true,
  flipX = false,
  flipY = false,
  opacity = 1,
  isSelected,
  selectionColor: _selectionColor,
  onSelect,
  onDragStart,
  onDragEnd,
  onTransformEnd,
  onFrameChange,
}: AnimatedSpriteProps) {
  const shapeRef = useRef<Konva.Image>(null)
  const trRef = useRef<Konva.Transformer>(null)
  
  // Animation state
  const [animation, setAnimation] = useState<Animation | null>(null)
  const [currentFrame, setCurrentFrame] = useState(initialFrame)
  const [spriteSheetUrl, setSpriteSheetUrl] = useState<string>('')
  const lastFrameTime = useRef<number>(Date.now())
  const frameAccumulator = useRef<number>(0)
  
  // Load sprite sheet image
  const [image] = useImage(spriteSheetUrl, 'anonymous')

  // Load animation data from Firebase
  useEffect(() => {
    if (!animationId) return

    const animationRef = ref(db, `animations/${animationId}`)
    const unsubscribe = onValue(animationRef, (snapshot) => {
      const data = snapshot.val()
      if (data) {
        setAnimation(data as Animation)
        
        // Load sprite sheet URL
        if (data.spriteSheetId || spriteSheetId) {
          const assetId = data.spriteSheetId || spriteSheetId
          const assetRef = ref(db, `assets/${assetId}`)
          onValue(assetRef, (assetSnapshot) => {
            const assetData = assetSnapshot.val()
            if (assetData && assetData.url) {
              setSpriteSheetUrl(assetData.url)
            }
          })
        }
      }
    })

    return () => unsubscribe()
  }, [animationId, spriteSheetId])

  // Animation frame cycling
  useEffect(() => {
    if (!isPlaying || !animation || animation.frames.length === 0) return

    const animate = () => {
      const now = Date.now()
      const deltaTime = now - lastFrameTime.current
      lastFrameTime.current = now

      // Accumulate time
      frameAccumulator.current += deltaTime

      // Get current frame data
      const frameData = animation.frames[currentFrame]
      const frameDuration = frameData?.duration || (1000 / (animation.fps || 12))

      // Check if it's time to advance to next frame
      if (frameAccumulator.current >= frameDuration) {
        frameAccumulator.current = 0
        
        const nextFrame = currentFrame + 1
        
        if (nextFrame >= animation.frames.length) {
          // End of animation
          if (animation.loop) {
            // Loop back to start
            setCurrentFrame(0)
            onFrameChange?.(0)
          } else {
            // Stop at last frame
            // Keep current frame
          }
        } else {
          // Advance to next frame
          setCurrentFrame(nextFrame)
          onFrameChange?.(nextFrame)
        }
      }

      requestRef.current = requestAnimationFrame(animate)
    }

    const requestRef = { current: 0 }
    requestRef.current = requestAnimationFrame(animate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [isPlaying, animation, currentFrame, onFrameChange])

  // Attach transformer to shape when selected
  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const handleDragStart = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    onDragStart(node.x(), node.y())
  }

  const handleDragEnd = (e: Konva.KonvaEventObject<DragEvent>) => {
    const node = e.target
    onDragEnd(node.x(), node.y())
  }

  const handleTransformEnd = () => {
    const node = shapeRef.current
    if (!node) return

    const scaleX = node.scaleX()
    const scaleY = node.scaleY()

    // Reset scale to 1 and apply to width/height instead
    node.scaleX(1)
    node.scaleY(1)

    onTransformEnd(
      Math.max(10, node.width() * scaleX), // min width 10px
      Math.max(10, node.height() * scaleY), // min height 10px
      node.rotation(),
      node.x(),
      node.y()
    )
  }

  // Get current frame crop coordinates
  const getCrop = useCallback(() => {
    if (!animation || !animation.frames[currentFrame]) {
      return { x: 0, y: 0, width: 32, height: 32 }
    }

    const frame = animation.frames[currentFrame]
    return {
      x: frame.x,
      y: frame.y,
      width: frame.width,
      height: frame.height
    }
  }, [animation, currentFrame])

  if (!image || !animation) {
    // Show placeholder while loading
    return null
  }

  const crop = getCrop()

  return (
    <>
      <KonvaImage
        ref={shapeRef}
        x={x}
        y={y}
        width={width}
        height={height}
        rotation={rotation}
        image={image}
        crop={crop}
        scaleX={flipX ? -1 : 1}
        scaleY={flipY ? -1 : 1}
        offsetX={flipX ? width : 0}
        offsetY={flipY ? height : 0}
        opacity={opacity}
        draggable
        onClick={onSelect}
        onTap={onSelect}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onTransformEnd={handleTransformEnd}
        // Visual feedback
        shadowColor="black"
        shadowBlur={isSelected ? 10 : 0}
        shadowOpacity={isSelected ? 0.3 : 0}
      />
      
      {isSelected && (
        <Transformer
          ref={trRef}
          rotateEnabled={true}
          enabledAnchors={[
            'top-left',
            'top-right',
            'bottom-left',
            'bottom-right',
          ]}
          borderStroke="#3B82F6"
          borderStrokeWidth={2}
          anchorFill="#3B82F6"
          anchorStroke="#FFFFFF"
          anchorSize={8}
          anchorCornerRadius={4}
        />
      )}
    </>
  )
}


