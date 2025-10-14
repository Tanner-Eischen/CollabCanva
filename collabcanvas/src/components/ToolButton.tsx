import { ReactNode } from 'react'
import { Tooltip } from './Tooltip'

interface ToolButtonProps {
  icon: ReactNode
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
}

/**
 * ToolButton - Professional toolbar button with tooltip (PR-20)
 * 36px square, rounded corners, Figma-style hover states
 */
export function ToolButton({
  icon,
  label,
  shortcut,
  active = false,
  disabled = false,
  onClick,
}: ToolButtonProps) {
  const tooltipContent = shortcut ? `${label} (${shortcut})` : label

  return (
    <Tooltip content={tooltipContent} side="right">
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          w-9 h-9 rounded-lg flex items-center justify-center
          transition-all duration-150
          ${
            active
              ? 'bg-primary-100 text-primary-700'
              : disabled
              ? 'text-neutral-400 cursor-not-allowed'
              : 'text-neutral-700 hover:bg-neutral-100'
          }
        `}
      >
        <span className="text-lg">{icon}</span>
      </button>
    </Tooltip>
  )
}

