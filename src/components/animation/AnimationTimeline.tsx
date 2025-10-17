/**
 * Animation Timeline Component (PR-31)
 * Timeline editor for sprite animations
 */

import { useState, useRef, useEffect } from 'react'
import type { Animation, AnimationFrame } from '../../types/animation'

interface AnimationTimelineProps {
  animation: Animation
  spriteSheetUrl: string
  onUpdateFrames: (frames: AnimationFrame[]) => void
  onUpdateFps: (fps: number) => void
  onUpdateLoop: (loop: boolean) => void
}

export function AnimationTimeline({
  animation,
  spriteSheetUrl,
  onUpdateFrames,
  onUpdateFps,
  onUpdateLoop
}: AnimationTimelineProps) {
  const [selectedFrameIndex, setSelectedFrameIndex] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPlayFrame, setCurrentPlayFrame] = useState(0)
  const [draggedFrameIndex, setDraggedFrameIndex] = useState<number | null>(null)
  const playIntervalRef = useRef<number | null>(null)
  const spriteSheetImageRef = useRef<HTMLImageElement | null>(null)

  // Load sprite sheet image
  useEffect(() => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.src = spriteSheetUrl
    img.onload = () => {
      spriteSheetImageRef.current = img
    }
  }, [spriteSheetUrl])

  // Animation playback
  useEffect(() => {
    if (!isPlaying) {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
        playIntervalRef.current = null
      }
      return
    }

    const frameDuration = 1000 / animation.fps
    playIntervalRef.current = window.setInterval(() => {
      setCurrentPlayFrame(prev => {
        const next = prev + 1
        if (next >= animation.frames.length) {
          if (animation.loop) {
            return 0
          } else {
            setIsPlaying(false)
            return prev
          }
        }
        return next
      })
    }, frameDuration)

    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [isPlaying, animation.fps, animation.frames.length, animation.loop])

  // Handle play/pause
  const togglePlayback = () => {
    if (isPlaying) {
      setIsPlaying(false)
    } else {
      setCurrentPlayFrame(0)
      setIsPlaying(true)
    }
  }

  // Handle frame selection
  const selectFrame = (index: number) => {
    setSelectedFrameIndex(index)
    setIsPlaying(false)
    setCurrentPlayFrame(index)
  }

  // Handle frame deletion
  const deleteFrame = (index: number) => {
    if (animation.frames.length <= 1) return // Don't allow deleting last frame
    
    const newFrames = animation.frames.filter((_, i) => i !== index)
    onUpdateFrames(newFrames)
    
    if (selectedFrameIndex === index) {
      setSelectedFrameIndex(null)
    } else if (selectedFrameIndex !== null && selectedFrameIndex > index) {
      setSelectedFrameIndex(selectedFrameIndex - 1)
    }
  }

  // Handle frame duplication
  const duplicateFrame = (index: number) => {
    const frameToDuplicate = animation.frames[index]
    const newFrames = [
      ...animation.frames.slice(0, index + 1),
      { ...frameToDuplicate },
      ...animation.frames.slice(index + 1)
    ]
    onUpdateFrames(newFrames)
  }

  // Handle drag start
  const handleDragStart = (index: number) => {
    setDraggedFrameIndex(index)
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    if (draggedFrameIndex === null || draggedFrameIndex === index) return

    const newFrames = [...animation.frames]
    const [draggedFrame] = newFrames.splice(draggedFrameIndex, 1)
    newFrames.splice(index, 0, draggedFrame)

    onUpdateFrames(newFrames)
    setDraggedFrameIndex(index)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedFrameIndex(null)
  }

  // Render frame thumbnail
  const renderFrameThumbnail = (frame: AnimationFrame, size: number = 64) => {
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx || !spriteSheetImageRef.current) return null

    // Scale to fit
    const scale = Math.min(size / frame.width, size / frame.height)
    const scaledWidth = frame.width * scale
    const scaledHeight = frame.height * scale
    const offsetX = (size - scaledWidth) / 2
    const offsetY = (size - scaledHeight) / 2

    // Draw frame
    ctx.drawImage(
      spriteSheetImageRef.current,
      frame.x, frame.y, frame.width, frame.height,
      offsetX, offsetY, scaledWidth, scaledHeight
    )

    return canvas.toDataURL()
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4">
      {/* Controls */}
      <div className="mb-4 flex items-center justify-between gap-4">
        {/* Playback controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={togglePlayback}
            className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false)
              setCurrentPlayFrame(0)
            }}
            className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            title="Stop"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h12v12H6z" />
            </svg>
          </button>

          <div className="flex items-center gap-2 ml-2">
            <label htmlFor="loop-toggle" className="text-sm text-gray-700">
              Loop
            </label>
            <input
              id="loop-toggle"
              type="checkbox"
              checked={animation.loop}
              onChange={(e) => onUpdateLoop(e.target.checked)}
              className="w-4 h-4"
            />
          </div>
        </div>

        {/* FPS control */}
        <div className="flex items-center gap-2">
          <label htmlFor="fps-slider" className="text-sm text-gray-700">
            FPS:
          </label>
          <input
            id="fps-slider"
            type="range"
            min="1"
            max="60"
            value={animation.fps}
            onChange={(e) => onUpdateFps(parseInt(e.target.value))}
            className="w-32"
          />
          <span className="text-sm font-medium text-gray-900 w-8">{animation.fps}</span>
        </div>

        {/* Frame count */}
        <div className="text-sm text-gray-600">
          Frame {currentPlayFrame + 1} / {animation.frames.length}
        </div>
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Frame strip */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {animation.frames.map((frame, index) => (
            <div
              key={index}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              onClick={() => selectFrame(index)}
              className={`flex-shrink-0 cursor-pointer border-2 rounded transition-all ${
                selectedFrameIndex === index
                  ? 'border-blue-500 bg-blue-50'
                  : currentPlayFrame === index && isPlaying
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              {/* Frame thumbnail */}
              <div className="w-20 h-20 bg-gray-100 flex items-center justify-center">
                {spriteSheetImageRef.current && (
                  <img
                    src={renderFrameThumbnail(frame, 64) || ''}
                    alt={`Frame ${index}`}
                    className="max-w-full max-h-full"
                    style={{ imageRendering: 'pixelated' }}
                  />
                )}
              </div>

              {/* Frame info */}
              <div className="px-2 py-1 bg-white">
                <div className="text-xs text-gray-600 text-center">
                  {index}
                </div>
              </div>

              {/* Frame actions */}
              <div className="flex gap-1 p-1 bg-gray-50">
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    duplicateFrame(index)
                  }}
                  className="flex-1 text-xs px-1 py-0.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                  title="Duplicate"
                >
                  ⧉
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    deleteFrame(index)
                  }}
                  className="flex-1 text-xs px-1 py-0.5 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  title="Delete"
                  disabled={animation.frames.length <= 1}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Playhead indicator */}
        {isPlaying && (
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-green-500 pointer-events-none transition-all"
            style={{
              left: `${(currentPlayFrame * 88) + 40}px` // 80px width + 8px gap
            }}
          />
        )}
      </div>

      {/* Selected frame details */}
      {selectedFrameIndex !== null && (
        <div className="mt-4 p-3 bg-gray-50 rounded border border-gray-200">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Frame {selectedFrameIndex} Details
          </h4>
          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
            <div>X: {animation.frames[selectedFrameIndex].x}</div>
            <div>Y: {animation.frames[selectedFrameIndex].y}</div>
            <div>Width: {animation.frames[selectedFrameIndex].width}</div>
            <div>Height: {animation.frames[selectedFrameIndex].height}</div>
          </div>
        </div>
      )}
    </div>
  )
}


