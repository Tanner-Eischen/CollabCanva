import type { ReactNode } from 'react'
import { Tooltip } from '../ui/Tooltip'

interface ToolButtonProps {
  icon?: ReactNode
  iconPath?: string
  label: string
  shortcut?: string
  active?: boolean
  disabled?: boolean
  onClick: () => void
  themed?: boolean
  ariaControls?: string
  ariaExpanded?: boolean
  ariaHasPopup?: boolean | 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog'
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
  ariaControls,
  ariaExpanded,
  ariaHasPopup,
}: ToolButtonProps) {
  const tooltipContent = shortcut ? `${label} (${shortcut})` : label

  return (
    <Tooltip content={tooltipContent} side="right">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-pressed={active}
        aria-label={tooltipContent}
        aria-controls={ariaControls}
        aria-expanded={ariaExpanded}
        aria-haspopup={ariaHasPopup}
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
            className="w-5 h-5"
            draggable={false}
            style={{
              filter: themed
                ? active
                  ? 'drop-shadow(0 0 4px rgba(255,255,255,0.45))'
                  : disabled
                    ? 'grayscale(0.7) opacity(0.6)'
                    : 'brightness(1.1)'
                : active
                  ? 'brightness(1.05)'
                  : disabled
                    ? 'grayscale(0.8) opacity(0.6)'
                    : 'none',
              display: 'block',
              visibility: 'visible',
              opacity: 1
            }}
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

