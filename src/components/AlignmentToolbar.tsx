// AlignmentToolbar Component - Toolbar for alignment and distribution (PR-18)

import type { AlignmentType } from '../services/alignment'

interface AlignmentToolbarProps {
  visible: boolean
  selectedCount: number
  onAlign: (type: AlignmentType) => void
  onDistributeHorizontally: () => void
  onDistributeVertically: () => void
  onCenterInCanvas: () => void
}

/**
 * Alignment toolbar component that appears when 2+ shapes are selected
 * Provides buttons for alignment and distribution operations
 */
export function AlignmentToolbar({
  visible,
  selectedCount,
  onAlign,
  onDistributeHorizontally,
  onDistributeVertically,
  onCenterInCanvas,
}: AlignmentToolbarProps) {
  if (!visible) return null

  // Distribute buttons require at least 3 shapes
  const canDistribute = selectedCount >= 3

  return (
    <div className="bg-white border-b border-gray-300 px-4 py-2 flex items-center gap-2 shadow-sm">
      <span className="text-sm text-gray-600 mr-2">
        {selectedCount} selected
      </span>

      {/* Alignment Section */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => onAlign('left')}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Align Left"
        >
          <span className="font-mono">|◀</span>
        </button>
        <button
          onClick={() => onAlign('center')}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Align Center"
        >
          <span className="font-mono">|●|</span>
        </button>
        <button
          onClick={() => onAlign('right')}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Align Right"
        >
          <span className="font-mono">▶|</span>
        </button>
      </div>

      {/* Vertical Alignment Section */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={() => onAlign('top')}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Align Top"
        >
          <span className="font-mono">⬆|</span>
        </button>
        <button
          onClick={() => onAlign('middle')}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Align Middle"
        >
          <span className="font-mono">—●—</span>
        </button>
        <button
          onClick={() => onAlign('bottom')}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Align Bottom"
        >
          <span className="font-mono">|⬇</span>
        </button>
      </div>

      {/* Distribution Section */}
      <div className="flex items-center gap-1 border-r border-gray-300 pr-2">
        <button
          onClick={onDistributeHorizontally}
          disabled={!canDistribute}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            canDistribute
              ? 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={canDistribute ? "Distribute Horizontally" : "Requires 3+ shapes"}
        >
          <span className="font-mono">←●●●→</span>
        </button>
        <button
          onClick={onDistributeVertically}
          disabled={!canDistribute}
          className={`px-3 py-1.5 text-sm rounded border transition-colors ${
            canDistribute
              ? 'bg-gray-100 hover:bg-gray-200 border-gray-300'
              : 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          title={canDistribute ? "Distribute Vertically" : "Requires 3+ shapes"}
        >
          <span className="font-mono">↑●●●↓</span>
        </button>
      </div>

      {/* Center in Canvas */}
      <div className="flex items-center gap-1">
        <button
          onClick={onCenterInCanvas}
          className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 transition-colors"
          title="Center in Canvas"
        >
          <span className="font-mono">⊕</span>
        </button>
      </div>
    </div>
  )
}


