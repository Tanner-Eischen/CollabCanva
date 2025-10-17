/**
 * Physics Preview Mode
 * Simulates basic physics for preview purposes
 * PR-31: Physics Preview System
 * 
 * Note: This is a simplified preview. For production games, use your game engine's physics.
 */

import { useState, useEffect, useRef } from 'react'
import { Circle, Rect, Group } from 'react-konva'
import type { PhysicsProperties } from '../physics/PhysicsPanel'
import type { CollisionShape } from '../physics/CollisionEditor'
import type { Shape } from '../../types/canvas'

interface PhysicsObject {
  id: string
  shape: Shape
  physics: PhysicsProperties
  collision?: CollisionShape
  velocityX: number
  velocityY: number
}

interface PhysicsPreviewProps {
  shapes: Shape[]
  physicsMap: Map<string, PhysicsProperties>
  collisionMap: Map<string, CollisionShape>
  isPlaying: boolean
  onShapeUpdate: (id: string, x: number, y: number, rotation?: number) => void
}

const GRAVITY = 980 // pixels per second^2 (standard gravity)
const FPS = 60
const TIME_STEP = 1000 / FPS

/**
 * PhysicsPreview component
 * Lightweight physics simulation for preview purposes
 */
export default function PhysicsPreview({
  shapes,
  physicsMap,
  collisionMap,
  isPlaying,
  onShapeUpdate,
}: PhysicsPreviewProps) {
  const [physicsObjects, setPhysicsObjects] = useState<PhysicsObject[]>([])
  const requestRef = useRef<number>(0)
  const lastTime = useRef<number>(Date.now())
  const accumulatorRef = useRef<number>(0)

  // Initialize physics objects
  useEffect(() => {
    const objects: PhysicsObject[] = shapes
      .filter((shape) => {
        const physics = physicsMap.get(shape.id)
        return physics && physics.enabled
      })
      .map((shape) => ({
        id: shape.id,
        shape,
        physics: physicsMap.get(shape.id)!,
        collision: collisionMap.get(shape.id),
        velocityX: 0,
        velocityY: 0,
      }))

    setPhysicsObjects(objects)
  }, [shapes, physicsMap, collisionMap])

  // Physics simulation loop
  useEffect(() => {
    if (!isPlaying || physicsObjects.length === 0) return

    const simulate = () => {
      const now = Date.now()
      const frameTime = now - lastTime.current
      lastTime.current = now

      accumulatorRef.current += frameTime

      while (accumulatorRef.current >= TIME_STEP) {
        // Physics step
        setPhysicsObjects((objects) => {
          return objects.map((obj) => {
            if (obj.physics.bodyType === 'static') {
              // Static objects don't move
              return obj
            }

            if (obj.physics.bodyType === 'kinematic') {
              // Kinematic objects move with set velocity (no physics applied)
              const newX = obj.shape.x + obj.velocityX * (TIME_STEP / 1000)
              const newY = obj.shape.y + obj.velocityY * (TIME_STEP / 1000)
              
              onShapeUpdate(obj.id, newX, newY, obj.shape.rotation)
              
              return {
                ...obj,
                shape: {
                  ...obj.shape,
                  x: newX,
                  y: newY,
                },
              }
            }

            // Dynamic objects: Apply physics
            const dt = TIME_STEP / 1000

            // Apply gravity
            const gravityForce = GRAVITY * obj.physics.gravityScale * obj.physics.mass
            let newVelocityY = obj.velocityY + (gravityForce * dt) / obj.physics.mass

            // Apply velocity
            let newX = obj.shape.x + obj.velocityX * dt
            let newY = obj.shape.y + newVelocityY * dt

            // Simple ground collision (y = canvas bottom)
            const canvasBottom = 600 // TODO: Get from canvas config
            const objectBottom = newY + (obj.shape.height || 0)
            
            if (objectBottom > canvasBottom) {
              // Hit ground
              newY = canvasBottom - (obj.shape.height || 0)
              newVelocityY = -newVelocityY * obj.physics.bounce
              
              // Apply friction
              obj.velocityX *= (1 - obj.physics.friction)
              
              // Stop if moving very slowly
              if (Math.abs(newVelocityY) < 10) {
                newVelocityY = 0
              }
              if (Math.abs(obj.velocityX) < 1) {
                obj.velocityX = 0
              }
            }

            onShapeUpdate(obj.id, newX, newY, obj.shape.rotation)

            return {
              ...obj,
              shape: {
                ...obj.shape,
                x: newX,
                y: newY,
              },
              velocityY: newVelocityY,
            }
          })
        })

        accumulatorRef.current -= TIME_STEP
      }

      requestRef.current = requestAnimationFrame(simulate)
    }

    requestRef.current = requestAnimationFrame(simulate)

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current)
      }
    }
  }, [isPlaying, physicsObjects, onShapeUpdate])

  // Render debug collision shapes
  return (
    <>
      {physicsObjects.map((obj) => {
        const collision = obj.collision
        if (!collision) return null

        const key = `collision-debug-${obj.id}`

        if (collision.type === 'box') {
          return (
            <Rect
              key={key}
              x={obj.shape.x + (collision.x || 0)}
              y={obj.shape.y + (collision.y || 0)}
              width={collision.width || obj.shape.width}
              height={collision.height || obj.shape.height}
              rotation={obj.shape.rotation || 0}
              stroke="#10b981"
              strokeWidth={1}
              dash={[3, 3]}
              listening={false}
            />
          )
        }

        if (collision.type === 'circle') {
          const radius = collision.radius || Math.min(obj.shape.width, obj.shape.height) / 2
          return (
            <Circle
              key={key}
              x={obj.shape.x + (collision.x || 0)}
              y={obj.shape.y + (collision.y || 0)}
              radius={radius}
              stroke="#10b981"
              strokeWidth={1}
              dash={[3, 3]}
              listening={false}
            />
          )
        }

        return null
      })}
    </>
  )
}


