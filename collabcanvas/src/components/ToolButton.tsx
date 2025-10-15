import type { ReactNode } from 'react'
import { Tooltip } from './Tooltip'

interface ToolButtonProps {
  icon: ReactNode
  iconPath?: string
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  themed?: boolean
}

/**
 * ToolButton - Professional toolbar button with tooltip (PR-20)
 * 36px square, rounded corners, Figma-style hover states
 */
export function ToolButton({
  icon,
  iconPath,
  label,
  shortcut,
  active = false,
  disabled = false,
  onClick,
  themed = false,
}: ToolButtonProps) {
  const tooltipContent = shortcut ? `${label} (${shortcut})` : label

  return (
    <Tooltip content={tooltipContent} side="right">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center
          transition-all duration-150 relative
          focus:outline-none
          ${
            active
              ? themed
                ? 'bg-white/30 text-white shadow-sm'
                : 'bg-blue-500 text-white shadow-md'
              : disabled
              ? themed
                ? 'bg-white/10 text-white/40 cursor-not-allowed'
                : 'bg-neutral-50 text-neutral-400 cursor-not-allowed'
              : themed
                ? 'bg-white/15 text-white hover:bg-white/25'
                : 'bg-neutral-50 text-neutral-700 hover:bg-neutral-100'
          }
        `}
      >
        {iconPath ? (
          <img 
            src={iconPath} 
            alt={label}
            className="w-4 h-4"
            style={{ filter: active ? 'brightness(1)' : disabled ? 'brightness(0.5)' : 'brightness(0.9)' }}
          />
        ) : (
          <span className="text-lg">{icon}</span>
        )}
        {active && (
          <div className="absolute inset-0 rounded-lg ring-2 ring-white ring-opacity-50" />
        )}
      </button>
    </Tooltip>
  )
}

