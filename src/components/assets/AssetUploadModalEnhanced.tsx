/**
 * Enhanced Asset Upload Modal with Manual Sprite Selection
 * PR-31: Supports both auto-detection and manual sprite selection
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { ManualSpriteSelector } from './ManualSpriteSelector';
import { detectSpritesByTransparency, detectedSpritesToSelections } from '../../utils/tilemap/spriteDetection';
import type {
  Asset,
  AssetType,
  SpriteSelection,
  SpriteSheetMetadata,
  TilesetMetadata
} from '../../types/asset';

/**
 * Check if a grid cell contains any visible content
 * Returns true if the cell has pixels with meaningful alpha or color variation
 */
function checkIfCellHasContent(imageData: ImageData): boolean {
  const { data } = imageData;
  const alphaThreshold = 20; // Alpha threshold (0-255) - more aggressive
  let opaquePixels = 0;
  const samplingRate = 8; // Check every 8th pixel for speed
  let totalSamples = 0;
  
  // Sample pixels across the cell
  for (let i = 3; i < data.length; i += samplingRate * 4) {
    totalSamples++;
    if (data[i] > alphaThreshold) {
      opaquePixels++;
    }
  }
  
  // Require at least 10% of samples to be opaque to consider cell non-empty
  const opaqueRatio = opaquePixels / totalSamples;
  return opaqueRatio > 0.10;
}

type UploadMetadata = {
  name: string;
  type?: AssetType;
  tags: string[];
  tilesetMetadata?: TilesetMetadata;
  spriteSheetMetadata?: SpriteSheetMetadata;
};

interface AssetUploadModalEnhancedProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, metadata: UploadMetadata) => Promise<Asset>;
  onUploadComplete?: (asset: Asset) => void;
}

type UploadMode = 'basic' | 'manual-select';

export function AssetUploadModalEnhanced({
  isOpen,
  onClose,
  onUpload,
  onUploadComplete
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

  // Manual grid size state
  const [manualGridWidth, setManualGridWidth] = useState<number>(32);
  const [manualGridHeight, setManualGridHeight] = useState<number>(32);
  const [spacing, setSpacing] = useState<number>(0); // Spacing between tiles
  const [margin, setMargin] = useState<number>(0);  // Margin around entire grid
  
  // Region selection state (for selective grid application)
  const [useRegion, setUseRegion] = useState<boolean>(false);
  const [region, setRegion] = useState<{ x: number; y: number; width: number; height: number } | null>(null);

  // File input ref for programmatic triggering
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manual grid detection function
  const handleManualGridDetection = useCallback(async () => {
    if (!preview) return;
    
    setIsDetectingSprites(true);
    
    try {
      // Load image
      const img = new Image();
      img.src = preview;
      
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      
      // Create canvas to analyze pixels
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Failed to get canvas context');
      
      ctx.drawImage(img, 0, 0);
      
      // Determine the region to process
      const processRegion = useRegion && region 
        ? region 
        : { x: 0, y: 0, width: img.width, height: img.height };
      
      const selections: SpriteSelection[] = [...spriteSelections]; // Keep existing selections
      
      // Calculate grid accounting for spacing and margin
      // Formula: margin + (tileSize + spacing) * n + tileSize <= totalSize
      // Simplified: (tileSize + spacing) * n <= totalSize - margin
      const effectiveTileWidth = manualGridWidth + spacing;
      const effectiveTileHeight = manualGridHeight + spacing;
      const availableWidth = processRegion.width - margin;
      const availableHeight = processRegion.height - margin;
      
      const cols = Math.floor((availableWidth - manualGridWidth + spacing) / effectiveTileWidth) + 1;
      const rows = Math.floor((availableHeight - manualGridHeight + spacing) / effectiveTileHeight) + 1;
      
      // Get base name from filename (without extension)
      const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'sprite';
      
      let skippedEmpty = 0;
      let created = 0;
      
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          // Apply margin + spacing formula
          const x = processRegion.x + margin + (col * effectiveTileWidth);
          const y = processRegion.y + margin + (row * effectiveTileHeight);
          
          // Skip if outside image bounds
          if (x + manualGridWidth > img.width || y + manualGridHeight > img.height) {
            continue;
          }
          
          // Check if this grid cell has any non-transparent pixels
          const imageData = ctx.getImageData(x, y, manualGridWidth, manualGridHeight);
          const hasContent = checkIfCellHasContent(imageData);
          
          if (hasContent) {
            // Calculate sprite index for zero-padded naming
            const spriteIndex = selections.length;
            selections.push({
              id: `sprite_${row}_${col}_${Date.now()}`,
              x,
              y,
              width: manualGridWidth,
              height: manualGridHeight,
              name: `${baseName}_${String(spriteIndex).padStart(2, '0')}`
            });
            created++;
          } else {
            skippedEmpty++;
          }
        }
      }
      
      setSpriteSelections(selections);
      
      // Clear the region after applying (for next region)
      if (useRegion && region) {
        setRegion(null);
      }
      
      const regionText = useRegion && region ? ` in region (${processRegion.width}x${processRegion.height})` : '';
      const spacingText = spacing > 0 || margin > 0 ? `, spacing: ${spacing}px, margin: ${margin}px` : '';
      console.log(`🎯 Manual Grid Detection: Created ${created} sprites, skipped ${skippedEmpty} empty cells (${cols}x${rows} grid, ${manualGridWidth}×${manualGridHeight} tiles${spacingText}${regionText})`);
    } catch (err) {
      console.error('Manual grid detection failed:', err);
    } finally {
      setIsDetectingSprites(false);
    }
  }, [preview, manualGridWidth, manualGridHeight, spacing, margin, useRegion, region, spriteSelections, file]);

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
      if (type === 'spritesheet') {
        setMode('manual-select');
      } else if (type === 'tileset') {
        setMode('basic');
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
    if (type === 'spritesheet' && mode === 'manual-select' && spriteSelections.length === 0) {
      setError('Please select at least one sprite');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const asset = await onUpload(file, {
        name: name.trim(),
        type,
        tags,
        spriteSheetMetadata: mode === 'manual-select' ? {
          spriteSelections: spriteSelections,
          frameCount: spriteSelections.length,
          spacing: 0,
          margin: 0
        } : undefined
      });

      if (asset) {
        onUploadComplete?.(asset);
      }

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
  }, [file, name, type, tags, mode, spriteSelections, onUpload, onClose, onUploadComplete]);

  const handleVisualDetection = useCallback(async () => {
    if (!preview) return;
    
    setIsDetectingSprites(true);
    setError(null);
    
    try {
      // Auto-detect ALWAYS works on the WHOLE image (ignore regions)
      // Run visual sprite detection
      const result = await detectSpritesByTransparency(preview, 8, 2);
      setDetectionResult(result);
      
      // Get base name from filename (without extension)
      const baseName = file ? file.name.replace(/\.[^/.]+$/, '') : 'sprite';
      
      // Convert detected sprites to selections (REPLACES all existing selections)
      const selections = detectedSpritesToSelections(result.sprites, baseName);
      console.log('🎯 Auto-Detect Complete (WHOLE IMAGE):', {
        spritesDetected: result.sprites.length,
        selections: selections,
        gridDetected: result.gridDetected,
        suggestedTileSize: result.suggestedTileSize,
        note: 'All dimensions snapped to 8px grid (game-friendly)'
      });
      setSpriteSelections(selections);
      
      // Reset any region selection
      setRegion(null);
      setUseRegion(false);
      
      // Show success message
      if (result.sprites.length > 0) {
        setError(null);
        console.log(`✅ Detected ${result.sprites.length} sprites automatically from ENTIRE image!`);
      } else {
        setError('No sprites detected. Try manual selection or adjust the image.');
      }
    } catch (err) {
      console.error('Visual detection failed:', err);
      setError('Visual detection failed. Please use manual selection.');
    } finally {
      setIsDetectingSprites(false);
    }
  }, [preview, file]);

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
                <div className="relative inline-block">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/png,image/jpeg,image/jpg,image/webp"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileSelect(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    title="Browse Files"
                  />
                  <div className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium pointer-events-none">
                    Browse Files
                  </div>
                </div>
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
                    {/* Compact Controls Toolbar */}
                    <div className="p-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleVisualDetection}
                          disabled={isDetectingSprites}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 text-xs font-medium"
                        >
                          {isDetectingSprites ? (
                            <>
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-white border-t-transparent"></div>
                              Detecting...
                            </>
                          ) : (
                            <>Auto-Detect</>
                          )}
                        </button>
                        
                        <div className="w-px h-6 bg-gray-300" />
                        
                        <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useRegion}
                            onChange={(e) => setUseRegion(e.target.checked)}
                            className="rounded"
                          />
                          Region
                        </label>
                        
                        <span className="text-xs text-gray-600">Grid:</span>
                        <input
                          type="number"
                          min="8"
                          max="256"
                          value={manualGridWidth}
                          onChange={(e) => setManualGridWidth(Math.max(8, parseInt(e.target.value) || 8))}
                          className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs"
                        />
                        <span className="text-xs text-gray-500">×</span>
                        <input
                          type="number"
                          min="8"
                          max="256"
                          value={manualGridHeight}
                          onChange={(e) => setManualGridHeight(Math.max(8, parseInt(e.target.value) || 8))}
                          className="w-14 px-1.5 py-1 border border-gray-300 rounded text-xs"
                        />
                        
                        <span className="text-xs text-gray-600">Spacing:</span>
                        <input
                          type="number"
                          min="0"
                          max="32"
                          value={spacing}
                          onChange={(e) => setSpacing(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 px-1.5 py-1 border border-gray-300 rounded text-xs"
                          title="Space between tiles (px)"
                        />
                        
                        <span className="text-xs text-gray-600">Margin:</span>
                        <input
                          type="number"
                          min="0"
                          max="32"
                          value={margin}
                          onChange={(e) => setMargin(Math.max(0, parseInt(e.target.value) || 0))}
                          className="w-12 px-1.5 py-1 border border-gray-300 rounded text-xs"
                          title="Margin around entire grid (px)"
                        />
                        
                        <button
                          onClick={handleManualGridDetection}
                          disabled={isDetectingSprites || (useRegion && !region)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 transition-colors disabled:opacity-50 text-xs font-medium"
                          title={useRegion && !region ? "Draw a region first" : "Apply grid to " + (useRegion ? "selected region" : "entire image")}
                        >
                          Apply {useRegion && region ? "to Region" : ""}
                        </button>
                        
                        {useRegion && region && (
                          <button
                            onClick={() => setRegion(null)}
                            className="px-2 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors text-xs"
                            title="Clear the selected region"
                          >
                            Clear Region
                          </button>
                        )}
                      </div>
                      
                      {/* Detection result - compact */}
                      {detectionResult && (
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-gray-600">Detected: <span className="font-semibold text-gray-900">{detectionResult.sprites.length}</span></span>
                          {detectionResult.gridDetected && detectionResult.suggestedTileSize && (
                            <span className="text-gray-600">({detectionResult.suggestedTileSize.width}×{detectionResult.suggestedTileSize.height}px)</span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>{spriteSelections.length} sprites</span>
                      </div>
                    </div>
                    
                    {/* Manual Sprite Selector */}
                    <div className="flex-1 overflow-hidden">
                      <ManualSpriteSelector
                        imageUrl={preview}
                        onSelectionsChange={(selections) => setSpriteSelections(selections)}
                        initialSelections={spriteSelections}
                        regionMode={useRegion}
                        region={region}
                        onRegionChange={(newRegion) => setRegion(newRegion)}
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

