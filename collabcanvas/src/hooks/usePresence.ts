import { useEffect, useRef, useCallback, useState } from 'react'
import { ref, set, onValue, onDisconnect, off } from 'firebase/database'
import { db } from '../services/firebase'
import { Presence, PresenceData } from '../types/firebase'
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
  updateSelection: (objectId: string | null) => void
}

/**
 * Hook to manage user presence (cursor position, selection state)
 * Throttles cursor updates to 20Hz (50ms intervals)
 */
export function usePresence({
  userId,
  userName,
  canvasId,
}: UsePresenceOptions): UsePresenceReturn {
  const [otherUsers, setOtherUsers] = useState<Map<string, Presence>>(new Map())
  const userColor = useRef<string>(getUserColor(userId))
  const presenceRef = useRef(ref(db, `presence/${userId}`))
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
      currentPresence.current.c = [x, y]
      set(presenceRef.current, currentPresence.current).catch((error) => {
        console.error('Failed to update cursor position:', error)
      })
    }, 50), // 20Hz = 50ms between updates
    [userId]
  )

  /**
   * Update selected object ID (no throttle needed)
   */
  const updateSelection = useCallback(
    (objectId: string | null) => {
      currentPresence.current.sel = objectId
      set(presenceRef.current, currentPresence.current).catch((error) => {
        console.error('Failed to update selection:', error)
      })
    },
    [userId]
  )

  /**
   * Initialize presence and listen to other users
   */
  useEffect(() => {
    // Set initial presence
    const initialPresence: Presence = {
      n: userName,
      cl: userColor.current,
      c: [0, 0],
      sel: null,
    }
    currentPresence.current = initialPresence
    set(presenceRef.current, initialPresence).catch((error) => {
      console.error('Failed to set initial presence:', error)
    })

    // Clean up presence on disconnect
    const disconnectRef = onDisconnect(presenceRef.current)
    disconnectRef.remove().catch((error) => {
      console.error('Failed to set onDisconnect:', error)
    })

    // Listen to all presence updates
    const allPresenceRef = ref(db, 'presence')
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
      set(presenceRef.current, null).catch((error) => {
        console.error('Failed to remove presence:', error)
      })
      // Unsubscribe from presence updates
      off(allPresenceRef, 'value', unsubscribe)
    }
  }, [userId, userName])

  return {
    otherUsers,
    updateCursorPosition,
    updateSelection,
  }
}

