/**
 * Asset Upload Modal Component (PR-31)
 * Drag-and-drop file upload with preview and metadata
 */

import { useState, useCallback, useRef } from 'react'
import { validateAssetFile, generateThumbnail } from '../../services/assets/assetUpload'
import type { AssetType } from '../../types/asset'

interface AssetUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onUpload: (file: File, metadata: {
    name: string
    type?: AssetType
    tags: string[]
  }) => Promise<void>
  initialType?: AssetType
}

export function AssetUploadModal({
  isOpen,
  onClose,
  onUpload,
  initialType
}: AssetUploadModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [tagInput, setTagInput] = useState('')
  const [type, setType] = useState<AssetType>(initialType || 'image')
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [validation, setValidation] = useState<{ errors: string[]; warnings: string[] } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null)
    
    // Validate file
    const validationResult = validateAssetFile(selectedFile)
    setValidation(validationResult)
    
    if (!validationResult.valid) {
      setError(validationResult.errors.join(', '))
      return
    }

    setFile(selectedFile)
    
    // Auto-fill name from filename
    if (!name) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '')
      setName(fileName)
    }

    // Generate preview
    try {
      const previewUrl = await generateThumbnail(selectedFile, 300)
      setPreview(previewUrl)
    } catch (err) {
      console.warn('Failed to generate preview:', err)
    }
  }, [name])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files)
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0])
    }
  }, [handleFileSelect])

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFileSelect(selectedFiles[0])
    }
  }, [handleFileSelect])

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim()
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag])
      setTagInput('')
    }
  }, [tagInput, tags])

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove))
  }, [tags])

  const handleUpload = useCallback(async () => {
    if (!file || !name.trim()) {
      setError('Please provide a file and name')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      await onUpload(file, {
        name: name.trim(),
        type,
        tags
      })

      // Reset form
      setFile(null)
      setPreview(null)
      setName('')
      setTags([])
      setType('image')
      setValidation(null)
      
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }, [file, name, type, tags, onUpload, onClose])

  const handleReset = useCallback(() => {
    setFile(null)
    setPreview(null)
    setName('')
    setTags([])
    setType(initialType || 'image')
    setError(null)
    setValidation(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }, [initialType])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Upload Asset</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
            disabled={isUploading}
          >
            ×
          </button>
        </div>

        {/* Drag and drop zone */}
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          {!file ? (
            <>
              <div className="mb-4">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Drag and drop your image here, or</p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Browse Files
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
                onChange={handleFileInputChange}
                className="hidden"
              />
              <p className="text-sm text-gray-500 mt-2">
                Supported formats: PNG, JPG, WEBP, GIF (max 10MB)
              </p>
            </>
          ) : (
            <>
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="max-w-full max-h-64 mx-auto mb-4 rounded"
                />
              )}
              <p className="text-gray-600 mb-2">{file.name}</p>
              <p className="text-sm text-gray-500 mb-4">
                {(file.size / 1024 / 1024).toFixed(2)} MB
              </p>
              <button
                onClick={handleReset}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
              >
                Choose Different File
              </button>
            </>
          )}
        </div>

        {/* Validation messages */}
        {validation && (
          <div className="mt-4">
            {validation.warnings.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mb-2">
                <p className="text-sm text-yellow-800 font-semibold mb-1">Warnings:</p>
                {validation.warnings.map((warning, i) => (
                  <p key={i} className="text-sm text-yellow-700">• {warning}</p>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Metadata form */}
        {file && (
          <div className="mt-6 space-y-4">
            {/* Name input */}
            <div>
              <label htmlFor="asset-name" className="block text-sm font-medium text-gray-700 mb-1">
                Asset Name <span className="text-red-500">*</span>
              </label>
              <input
                id="asset-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., grass_tileset"
              />
            </div>

            {/* Type selection */}
            <div>
              <label htmlFor="asset-type" className="block text-sm font-medium text-gray-700 mb-1">
                Asset Type
              </label>
              <select
                id="asset-type"
                value={type}
                onChange={(e) => setType(e.target.value as AssetType)}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="image">Image</option>
                <option value="spritesheet">Sprite Sheet</option>
                <option value="tileset">Tileset</option>
              </select>
            </div>

            {/* Tags input */}
            <div>
              <label htmlFor="asset-tags" className="block text-sm font-medium text-gray-700 mb-1">
                Tags
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  id="asset-tags"
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Add tags..."
                />
                <button
                  onClick={handleAddTag}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
                >
                  Add
                </button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-blue-900"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isUploading}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleUpload}
            disabled={!file || !name.trim() || isUploading}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}


