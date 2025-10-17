/**
 * Asset Validation Panel
 * 
 * Displays detection results and allows user to edit/confirm metadata
 * before saving a tileset asset.
 */

import React, { useState } from 'react'
import type { TilesetMetadata } from '../../types/asset'

interface AssetValidationPanelProps {
  assetName: string
  detectedMetadata: Partial<TilesetMetadata>
  onAccept: (metadata: Partial<TilesetMetadata>) => void
  onEdit: (metadata: Partial<TilesetMetadata>) => void
  onReject: () => void
  thumbnailUrl?: string
}

export default function AssetValidationPanel({
  assetName,
  detectedMetadata,
  onAccept,
  onEdit,
  onReject,
  thumbnailUrl
}: AssetValidationPanelProps) {
  const [editedMetadata, setEditedMetadata] = useState<Partial<TilesetMetadata>>(detectedMetadata)
  const [isEditing, setIsEditing] = useState(false)

  const handleAccept = () => {
    onAccept(editedMetadata)
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSaveEdit = () => {
    onEdit(editedMetadata)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedMetadata(detectedMetadata)
    setIsEditing(false)
  }

  const confidence = detectedMetadata.detectionConfidence?.overall || 0
  const confidenceColor = confidence > 0.7 ? 'text-green-600' : confidence > 0.4 ? 'text-yellow-600' : 'text-red-600'

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-6 max-w-2xl">
      <div className="flex items-start gap-4 mb-6">
        {thumbnailUrl && (
          <div className="flex-shrink-0">
            <img
              src={thumbnailUrl}
              alt={assetName}
              className="w-32 h-32 object-contain border border-gray-300 rounded"
            />
          </div>
        )}
        
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {assetName}
          </h3>
          
          <div className="text-sm text-gray-600 mb-2">
            Detection Confidence: <span className={`font-semibold ${confidenceColor}`}>
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
        </div>
      </div>

      {/* Detection Results */}
      <div className="space-y-4 mb-6">
        
        {/* Themes */}
        {editedMetadata.themes && editedMetadata.themes.length > 0 && (
          <DetectionSection
            icon="🎨"
            label="Detected Themes"
            confidence={detectedMetadata.detectionConfidence?.overall || 0}
            isEditing={isEditing}
          >
            {isEditing ? (
              <EditableChips
                values={editedMetadata.themes}
                onChange={(themes) => setEditedMetadata({ ...editedMetadata, themes })}
                placeholder="Add theme..."
              />
            ) : (
              <ChipList values={editedMetadata.themes} color="blue" />
            )}
          </DetectionSection>
        )}

        {/* Materials */}
        {editedMetadata.materials && editedMetadata.materials.length > 0 && (
          <DetectionSection
            icon="🧱"
            label="Detected Materials"
            confidence={detectedMetadata.detectionConfidence?.overall || 0}
            isEditing={isEditing}
          >
            {isEditing ? (
              <EditableChips
                values={editedMetadata.materials}
                onChange={(materials) => setEditedMetadata({ ...editedMetadata, materials })}
                placeholder="Add material..."
              />
            ) : (
              <ChipList values={editedMetadata.materials} color="green" />
            )}
          </DetectionSection>
        )}

        {/* Auto-tile System */}
        {editedMetadata.autoTileSystem && (
          <DetectionSection
            icon="🔲"
            label="Auto-tile System"
            confidence={detectedMetadata.detectionConfidence?.autoTilePattern || 0}
            isEditing={isEditing}
          >
            {isEditing ? (
              <select
                value={editedMetadata.autoTileSystem}
                onChange={(e) => setEditedMetadata({
                  ...editedMetadata,
                  autoTileSystem: e.target.value as any
                })}
                className="px-3 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="blob16">Blob16 (4-neighbor)</option>
                <option value="blob47">Blob47 (8-neighbor)</option>
                <option value="wang">Wang Tiles</option>
                <option value="custom">Custom</option>
              </select>
            ) : (
              <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
                {editedMetadata.autoTileSystem}
              </span>
            )}
          </DetectionSection>
        )}

        {/* Layer Types */}
        {editedMetadata.layerTypes && editedMetadata.layerTypes.length > 0 && (
          <DetectionSection
            icon="📚"
            label="Recommended Layers"
            isEditing={isEditing}
          >
            {isEditing ? (
              <LayerTypeCheckboxes
                selected={editedMetadata.layerTypes}
                onChange={(layerTypes) => setEditedMetadata({ ...editedMetadata, layerTypes })}
              />
            ) : (
              <ChipList values={editedMetadata.layerTypes} color="indigo" />
            )}
          </DetectionSection>
        )}

        {/* Features */}
        {editedMetadata.features && (
          <DetectionSection
            icon="✨"
            label="Features"
            isEditing={isEditing}
          >
            <div className="flex flex-wrap gap-2">
              {editedMetadata.features.autotile && (
                <FeatureChip label="Auto-tiling" />
              )}
              {editedMetadata.features.animated && (
                <FeatureChip label="Animated" />
              )}
              {editedMetadata.features.props && (
                <FeatureChip label="Props" />
              )}
              {editedMetadata.features.decals && (
                <FeatureChip label="Decals" />
              )}
            </div>
          </DetectionSection>
        )}

        {/* Named Tiles */}
        {editedMetadata.namedTiles && Object.keys(editedMetadata.namedTiles).length > 0 && (
          <DetectionSection
            icon="📝"
            label="Named Tiles"
            confidence={detectedMetadata.detectionConfidence?.namedTiles || 0}
          >
            <div className="text-sm text-gray-600">
              {Object.keys(editedMetadata.namedTiles).length} tiles named
              {Object.keys(editedMetadata.namedTiles).length <= 5 && (
                <span className="ml-2 text-xs text-gray-500">
                  ({Object.keys(editedMetadata.namedTiles).slice(0, 5).join(', ')})
                </span>
              )}
            </div>
          </DetectionSection>
        )}

        {/* Validation Warnings */}
        {editedMetadata.validation?.warnings && editedMetadata.validation.warnings.length > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <span className="text-yellow-600 text-lg">⚠</span>
              <div>
                <p className="text-sm font-medium text-yellow-800 mb-1">Warnings</p>
                <ul className="text-sm text-yellow-700 space-y-1">
                  {editedMetadata.validation.warnings.map((warning, idx) => (
                    <li key={idx}>• {warning}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
        {isEditing ? (
          <>
            <button
              onClick={handleCancelEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
            >
              Save Changes
            </button>
          </>
        ) : (
          <>
            <button
              onClick={onReject}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Reject
            </button>
            <button
              onClick={handleEdit}
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Edit
            </button>
            <button
              onClick={handleAccept}
              className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
            >
              Accept
            </button>
          </>
        )}
      </div>
    </div>
  )
}

// Helper Components

function DetectionSection({
  icon,
  label,
  confidence,
  isEditing,
  children
}: {
  icon: string
  label: string
  confidence?: number
  isEditing?: boolean
  children: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-2xl flex-shrink-0">{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm font-medium text-gray-700">{label}</p>
          {confidence !== undefined && confidence < 0.7 && !isEditing && (
            <span className="text-xs text-gray-500">
              ({(confidence * 100).toFixed(0)}% confidence)
            </span>
          )}
        </div>
        {children}
      </div>
    </div>
  )
}

function ChipList({ values, color }: { values: string[]; color: string }) {
  const colorClasses = {
    blue: 'bg-blue-100 text-blue-700',
    green: 'bg-green-100 text-green-700',
    indigo: 'bg-indigo-100 text-indigo-700',
    purple: 'bg-purple-100 text-purple-700'
  }

  return (
    <div className="flex flex-wrap gap-2">
      {values.map((value, idx) => (
        <span
          key={idx}
          className={`px-2 py-1 ${colorClasses[color as keyof typeof colorClasses]} rounded-full text-sm font-medium`}
        >
          {value}
        </span>
      ))}
    </div>
  )
}

function EditableChips({
  values,
  onChange,
  placeholder
}: {
  values: string[]
  onChange: (values: string[]) => void
  placeholder: string
}) {
  const [inputValue, setInputValue] = useState('')

  const handleAdd = () => {
    if (inputValue.trim() && !values.includes(inputValue.trim())) {
      onChange([...values, inputValue.trim()])
      setInputValue('')
    }
  }

  const handleRemove = (value: string) => {
    onChange(values.filter(v => v !== value))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleAdd()
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {values.map((value, idx) => (
          <span
            key={idx}
            className="px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-sm font-medium flex items-center gap-1"
          >
            {value}
            <button
              onClick={() => handleRemove(value)}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="flex-1 px-3 py-1 border border-gray-300 rounded text-sm"
        />
        <button
          onClick={handleAdd}
          className="px-3 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
        >
          Add
        </button>
      </div>
    </div>
  )
}

function LayerTypeCheckboxes({
  selected,
  onChange
}: {
  selected: Array<'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'>
  onChange: (values: Array<'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'>) => void
}) {
  const options: Array<'background' | 'ground' | 'props' | 'fx' | 'decals' | 'collision'> = [
    'background',
    'ground',
    'props',
    'fx',
    'decals',
    'collision'
  ]

  const handleToggle = (option: typeof options[number]) => {
    if (selected.includes(option)) {
      onChange(selected.filter(v => v !== option))
    } else {
      onChange([...selected, option])
    }
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((option) => (
        <label key={option} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={selected.includes(option)}
            onChange={() => handleToggle(option)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700 capitalize">{option}</span>
        </label>
      ))}
    </div>
  )
}

function FeatureChip({ label }: { label: string }) {
  return (
    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium flex items-center gap-1">
      <span className="text-xs">✓</span>
      {label}
    </span>
  )
}

