/**
 * Asset Library Hook (PR-31)
 * Manages asset library state, uploads, and organization
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ref as dbRef, onValue, off } from 'firebase/database'
import { db } from '../services/firebase'
import {
  uploadAsset,
  deleteAsset,
  updateAssetMetadata,
  getUserAssets
} from '../services/assets/assetUpload'
import type {
  Asset,
  AssetType,
  AssetFilter,
  AssetUploadProgress,
  TilesetMetadata,
  SpriteSheetMetadata
} from '../types/asset'

interface UseAssetLibraryOptions {
  userId: string
  enableSync?: boolean
}

interface UseAssetLibraryReturn {
  assets: Asset[]
  isLoading: boolean
  error: string | null
  selectedAssetId: string | null
  filter: AssetFilter
  uploadProgress: Map<string, AssetUploadProgress>
  // Asset operations
  uploadAsset: (
    file: File,
    options?: {
      name?: string
      type?: AssetType
      tags?: string[]
      folderId?: string
      tilesetMetadata?: TilesetMetadata
      spriteSheetMetadata?: SpriteSheetMetadata
    }
  ) => Promise<Asset>
  deleteAsset: (assetId: string) => Promise<void>
  updateAsset: (
    assetId: string,
    updates: Partial<Pick<Asset, 'name' | 'tags' | 'folderId' | 'tilesetMetadata' | 'spriteSheetMetadata'>>
  ) => Promise<void>
  // Selection
  selectAsset: (assetId: string | null) => void
  getSelectedAsset: () => Asset | null
  // Filtering
  setFilter: (filter: AssetFilter) => void
  clearFilter: () => void
  searchAssets: (query: string) => void
  filterByType: (type: AssetType | null) => void
  filterByTags: (tags: string[]) => void
  // Getters
  getFilteredAssets: () => Asset[]
  getAssetsByType: (type: AssetType) => Asset[]
  getAssetById: (assetId: string) => Asset | null
  // Tags
  getAllTags: () => string[]
  addTagToAsset: (assetId: string, tag: string) => Promise<void>
  removeTagFromAsset: (assetId: string, tag: string) => Promise<void>
}

export function useAssetLibrary(options: UseAssetLibraryOptions): UseAssetLibraryReturn {
  const { userId, enableSync = true } = options

  // State
  const [assets, setAssets] = useState<Asset[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [filter, setFilterState] = useState<AssetFilter>({})
  const [uploadProgress, setUploadProgress] = useState<Map<string, AssetUploadProgress>>(new Map())

  // Load initial assets
  useEffect(() => {
    let unsubscribe: (() => void) | null = null

    const loadAssets = async () => {
      setIsLoading(true)
      setError(null)

      try {
        if (enableSync) {
          // Subscribe to real-time updates
          const assetsRef = dbRef(db, `assets/${userId}`)
          
          const handler = (snapshot: any) => {
            if (!snapshot.exists()) {
              setAssets([])
              setIsLoading(false)
              return
            }

            const assetsData = snapshot.val()
            const assetsList = Object.values(assetsData) as Asset[]
            setAssets(assetsList)
            setIsLoading(false)
          }

          onValue(assetsRef, handler)
          unsubscribe = () => off(assetsRef, 'value', handler)
        } else {
          // Load once without sync
          const assetsList = await getUserAssets(userId)
          setAssets(assetsList)
          setIsLoading(false)
        }
      } catch (err) {
        console.error('Failed to load assets:', err)
        setError(err instanceof Error ? err.message : 'Failed to load assets')
        setIsLoading(false)
      }
    }

    loadAssets()

    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [userId, enableSync])

  // Upload asset
  const handleUploadAsset = useCallback(
    async (
      file: File,
      uploadOptions?: {
        name?: string
        type?: AssetType
        tags?: string[]
        folderId?: string
        tilesetMetadata?: TilesetMetadata
        spriteSheetMetadata?: SpriteSheetMetadata
      }
    ): Promise<Asset> => {
      try {
        const asset = await uploadAsset(file, userId, {
          ...uploadOptions,
          onProgress: (progress) => {
            setUploadProgress(prev => new Map(prev).set(progress.assetId, progress))
          }
        })

        // Clear progress after completion
        setUploadProgress(prev => {
          const next = new Map(prev)
          next.delete(asset.id)
          return next
        })

        return asset
      } catch (err) {
        console.error('Failed to upload asset:', err)
        throw err
      }
    },
    [userId]
  )

  // Delete asset
  const handleDeleteAsset = useCallback(
    async (assetId: string): Promise<void> => {
      try {
        await deleteAsset(assetId, userId)
        
        // Clear selection if deleted asset was selected
        if (selectedAssetId === assetId) {
          setSelectedAssetId(null)
        }
      } catch (err) {
        console.error('Failed to delete asset:', err)
        throw err
      }
    },
    [userId, selectedAssetId]
  )

  // Update asset metadata
  const handleUpdateAsset = useCallback(
    async (
      assetId: string,
      updates: Partial<Pick<Asset, 'name' | 'tags' | 'folderId' | 'tilesetMetadata' | 'spriteSheetMetadata'>>
    ): Promise<void> => {
      try {
        await updateAssetMetadata(assetId, userId, updates)
      } catch (err) {
        console.error('Failed to update asset:', err)
        throw err
      }
    },
    [userId]
  )

  // Selection
  const selectAsset = useCallback((assetId: string | null) => {
    setSelectedAssetId(assetId)
  }, [])

  const getSelectedAsset = useCallback((): Asset | null => {
    if (!selectedAssetId) return null
    return assets?.find(a => a.id === selectedAssetId) || null
  }, [selectedAssetId, assets])

  // Filtering
  const setFilter = useCallback((newFilter: AssetFilter) => {
    setFilterState(newFilter)
  }, [])

  const clearFilter = useCallback(() => {
    setFilterState({})
  }, [])

  const searchAssets = useCallback((query: string) => {
    setFilterState(prev => ({
      ...prev,
      searchQuery: query.toLowerCase()
    }))
  }, [])

  const filterByType = useCallback((type: AssetType | null) => {
    setFilterState(prev => ({
      ...prev,
      type: type ? [type] : undefined
    }))
  }, [])

  const filterByTags = useCallback((tags: string[]) => {
    setFilterState(prev => ({
      ...prev,
      tags
    }))
  }, [])

  // Get filtered assets
  const getFilteredAssets = useCallback((): Asset[] => {
    let filtered = [...assets]

    // Filter by type
    if (filter.type && filter.type.length > 0) {
      filtered = filtered.filter(asset => filter.type!.includes(asset.type))
    }

    // Filter by tags
    if (filter.tags && filter.tags.length > 0) {
      filtered = filtered.filter(asset =>
        filter.tags!.some(tag => asset.tags.includes(tag))
      )
    }

    // Filter by folder
    if (filter.folderId !== undefined) {
      filtered = filtered.filter(asset => asset.folderId === filter.folderId)
    }

    // Filter by search query
    if (filter.searchQuery) {
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(filter.searchQuery!) ||
        asset.tags.some(tag => tag.toLowerCase().includes(filter.searchQuery!))
      )
    }

    // Sort by upload date (newest first)
    filtered.sort((a, b) => b.uploadedAt - a.uploadedAt)

    return filtered
  }, [assets, filter])

  // Get assets by type
  const getAssetsByType = useCallback(
    (type: AssetType): Asset[] => {
      return assets?.filter(asset => asset.type === type) || []
    },
    [assets]
  )

  // Get asset by ID
  const getAssetById = useCallback(
    (assetId: string): Asset | null => {
      return assets?.find(asset => asset.id === assetId) || null
    },
    [assets]
  )

  // Get all unique tags
  const getAllTags = useCallback((): string[] => {
    const tagSet = new Set<string>()
    assets?.forEach(asset => {
      asset.tags?.forEach(tag => tagSet.add(tag))
    })
    return Array.from(tagSet).sort()
  }, [assets])

  // Add tag to asset
  const addTagToAsset = useCallback(
    async (assetId: string, tag: string): Promise<void> => {
      const asset = getAssetById(assetId)
      if (!asset) throw new Error('Asset not found')

      if (asset.tags.includes(tag)) return // Already has tag

      await handleUpdateAsset(assetId, {
        tags: [...asset.tags, tag]
      })
    },
    [getAssetById, handleUpdateAsset]
  )

  // Remove tag from asset
  const removeTagFromAsset = useCallback(
    async (assetId: string, tag: string): Promise<void> => {
      const asset = getAssetById(assetId)
      if (!asset) throw new Error('Asset not found')

      await handleUpdateAsset(assetId, {
        tags: asset.tags.filter(t => t !== tag)
      })
    },
    [getAssetById, handleUpdateAsset]
  )

  return {
    assets,
    isLoading,
    error,
    selectedAssetId,
    filter,
    uploadProgress,
    uploadAsset: handleUploadAsset,
    deleteAsset: handleDeleteAsset,
    updateAsset: handleUpdateAsset,
    selectAsset,
    getSelectedAsset,
    setFilter,
    clearFilter,
    searchAssets,
    filterByType,
    filterByTags,
    getFilteredAssets,
    getAssetsByType,
    getAssetById,
    getAllTags,
    addTagToAsset,
    removeTagFromAsset
  }
}

