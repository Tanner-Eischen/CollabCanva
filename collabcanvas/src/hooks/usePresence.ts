import { useEffect, useRef, useCallback, useState } from 'react'
import { ref, set, onValue, onDisconnect, off } from 'firebase/database'
import { db } from '../services/firebase'
import type { Presence, PresenceData } from '../types/firebase'
import { throttle } from '../utils/throttle'

// Predefined color palette for user cursors and selections
const USER_COLORS = [
  '#EF4444', // red
  '#F59E0B', // amber
  '#10B981', // emerald
  '#3B82F6', // blue
  '#8B5CF6', // violet
  '#EC4899', // pink
  '#14B8A6', // teal
  '#F97316', // orange
]

/**
 * Generate a consistent color for a user based on their userId
 */
function getUserColor(userId: string): string {
  // Simple hash function to get consistent color per user
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % USER_COLORS.length
  return USER_COLORS[index]
}

interface UsePresenceOptions {
  userId: string
  userName: string
  canvasId: string
}

interface UsePresenceReturn {
  otherUsers: Map<string, Presence>
  updateCursorPosition: (x: number, y: number) => void
  updateSelection: (objectIds: string[] | null) => void
}

/**
 * Hook to manage user presence (cursor position, selection state)
 * Throttles cursor updates to 20Hz (50ms intervals)
 */
export function usePresence({
  userId,
  userName,
  canvasId: _canvasId,
}: UsePresenceOptions): UsePresenceReturn {
  const [otherUsers, setOtherUsers] = useState<Map<string, Presence>>(new Map())
  const userColor = useRef<string>(getUserColor(userId || 'default'))
  const currentPresence = useRef<Presence>({
    n: userName,
    cl: userColor.current,
    c: [0, 0],
    sel: null,
  })

  /**
   * Update cursor position (throttled to 50ms / 20Hz)
   */
  const updateCursorPosition = useCallback(
    throttle((x: number, y: number) => {
      // Don't update if user is not authenticated
      if (!userId || !_canvasId) return
      
      // Collab Spaces use shared presence paths
      const collabSpaces = ['collab-art', 'collab-design', 'collab-education', 'collab-content', 'collab-gamedev', 'collab-architecture']
      const presencePath = collabSpaces.includes(_canvasId) ? `collab-presence/${_canvasId}/${userId}` : `presence/${_canvasId}/${userId}`
      const presenceRef = ref(db, presencePath)
      
      currentPresence.current.c = [x, y]
      set(presenceRef, currentPresence.current).catch((error) => {
        console.error('Failed to update cursor position:', error)
      })
    }, 50), // 20Hz = 50ms between updates
    [userId, _canvasId]
  )

  /**
   * Update selected object IDs (no throttle needed)
   * Now supports multi-select with array format
   */
  const updateSelection = useCallback(
    (objectIds: string[] | null) => {
      // Don't update if user is not authenticated
      if (!userId || !_canvasId) return
      
      // Collab Spaces use shared presence paths
      const collabSpaces = ['collab-art', 'collab-design', 'collab-education', 'collab-content', 'collab-gamedev', 'collab-architecture']
      const presencePath = collabSpaces.includes(_canvasId) ? `collab-presence/${_canvasId}/${userId}` : `presence/${_canvasId}/${userId}`
      const presenceRef = ref(db, presencePath)
      
      currentPresence.current.sel = objectIds
      set(presenceRef, currentPresence.current).catch((error) => {
        console.error('Failed to update selection:', error)
      })
    },
    [userId, _canvasId]
  )

  /**
   * Initialize presence and listen to other users
   */
  useEffect(() => {
    // Don't initialize presence if userId or canvasId is empty
    if (!userId || !_canvasId) {
      return
    }

    // Collab Spaces use shared presence paths
    const collabSpaces = ['collab-art', 'collab-design', 'collab-education', 'collab-brainstorm', 'collab-content', 'collab-gamedev', 'collab-architecture']
    const presencePath = collabSpaces.includes(_canvasId) ? `collab-presence/${_canvasId}/${userId}` : `presence/${_canvasId}/${userId}`
    const presenceRef = ref(db, presencePath)

    // Set initial presence
    const initialPresence: Presence = {
      n: userName,
      cl: userColor.current,
      c: [0, 0],
      sel: null,
    }
    currentPresence.current = initialPresence
    set(presenceRef, initialPresence).catch((error) => {
      console.error('Failed to set initial presence:', error)
    })

    // Clean up presence on disconnect
    const disconnectRef = onDisconnect(presenceRef)
    disconnectRef.remove().catch((error) => {
      console.error('Failed to set onDisconnect:', error)
    })

    // Listen to all presence updates for this canvas
    const allPresencePath = collabSpaces.includes(_canvasId) ? `collab-presence/${_canvasId}` : `presence/${_canvasId}`
    const allPresenceRef = ref(db, allPresencePath)
    const unsubscribe = onValue(
      allPresenceRef,
      (snapshot) => {
        const presenceData = snapshot.val() as PresenceData | null
        if (!presenceData) {
          setOtherUsers(new Map())
          return
        }

        // Filter out current user and create map
        const otherUsersMap = new Map<string, Presence>()
        Object.entries(presenceData).forEach(([uid, presence]) => {
          if (uid !== userId) {
            otherUsersMap.set(uid, presence)
          }
        })

        setOtherUsers(otherUsersMap)
      },
      (error) => {
        console.error('Failed to listen to presence:', error)
      }
    )

    // Cleanup on unmount
    return () => {
      // Remove presence data
      set(presenceRef, null).catch((error) => {
        console.error('Failed to remove presence:', error)
      })
      // Unsubscribe from presence updates
      off(allPresenceRef, 'value', unsubscribe)
    }
  }, [userId, userName, _canvasId])

  return {
    otherUsers,
    updateCursorPosition,
    updateSelection,
  }
}

