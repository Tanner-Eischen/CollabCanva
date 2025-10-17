/**
 * Enhanced Asset Upload Modal with Manual Sprite Selection
 * PR-31: Supports both auto-detection and manual sprite selection
 */

import { useState, useCallback, useEffect } from 'react';
import { ManualSpriteSelector } from './ManualSpriteSelector';
import { detectSpritesByTransparency, detectedSpritesToSelections } from '../../utils/tilemap/spriteDetection';
import type { AssetType, SpriteSelection } from '../../types/asset';

interface AssetUploadModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, metadata: {
    name: string;
    type?: AssetType;
    tags: string[];
    spriteSelections?: SpriteSelection[];
  }) => Promise<void>;
}

type UploadMode = 'basic' | 'manual-select';

export function AssetUploadModalEnhanced({
  isOpen,
  onClose,
  onUpload
}: AssetUploadModalEnhancedProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [type, setType] = useState<AssetType>('image');
  const [mode, setMode] = useState<UploadMode>('basic');
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Sprite selection state
  const [spriteSelections, setSpriteSelections] = useState<SpriteSelection[]>([]);
  
  // Visual detection state
  const [isDetectingSprites, setIsDetectingSprites] = useState(false);
  const [detectionResult, setDetectionResult] = useState<any>(null);

  const handleFileSelect = useCallback(async (selectedFile: File) => {
    setError(null);
    
    // Validate file size
    if (selectedFile.size > 10 * 1024 * 1024) {
      setError('File too large (max 10MB)');
      return;
    }

    setFile(selectedFile);
    
    // Auto-fill name
    if (!name) {
      const fileName = selectedFile.name.replace(/\.[^/.]+$/, '');
      setName(fileName);
    }

    // Generate preview
    try {
      const url = URL.createObjectURL(selectedFile);
      setPreview(url);

      // If sprite sheet or tileset, switch to sprite selection mode
      if (type === 'spritesheet' || type === 'tileset') {
        setMode('manual-select');
      }
    } catch (err) {
      console.warn('Failed to process image:', err);
    }
  }, [name, type]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    if (droppedFiles.length > 0) {
      handleFileSelect(droppedFiles[0]);
    }
  }, [handleFileSelect]);

  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  }, [tagInput, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  }, [tags]);

  const handleUpload = useCallback(async () => {
    if (!file || !name.trim()) {
      setError('Please provide a file and name');
      return;
    }

    // Validate configurations
    if (mode === 'manual-select' && spriteSelections.length === 0) {
      setError('Please select at least one sprite');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      await onUpload(file, {
        name: name.trim(),
        type,
        tags,
        spriteSelections: mode === 'manual-select' ? spriteSelections : undefined
      });

      // Reset form
      setFile(null);
      setPreview(null);
      setName('');
      setTags([]);
      setType('image');
      setMode('basic');
      setSpriteSelections([]);
      setDetectionResult(null);
      
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [file, name, type, tags, mode, spriteSelections, onUpload, onClose]);

  const handleVisualDetection = useCallback(async () => {
    if (!preview) return;
    
    setIsDetectingSprites(true);
    setError(null);
    
    try {
      // Run visual sprite detection
      const result = await detectSpritesByTransparency(preview, 8, 2);
      setDetectionResult(result);
      
      // Convert detected sprites to selections
      const selections = detectedSpritesToSelections(result.sprites);
      console.log('🎯 Visual Detection Complete:', {
        spritesDetected: result.sprites.length,
        selections: selections,
        gridDetected: result.gridDetected,
        suggestedTileSize: result.suggestedTileSize,
        note: 'All dimensions snapped to 8px grid (game-friendly)'
      });
      setSpriteSelections(selections);
      
      // Show success message
      if (result.sprites.length > 0) {
        setError(null);
        console.log(`✅ Detected ${result.sprites.length} sprites automatically!`);
      } else {
        setError('No sprites detected. Try manual selection or adjust the image.');
      }
    } catch (err) {
      console.error('Visual detection failed:', err);
      setError('Visual detection failed. Please use manual selection.');
    } finally {
      setIsDetectingSprites(false);
    }
  }, [preview]);

  const handleReset = useCallback(() => {
    setFile(null);
    setPreview(null);
    setMode('basic');
    setSpriteSelections([]);
    setDetectionResult(null);
    setError(null);
  }, []);

  // Auto-run visual detection when switching to manual mode
  useEffect(() => {
    if (mode === 'manual-select' && preview && !detectionResult && spriteSelections.length === 0) {
      // Automatically run visual detection on first visit to manual tab
      handleVisualDetection();
    }
  }, [mode, preview, detectionResult, spriteSelections.length, handleVisualDetection]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-7xl max-h-[95vh] flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">Upload Asset</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl w-8 h-8 flex items-center justify-center"
            disabled={isUploading}
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col">
          {!file ? (
            /* File upload area */
            <div className="p-6">
              <div
                className="border-2 border-dashed rounded-lg p-12 text-center transition-colors border-gray-300 hover:border-gray-400"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <div className="mb-4">
                  <svg
                    className="mx-auto h-16 w-16 text-gray-400"
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
                <p className="text-gray-600 mb-3 text-lg">Drag and drop your image here, or</p>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                  className="hidden"
                  id="file-input"
                />
                <label
                  htmlFor="file-input"
                  className="cursor-pointer inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Browse Files
                </label>
                <p className="text-sm text-gray-500 mt-3">
                  Supported: PNG, JPG, WEBP (max 10MB)
                </p>
              </div>

              {/* Type selection */}
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  What type of asset is this?
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => setType('image')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      type === 'image'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Single Image</div>
                    <div className="text-xs text-gray-500 mt-1">Individual sprite or icon</div>
                  </button>
                  <button
                    onClick={() => setType('spritesheet')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      type === 'spritesheet'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Sprite Sheet</div>
                    <div className="text-xs text-gray-500 mt-1">Multiple sprites (trees, items)</div>
                  </button>
                  <button
                    onClick={() => setType('tileset')}
                    className={`p-4 border-2 rounded-lg text-center transition-colors ${
                      type === 'tileset'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-semibold">Tileset</div>
                    <div className="text-xs text-gray-500 mt-1">Uniform grid tiles</div>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Configuration area */
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Tabs */}
              <div className="border-b border-gray-200 px-6">
                <div className="flex gap-4">
                  <button
                    onClick={() => setMode('basic')}
                    className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                      mode === 'basic'
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    Basic Info
                  </button>
                  {(type === 'spritesheet' || type === 'tileset') && (
                    <button
                      onClick={() => setMode('manual-select')}
                      className={`px-4 py-3 font-medium transition-colors border-b-2 ${
                        mode === 'manual-select'
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Sprite Selection
                      {spriteSelections.length > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 rounded-full bg-green-100 text-green-800">
                          {spriteSelections.length}
                        </span>
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-auto">
                {mode === 'basic' && (
                  <div className="p-6 space-y-4 max-w-2xl">
                    {/* Preview */}
                    {preview && (
                      <div className="border rounded-lg p-4 bg-gray-50">
                        <img src={preview} alt="Preview" className="max-w-full max-h-64 mx-auto rounded" />
                      </div>
                    )}

                    {/* Name */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Asset Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g., forest_trees"
                      />
                    </div>

                    {/* Tags */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                      <div className="flex gap-2 mb-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                          className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Add tags..."
                        />
                        <button
                          onClick={handleAddTag}
                          className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
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
                              <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* File info */}
                    <div className="text-sm text-gray-600">
                      <p>File: {file.name}</p>
                      <p>Size: {(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>

                    <button
                      onClick={handleReset}
                      className="text-sm text-blue-600 hover:text-blue-700"
                    >
                      Choose different file
                    </button>
                  </div>
                )}

                {mode === 'manual-select' && preview && (
                  <div className="flex flex-col h-full">
                    {/* Visual Detection Controls */}
                    <div className="p-4 bg-white border-b border-gray-200">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900">Sprite Selection</h3>
                            <p className="text-xs text-gray-500">
                              Auto-detect sprites or draw boxes manually
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={handleVisualDetection}
                          disabled={isDetectingSprites}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 text-sm font-medium"
                        >
                          {isDetectingSprites ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                              Detecting...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                              </svg>
                              Auto-Detect
                            </>
                          )}
                        </button>
                      </div>
                      
                      {/* Detection result info */}
                      {detectionResult && (
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2">
                                <span className="text-gray-700">Detected:</span>
                                <span className="font-semibold text-blue-900">{detectionResult.sprites.length} sprites</span>
                              </div>
                              {detectionResult.gridDetected && detectionResult.suggestedTileSize && (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-700">Grid:</span>
                                  <span className="font-semibold text-blue-900">
                                    {detectionResult.suggestedTileSize.width}×{detectionResult.suggestedTileSize.height}px
                                  </span>
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-medium">
                                8px-aligned
                              </span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {/* Manual Sprite Selector */}
                    <div className="flex-1 overflow-hidden">
                      <ManualSpriteSelector
                        imageUrl={preview}
                        onSelectionsChange={(selections) => setSpriteSelections(selections)}
                        initialSelections={spriteSelections}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Error message */}
              {error && (
                <div className="mx-6 mb-4 bg-red-50 border border-red-200 rounded p-3">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              {/* Actions */}
              <div className="border-t border-gray-200 p-6 flex justify-between">
                <button
                  onClick={handleReset}
                  disabled={isUploading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded transition-colors"
                >
                  Start Over
                </button>
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    disabled={isUploading}
                    className="px-6 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={!file || !name.trim() || isUploading}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isUploading ? 'Uploading...' : 'Upload Asset'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

