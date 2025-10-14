import { useState, useCallback } from 'react'

interface ContextMenuState {
  x: number
  y: number
  visible: boolean
}

/**
 * useContextMenu - Hook for managing context menu state (PR-20)
 * Provides show/hide functionality with position tracking
 */
export function useContextMenu() {
  const [contextMenu, setContextMenu] = useState<ContextMenuState>({
    x: 0,
    y: 0,
    visible: false,
  })

  const show = useCallback((x: number, y: number) => {
    setContextMenu({ x, y, visible: true })
  }, [])

  const hide = useCallback(() => {
    setContextMenu((prev) => ({ ...prev, visible: false }))
  }, [])

  const toggle = useCallback((x: number, y: number) => {
    setContextMenu((prev) => 
      prev.visible ? { ...prev, visible: false } : { x, y, visible: true }
    )
  }, [])

  return {
    contextMenu,
    show,
    hide,
    toggle,
  }
}

