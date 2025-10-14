import { useState, useRef, useEffect, ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'right' | 'bottom' | 'left'
  delay?: number
}

/**
 * Tooltip - Professional hover tooltip component (PR-20)
 * Shows helpful text on hover with customizable positioning
 */
export function Tooltip({ 
  content, 
  children, 
  side = 'right',
  delay = 300 
}: TooltipProps) {
  const [visible, setVisible] = useState(false)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const timeoutRef = useRef<number>()
  const triggerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  const handleMouseEnter = () => {
    timeoutRef.current = window.setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        
        // Calculate position based on side
        let x = 0
        let y = 0
        
        switch (side) {
          case 'right':
            x = rect.right + 8
            y = rect.top + rect.height / 2
            break
          case 'left':
            x = rect.left - 8
            y = rect.top + rect.height / 2
            break
          case 'top':
            x = rect.left + rect.width / 2
            y = rect.top - 8
            break
          case 'bottom':
            x = rect.left + rect.width / 2
            y = rect.bottom + 8
            break
        }
        
        setPosition({ x, y })
        setVisible(true)
      }
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setVisible(false)
  }

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'inline-block' }}
      >
        {children}
      </div>
      
      {visible && (
        <div
          className="fixed z-[9999] pointer-events-none"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            transform: side === 'right' || side === 'left' 
              ? 'translateY(-50%)'
              : 'translateX(-50%)',
          }}
        >
          <div className="bg-neutral-800 text-white text-xs px-2 py-1 rounded shadow-cursor whitespace-nowrap">
            {content}
          </div>
        </div>
      )}
    </>
  )
}

