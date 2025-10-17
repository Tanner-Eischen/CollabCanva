/**
 * Asset Library Panel Component (PR-31)
 * Main panel for browsing and managing assets
 */

import { useState, useMemo } from 'react'
import { AssetCard } from './AssetCard'
import { AssetUploadModalEnhanced } from './AssetUploadModalEnhanced'
import { useAssetLibrary } from '../../hooks/useAssetLibrary'
import type { AssetType } from '../../types/asset'

interface AssetLibraryProps {
  userId: string
  onClose?: () => void
  onSelectAsset?: (assetId: string) => void
}

export function AssetLibrary({ userId, onClose, onSelectAsset }: AssetLibraryProps) {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<AssetType | 'all'>('all')

  const {
    assets,
    isLoading,
    error,
    selectedAssetId,
    uploadProgress,
    uploadAsset: handleUploadAsset,
    deleteAsset: handleDeleteAsset,
    selectAsset,
    getFilteredAssets,
    getAllTags,
    searchAssets,
    filterByType
  } = useAssetLibrary({ userId })

  // Apply search and filters
  useMemo(() => {
    searchAssets(searchQuery)
  }, [searchQuery, searchAssets])

  useMemo(() => {
    if (selectedTypeFilter === 'all') {
      filterByType(null)
    } else {
      filterByType(selectedTypeFilter)
    }
  }, [selectedTypeFilter, filterByType])

  const filteredAssets = getFilteredAssets()
  const tags = getAllTags()

  // Handle asset upload
  const handleUpload = async (
    file: File,
    metadata: { name: string; type?: AssetType; tags: string[] }
  ) => {
    await handleUploadAsset(file, metadata)
    setIsUploadModalOpen(false)
  }

  const handleAssetSelect = (assetId: string) => {
    selectAsset(assetId)
    if (onSelectAsset) {
      onSelectAsset(assetId)
    }
  }

  // Count assets by type
  const assetCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: assets?.length || 0,
      image: 0,
      spritesheet: 0,
      tileset: 0,
      audio: 0,
      font: 0
    }

    assets?.forEach(asset => {
      counts[asset.type] = (counts[asset.type] || 0) + 1
    })

    return counts
  }, [assets])

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Asset Library</h2>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
              title="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {/* Upload button */}
        <button
          onClick={() => setIsUploadModalOpen(true)}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Upload Asset
        </button>
      </div>

      {/* Search and filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        {/* Search bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        {/* Type filter */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setSelectedTypeFilter('all')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedTypeFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            All ({assetCounts.all})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('image')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedTypeFilter === 'image'
                ? 'bg-gray-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Images ({assetCounts.image})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('spritesheet')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedTypeFilter === 'spritesheet'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Sprites ({assetCounts.spritesheet})
          </button>
          <button
            onClick={() => setSelectedTypeFilter('tileset')}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              selectedTypeFilter === 'tileset'
                ? 'bg-green-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Tilesets ({assetCounts.tileset})
          </button>
        </div>

        {/* View mode toggle */}
        <div className="flex justify-end">
          <div className="inline-flex rounded border border-gray-300">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 text-xs ${
                viewMode === 'grid'
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="Grid view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
                />
              </svg>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 text-xs border-l border-gray-300 ${
                viewMode === 'list'
                  ? 'bg-gray-200 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
              title="List view"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 6h16M4 12h16M4 18h16"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Upload progress */}
      {uploadProgress.size > 0 && (
        <div className="p-4 border-b border-gray-200 bg-blue-50">
          {Array.from(uploadProgress.values()).map((progress) => (
            <div key={progress.assetId} className="mb-2">
              <div className="flex justify-between text-sm mb-1">
                <span className="text-gray-700">{progress.fileName}</span>
                <span className="text-gray-600">{Math.round(progress.progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all"
                  style={{ width: `${progress.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-gray-500">Loading assets...</div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-red-500">{error}</div>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="text-lg font-medium">No assets found</p>
            <p className="text-sm mt-1">Upload your first asset to get started</p>
          </div>
        ) : (
          <div
            className={
              viewMode === 'grid'
                ? 'grid grid-cols-2 gap-3'
                : 'space-y-2'
            }
          >
            {filteredAssets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                isSelected={selectedAssetId === asset.id}
                onSelect={handleAssetSelect}
                onDelete={handleDeleteAsset}
                onUseAsTileset={() => {
                  // TODO: Open tileset configurator
                  console.log('Use as tileset:', asset.id)
                }}
                onCreateAnimation={() => {
                  // TODO: Open animation creator
                  console.log('Create animation:', asset.id)
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upload modal */}
      <AssetUploadModalEnhanced
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
      />
    </div>
  )
}

