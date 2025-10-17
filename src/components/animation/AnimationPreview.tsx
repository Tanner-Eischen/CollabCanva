/**
 * Animation Preview Component (PR-31)
 * Live preview of sprite animation
 */

import { useState, useEffect, useRef } from 'react'
import type { Animation } from '../../types/animation'
import { getFrameAtTime, calculateAnimationDuration } from '../../services/assets/animation'

interface AnimationPreviewProps {
  animation: Animation
  spriteSheetUrl: string
  scale?: number
  autoPlay?: boolean
  background?: 'transparent' | 'checkerboard' | 'white' | 'black'
}

export function AnimationPreview({
  animation,
  spriteSheetUrl,
  scale = 2,
  autoPlay = true,
  background = 'checkerboard'
}: AnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [spriteSheetImage, setSpriteSheetImage] = useState<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationStartTime = useRef<number>(Date.now())
  const animationFrameRef = useRef<number | null>(null)

  // Load sprite sheet
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => setSpriteSheetImage(img)
    img.src = spriteSheetUrl
  }, [spriteSheetUrl])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !spriteSheetImage) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
        animationFrameRef.current = null
      }
      return
    }

    const animate = () => {
      const elapsed = Date.now() - animationStartTime.current
      const totalDuration = calculateAnimationDuration(animation)
      const frameIndex = getFrameAtTime(animation, elapsed % totalDuration)
      setCurrentFrameIndex(frameIndex)

      animationFrameRef.current = requestAnimationFrame(animate)
    }

    animationStartTime.current = Date.now()
    animationFrameRef.current = requestAnimationFrame(animate)

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [isPlaying, spriteSheetImage, animation])

  // Draw current frame
  useEffect(() => {
    if (!canvasRef.current || !spriteSheetImage || !animation.frames[currentFrameIndex]) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frame = animation.frames[currentFrameIndex]
    
    canvas.width = frame.width * scale
    canvas.height = frame.height * scale

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw background
    if (background === 'checkerboard') {
      drawCheckerboard(ctx, canvas.width, canvas.height)
    } else if (background !== 'transparent') {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }

    // Draw frame
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(
      spriteSheetImage,
      frame.x, frame.y, frame.width, frame.height,
      0, 0, canvas.width, canvas.height
    )
  }, [spriteSheetImage, currentFrameIndex, scale, background, animation])

  const drawCheckerboard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const tileSize = 8
    ctx.fillStyle = '#e0e0e0'
    ctx.fillRect(0, 0, width, height)
    ctx.fillStyle = '#f5f5f5'
    
    for (let y = 0; y < height; y += tileSize) {
      for (let x = 0; x < width; x += tileSize) {
        if ((x / tileSize + y / tileSize) % 2 === 0) {
          ctx.fillRect(x, y, tileSize, tileSize)
        }
      }
    }
  }

  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      animationStartTime.current = Date.now()
      setIsPlaying(true)
    }
  }

  return (
    <div className="inline-block">
      {/* Preview canvas */}
      <div 
        className="border border-gray-300 rounded mb-2 inline-block cursor-pointer"
        onClick={togglePlayback}
        title={isPlaying ? 'Click to pause' : 'Click to play'}
      >
        <canvas
          ref={canvasRef}
          style={{ 
            imageRendering: 'pixelated',
            display: 'block'
          }}
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between gap-2">
        <button
          onClick={togglePlayback}
          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm"
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>

        <span className="text-sm text-gray-600">
          Frame {currentFrameIndex + 1}/{animation.frames.length}
        </span>

        <div className="flex items-center gap-1">
          <label className="text-xs text-gray-600">Scale:</label>
          <span className="text-sm font-medium text-gray-900">{scale}x</span>
        </div>
      </div>
    </div>
  )
}


