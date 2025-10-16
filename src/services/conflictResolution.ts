/**
 * Conflict Resolution Service
 * Handles concurrent edits with Last-Write-Wins (LWW) strategy
 * Uses timestamps to determine the most recent update
 */

import type { Shape } from '../types/canvas'

export interface TimestampedUpdate {
  timestamp: number
  userId: string
  data: Partial<Shape>
}

/**
 * Merges shape updates using Last-Write-Wins strategy
 * @param current Current shape state
 * @param incoming Incoming update with timestamp
 * @param localTimestamp Timestamp of local update (if any)
 * @returns Merged shape with most recent values
 */
export function mergeShapeUpdates(
  current: Shape,
  incoming: Partial<Shape> & { _ts?: number; _uid?: string },
  localTimestamp?: number
): Shape {
  // If incoming update is older than local, keep local
  if (localTimestamp && incoming._ts && incoming._ts < localTimestamp) {
    return current
  }

  // Merge updates, keeping most recent for each property
  return {
    ...current,
    ...incoming,
  }
}

/**
 * Creates a timestamped update for conflict resolution
 * @param updates Shape property updates
 * @param userId User making the update
 * @returns Update with timestamp and user ID
 */
export function createTimestampedUpdate(
  updates: Partial<Shape>,
  userId: string
): Partial<Shape> & { _ts: number; _uid: string } {
  return {
    ...updates,
    _ts: Date.now(),
    _uid: userId,
  }
}

/**
 * Determines if an incoming update should be applied
 * @param localTimestamp Timestamp of local update
 * @param incomingTimestamp Timestamp of incoming update
 * @returns true if incoming should be applied, false otherwise
 */
export function shouldApplyIncomingUpdate(
  localTimestamp: number | undefined,
  incomingTimestamp: number | undefined
): boolean {
  // If no local timestamp, always apply incoming
  if (!localTimestamp) return true
  
  // If no incoming timestamp, don't apply
  if (!incomingTimestamp) return false
  
  // Apply if incoming is newer
  return incomingTimestamp > localTimestamp
}

