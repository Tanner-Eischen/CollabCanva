/**
 * Asset Card Component (PR-31)
 * Displays an asset thumbnail with actions
 */

import { useState } from 'react'
import type { Asset } from '../../types/asset'

interface AssetCardProps {
  asset: Asset
  isSelected: boolean
  onSelect: (assetId: string) => void
  onDelete: (assetId: string) => void
  onUseAsTileset?: (assetId: string) => void
  onCreateAnimation?: (assetId: string) => void
}

const TYPE_BADGES: Record<string, { label: string; color: string }> = {
  image: { label: 'Image', color: 'bg-gray-500' },
  spritesheet: { label: 'Sprite', color: 'bg-purple-500' },
  tileset: { label: 'Tileset', color: 'bg-green-500' },
  audio: { label: 'Audio', color: 'bg-blue-500' },
  font: { label: 'Font', color: 'bg-orange-500' }
}

export function AssetCard({
  asset,
  isSelected,
  onSelect,
  onDelete,
  onUseAsTileset,
  onCreateAnimation
}: AssetCardProps) {
  const [showActions, setShowActions] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const badge = TYPE_BADGES[asset.type] || TYPE_BADGES.image

  const handleDelete = () => {
    if (showDeleteConfirm) {
      onDelete(asset.id)
      setShowDeleteConfirm(false)
    } else {
      setShowDeleteConfirm(true)
      setTimeout(() => setShowDeleteConfirm(false), 3000) // Auto-cancel after 3s
    }
  }

  return (
    <div
      className={`relative group bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer ${
        isSelected ? 'ring-2 ring-blue-500' : 'border border-gray-200'
      }`}
      onClick={() => onSelect(asset.id)}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      {/* Thumbnail */}
      <div className="aspect-square bg-gray-100 rounded-t-lg overflow-hidden relative">
        {asset.thumbnailUrl || asset.url ? (
          <img
            src={asset.thumbnailUrl || asset.url}
            alt={asset.name}
            className="w-full h-full object-contain"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
        )}

        {/* Type badge */}
        <div className={`absolute top-2 left-2 ${badge.color} text-white text-xs px-2 py-1 rounded`}>
          {badge.label}
        </div>

        {/* Hover actions */}
        {showActions && (
          <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {asset.type === 'spritesheet' && onCreateAnimation && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onCreateAnimation(asset.id)
                }}
                className="px-3 py-1.5 bg-purple-600 text-white text-sm rounded hover:bg-purple-700 transition-colors"
                title="Create Animation"
              >
                Animate
              </button>
            )}
            
            {(asset.type === 'tileset' || asset.type === 'image') && onUseAsTileset && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onUseAsTileset(asset.id)
                }}
                className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors"
                title="Use as Tileset"
              >
                Tileset
              </button>
            )}
            
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleDelete()
              }}
              className={`px-3 py-1.5 text-white text-sm rounded transition-colors ${
                showDeleteConfirm
                  ? 'bg-red-700 hover:bg-red-800'
                  : 'bg-red-600 hover:bg-red-700'
              }`}
              title={showDeleteConfirm ? 'Click again to confirm' : 'Delete'}
            >
              {showDeleteConfirm ? 'Confirm?' : 'Delete'}
            </button>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-medium text-gray-900 truncate text-sm" title={asset.name}>
          {asset.name}
        </h3>
        <div className="mt-1 flex items-center justify-between text-xs text-gray-500">
          <span>{asset.metadata.width} × {asset.metadata.height}</span>
          <span>{(asset.metadata.fileSize / 1024).toFixed(0)} KB</span>
        </div>
        
        {/* Tags */}
        {asset.tags && asset.tags.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {asset.tags.slice(0, 2).map((tag) => (
              <span
                key={tag}
                className="inline-block px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
              >
                {tag}
              </span>
            ))}
            {asset.tags.length > 2 && (
              <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                +{asset.tags.length - 2}
              </span>
            )}
          </div>
        )}
        
        {/* Tileset Features & Layers */}
        {asset.type === 'tileset' && asset.tilesetMetadata && (
          <>
            {/* Feature badges */}
            {(asset.tilesetMetadata.features || asset.tilesetMetadata.tileCount) && (
              <div className="mt-2 flex flex-wrap gap-1">
                {asset.tilesetMetadata.features?.autotile && (
                  <span className="px-2 py-0.5 bg-purple-50 text-purple-700 text-xs rounded flex items-center gap-0.5" title="Supports auto-tiling">
                    🔲 Auto
                  </span>
                )}
                {asset.tilesetMetadata.features?.animated && (
                  <span className="px-2 py-0.5 bg-green-50 text-green-700 text-xs rounded flex items-center gap-0.5" title="Has animation frames">
                    🎬 Anim
                  </span>
                )}
                {asset.tilesetMetadata.features?.props && (
                  <span className="px-2 py-0.5 bg-orange-50 text-orange-700 text-xs rounded flex items-center gap-0.5" title="Contains props">
                    🌳 Props
                  </span>
                )}
                {asset.tilesetMetadata.tileCount && (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-xs rounded" title="Total tiles">
                    {asset.tilesetMetadata.tileCount} tiles
                  </span>
                )}
              </div>
            )}
            
            {/* Layer type badges */}
            {asset.tilesetMetadata.layerTypes && asset.tilesetMetadata.layerTypes.length > 0 && (
              <div className="mt-1 flex flex-wrap gap-1">
                {asset.tilesetMetadata.layerTypes.slice(0, 3).map((layer) => (
                  <span
                    key={layer}
                    className="px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded capitalize"
                    title={`Suitable for ${layer} layer`}
                  >
                    {layer}
                  </span>
                ))}
                {asset.tilesetMetadata.layerTypes.length > 3 && (
                  <span className="px-1.5 py-0.5 bg-gray-100 text-gray-500 text-xs rounded">
                    +{asset.tilesetMetadata.layerTypes.length - 3}
                  </span>
                )}
              </div>
            )}
            
            {/* Theme/Material badges */}
            {(asset.tilesetMetadata.themes || asset.tilesetMetadata.materials) && (
              <div className="mt-1 flex flex-wrap gap-1">
                {asset.tilesetMetadata.themes?.slice(0, 2).map((theme) => (
                  <span
                    key={theme}
                    className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded capitalize"
                    title={`Theme: ${theme}`}
                  >
                    {theme}
                  </span>
                ))}
                {asset.tilesetMetadata.materials?.slice(0, 1).map((material) => (
                  <span
                    key={material}
                    className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded capitalize"
                    title={`Material: ${material}`}
                  >
                    {material}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

