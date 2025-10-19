/**
 * TileAnimationPreview Component
 * Preview panel for animated tiles with frame scrubbing
 * Follows the pattern of AnimationPreview but optimized for tilemap inspector
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import type { Animation } from '../../types/animation'
import { getFrameAtTime, calculateAnimationDuration } from '../../services/assets/animation'

interface TileAnimationPreviewProps {
  animation: Animation | null
  spriteSheetUrl: string
  tileSize?: number
  autoPlay?: boolean
  onClose?: () => void
}

/**
 * Tile Animation Preview
 * Shows animation playback with frame scrubbing controls
 */
export default function TileAnimationPreview({
  animation,
  spriteSheetUrl,
  tileSize = 64,
  autoPlay = true,
  onClose,
}: TileAnimationPreviewProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [spriteSheetImage, setSpriteSheetImage] = useState<HTMLImageElement | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationStartTime = useRef<number>(Date.now())
  const animationFrameRef = useRef<number | null>(null)

  // Load sprite sheet
  useEffect(() => {
    if (!spriteSheetUrl) return
    
    const img = new Image()
    if (spriteSheetUrl.startsWith('http')) {
      img.crossOrigin = 'anonymous'
    }
    img.onload = () => setSpriteSheetImage(img)
    img.onerror = () => {
      console.error('Failed to load sprite sheet for preview')
      setSpriteSheetImage(null)
    }
    img.src = spriteSheetUrl
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [spriteSheetUrl])

  // Animation loop
  useEffect(() => {
    if (!isPlaying || !spriteSheetImage || !animation) {
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
    if (!canvasRef.current || !spriteSheetImage || !animation?.frames[currentFrameIndex]) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const frame = animation.frames[currentFrameIndex]

    canvas.width = tileSize
    canvas.height = tileSize

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Disable image smoothing for pixel art
    ctx.imageSmoothingEnabled = false

    // Draw current frame (scaled to tile size)
    ctx.drawImage(
      spriteSheetImage,
      frame.x,
      frame.y,
      frame.width,
      frame.height,
      0,
      0,
      tileSize,
      tileSize
    )
  }, [spriteSheetImage, currentFrameIndex, animation, tileSize])

  // Handle frame scrubbing
  const handleScrub = useCallback((frameIndex: number) => {
    setIsPlaying(false)
    setCurrentFrameIndex(frameIndex)
  }, [])

  const handlePlay = useCallback(() => {
    animationStartTime.current = Date.now()
    setIsPlaying(true)
  }, [])

  const handlePause = useCallback(() => {
    setIsPlaying(false)
  }, [])

  if (!animation) {
    return (
      <div className="p-4 bg-slate-800 rounded-lg text-white">
        <p className="text-sm text-white/50">No animation selected</p>
      </div>
    )
  }

  const totalDuration = calculateAnimationDuration(animation)

  return (
    <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-lg p-4 shadow-xl border border-white/10">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white">{animation.name}</h3>
          <p className="text-[10px] text-white/50 font-mono">
            {animation.frames.length} frames • {animation.fps} fps • {totalDuration.toFixed(0)}ms
          </p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-6 h-6 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
          >
            ✕
          </button>
        )}
      </div>

      {/* Preview Canvas */}
      <div className="relative mb-3">
        <div
          className="relative mx-auto rounded-lg overflow-hidden"
          style={{
            width: tileSize,
            height: tileSize,
            background: 'repeating-conic-gradient(#374151 0% 25%, #4b5563 0% 50%) 50% / 8px 8px',
          }}
        >
          <canvas
            ref={canvasRef}
            width={tileSize}
            height={tileSize}
            className="block"
          />
        </div>

        {/* Loop indicator */}
        {animation.loop && (
          <div className="absolute top-1 right-1 bg-blue-500/80 text-white text-[9px] px-1.5 py-0.5 rounded font-mono">
            🔁 LOOP
          </div>
        )}
      </div>

      {/* Playback Controls */}
      <div className="flex items-center gap-2 mb-2">
        <button
          onClick={isPlaying ? handlePause : handlePlay}
          className="flex-shrink-0 w-8 h-8 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center text-white text-sm transition-all"
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        <div className="text-[10px] text-white/70 font-mono">
          Frame {currentFrameIndex + 1}/{animation.frames.length}
        </div>
      </div>

      {/* Frame Scrubber */}
      <div className="space-y-1">
        <input
          type="range"
          min="0"
          max={animation.frames.length - 1}
          value={currentFrameIndex}
          onChange={(e) => handleScrub(Number(e.target.value))}
          className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
          style={{
            background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${(currentFrameIndex / (animation.frames.length - 1)) * 100}%, rgba(255,255,255,0.1) ${(currentFrameIndex / (animation.frames.length - 1)) * 100}%, rgba(255,255,255,0.1) 100%)`
          }}
        />

        {/* Frame dots */}
        <div className="flex gap-0.5">
          {animation.frames.map((_, index) => (
            <button
              key={index}
              onClick={() => handleScrub(index)}
              className={`flex-1 h-1 rounded-full transition-all ${
                index === currentFrameIndex
                  ? 'bg-blue-400'
                  : 'bg-white/20 hover:bg-white/30'
              }`}
              title={`Frame ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

