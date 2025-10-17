/**
 * AnimatedTile Component
 * Renders an animated tile using sprite sheet animation (water, torches, etc.)
 * Follows the same pattern as AnimatedSprite but optimized for tilemap tiles
 */

import { useRef, useEffect, useState, useCallback } from 'react'
import { Image as KonvaImage, Rect } from 'react-konva'
import { ref as dbRef, onValue } from 'firebase/database'
import { db } from '../../services/firebase'
import { useSprite } from '../../hooks/useSpriteCache'
import type { Animation } from '../../types/animation'

interface AnimatedTileProps {
  x: number // World X position (pixels)
  y: number // World Y position (pixels)
  tileSize: number // Rendered tile size (16, 32, etc.)
  animationId: string // Animation ID from Firebase
  color?: string // Fallback color if animation fails to load
  opacity?: number // Tile opacity
  isPlaying?: boolean // Whether animation should play (default: true)
}

/**
 * Animated Tile Renderer
 *
 * Renders a tile with frame-by-frame animation.
 * Reuses animation system from AnimatedSprite.
 * Falls back to colored rectangle if animation fails to load.
 *
 * @performance
 * - Shares animation data across all tiles using same animation
 * - Sprite sheets are cached (no redundant loads)
 * - Uses requestAnimationFrame for smooth playback
 */
export default function AnimatedTile({
  x,
  y,
  tileSize,
  animationId,
  color = '#888888',
  opacity = 1,
  isPlaying = true,
}: AnimatedTileProps) {
  // Animation state
  const [animation, setAnimation] = useState<Animation | null>(null)
  const [currentFrame, setCurrentFrame] = useState(0)
  const [spriteSheetUrl, setSpriteSheetUrl] = useState<string>('')
  const lastFrameTime = useRef<number>(Date.now())
  const frameAccumulator = useRef<number>(0)

  // Load sprite sheet image
  const image = useSprite(spriteSheetUrl)

  // Load animation data from Firebase
  useEffect(() => {
    if (!animationId) return

    const animationRef = dbRef(db, `animations/${animationId}`)
    const unsubscribe = onValue(
      animationRef,
      (snapshot) => {
        const data = snapshot.val()
        if (data) {
          setAnimation(data as Animation)

          // Load sprite sheet URL from asset
          if (data.spriteSheetId) {
            const assetRef = dbRef(db, `assets/${data.spriteSheetId}`)
            onValue(assetRef, (assetSnapshot) => {
              const assetData = assetSnapshot.val()
              if (assetData && assetData.url) {
                setSpriteSheetUrl(assetData.url)
              }
            })
          }
        }
      },
      (error) => {
        console.error('Failed to load animation:', error)
      }
    )

    return () => unsubscribe()
  }, [animationId])

  // Animation frame cycling (same logic as AnimatedSprite)
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
      const frameDuration = frameData?.duration || 1000 / (animation.fps || 12)

      // Check if it's time to advance to next frame
      if (frameAccumulator.current >= frameDuration) {
        frameAccumulator.current = 0

        const nextFrame = currentFrame + 1

        if (nextFrame >= animation.frames.length) {
          // End of animation
          if (animation.loop) {
            // Loop back to start
            setCurrentFrame(0)
          }
          // Otherwise stay on last frame
        } else {
          // Advance to next frame
          setCurrentFrame(nextFrame)
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
  }, [isPlaying, animation, currentFrame])

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
      height: frame.height,
    }
  }, [animation, currentFrame])

  // Show loading/error fallback (colored rectangle)
  if (!image || !animation) {
    return (
      <Rect
        x={x}
        y={y}
        width={tileSize}
        height={tileSize}
        fill={color}
        opacity={opacity * 0.5}
        stroke={color}
        strokeWidth={0.5}
        listening={false}
      />
    )
  }

  const crop = getCrop()

  // Render animated tile
  return (
    <KonvaImage
      x={x}
      y={y}
      width={tileSize}
      height={tileSize}
      image={image}
      crop={crop}
      opacity={opacity}
      // Pixelated scaling for crisp pixel art
      imageSmoothingEnabled={false}
      listening={false}
      perfectDrawEnabled={false}
    />
  )
}

