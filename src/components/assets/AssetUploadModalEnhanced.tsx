/**
 * Enhanced Asset Upload Modal with Manual Sprite Selection
 * PR-31: Supports both auto-detection and manual sprite selection
 */

import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { ManualSpriteSelector } from './ManualSpriteSelector';
import { detectSpritesByTransparency, detectedSpritesToSelections } from '../../utils/tilemap/spriteDetection';
import {
  autoDetectTileSize,
  sliceTileset,
  validateTilesetConfig,
  getImageData,
  loadImage
} from '../../utils/tilemap/tilesetSlicer';
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

function parseManualNamedTiles(input: string, tileCount: number): Record<string, number> {
  const namedTiles: Record<string, number> = {};
  const lines = input
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  let autoIndex = 0;
  lines.forEach(line => {
    if (!line) return;
    const [rawName, rawIndex] = line.split('=').map(part => part.trim());
    if (!rawName) return;

    if (rawIndex !== undefined && rawIndex !== '') {
      const parsedIndex = Number(rawIndex);
      if (!Number.isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < tileCount) {
        namedTiles[rawName] = parsedIndex;
      }
    } else {
      namedTiles[rawName] = autoIndex;
      autoIndex++;
    }
  });

  return namedTiles;
}

function parseCsvList(value: string): string[] {
  return value
    .split(',')
    .map(token => token.trim())
    .filter(Boolean);
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

  // Tileset detection state
  const [tilesetImage, setTilesetImage] = useState<HTMLImageElement | null>(null);
  const [tilesetDetecting, setTilesetDetecting] = useState(false);
  const [tilesetError, setTilesetError] = useState<string | null>(null);
  const [tilesetTileWidth, setTilesetTileWidth] = useState(32);
  const [tilesetTileHeight, setTilesetTileHeight] = useState(32);
  const [tilesetSpacing, setTilesetSpacing] = useState(0);
  const [tilesetMargin, setTilesetMargin] = useState(0);
  const [tilesetShowGrid, setTilesetShowGrid] = useState(true);
  const tilesetCanvasRef = useRef<HTMLCanvasElement>(null);
  const [lastAnalyzedPreview, setLastAnalyzedPreview] = useState<string | null>(null);
  const [manualTileNames, setManualTileNames] = useState('');
  const [materialsInput, setMaterialsInput] = useState('');
  const [themesInput, setThemesInput] = useState('');

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
      console.info(`🎯 Manual Grid Detection: Created ${created} sprites, skipped ${skippedEmpty} empty cells (${cols}x${rows} grid, ${manualGridWidth}×${manualGridHeight} tiles${spacingText}${regionText})`);
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
        setManualTileNames('');
        setMaterialsInput('');
        setThemesInput('');
        setLastAnalyzedPreview(null);
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

  const updateSpriteMetadata = useCallback((id: string, updates: Partial<SpriteSelection>) => {
    setSpriteSelections(prev => prev.map(sprite => sprite.id === id ? { ...sprite, ...updates } : sprite));
  }, []);

  const prepareTilesetPreview = useCallback(async (source: string, force: boolean = false) => {
    if (!source || type !== 'tileset') return;
    if (!force && lastAnalyzedPreview === source) return;

    setTilesetDetecting(true);
    setTilesetError(null);

    try {
      const img = await loadImage(source);
      setTilesetImage(img);

      const imageData = getImageData(img);
      const detection = autoDetectTileSize(imageData);

      setTilesetTileWidth(detection.tileWidth);
      setTilesetTileHeight(detection.tileHeight);
      setTilesetSpacing(detection.spacing);
      setTilesetMargin(detection.margin);
      setLastAnalyzedPreview(source);
    } catch (err) {
      setTilesetError(err instanceof Error ? err.message : 'Failed to analyze tileset');
    } finally {
      setTilesetDetecting(false);
    }
  }, [lastAnalyzedPreview, type]);

  useEffect(() => {
    if (preview && type === 'tileset') {
      prepareTilesetPreview(preview);
    }
  }, [preview, type, prepareTilesetPreview]);

  useEffect(() => {
    if (type !== 'tileset') {
      setTilesetImage(null);
      setTilesetError(null);
      setLastAnalyzedPreview(null);
    } else {
      setLastAnalyzedPreview(null);
    }
  }, [type]);

  const tilesetAnalysis = useMemo(() => {
    if (!tilesetImage) return null;

    const validation = validateTilesetConfig(
      tilesetImage.width,
      tilesetImage.height,
      tilesetTileWidth,
      tilesetTileHeight,
      tilesetSpacing,
      tilesetMargin
    );

    if (!validation.valid) {
      return { validation, slice: null };
    }

    try {
      const imageData = getImageData(tilesetImage);
      const slice = sliceTileset(imageData, tilesetTileWidth, tilesetTileHeight, tilesetSpacing, tilesetMargin);
      return { validation, slice };
    } catch (err) {
      console.error('Failed to slice tileset preview:', err);
      return { validation: { valid: false, errors: ['Failed to slice tileset image'], warnings: [] }, slice: null };
    }
  }, [tilesetImage, tilesetTileWidth, tilesetTileHeight, tilesetSpacing, tilesetMargin]);

  useEffect(() => {
    if (!tilesetCanvasRef.current || !tilesetImage) return;

    const canvas = tilesetCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = tilesetImage.width;
    canvas.height = tilesetImage.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(tilesetImage, 0, 0);

    if (tilesetShowGrid && tilesetAnalysis?.slice) {
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.9)';
      ctx.lineWidth = 1;
      tilesetAnalysis.slice.tiles.forEach(tile => {
        ctx.strokeRect(tile.x + 0.5, tile.y + 0.5, tile.width, tile.height);
      });
    }
  }, [tilesetAnalysis, tilesetImage, tilesetShowGrid]);

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
      let tilesetMetadataForUpload: TilesetMetadata | undefined;
      if (type === 'tileset') {
        if (!tilesetAnalysis?.slice) {
          setError('Unable to detect tileset grid. Adjust the settings and try again.');
          setIsUploading(false);
          return;
        }

        const manualMaterials = parseCsvList(materialsInput);
        const manualThemes = parseCsvList(themesInput);

        tilesetMetadataForUpload = {
          ...tilesetAnalysis.slice.metadata,
          spacing: tilesetSpacing,
          margin: tilesetMargin,
          ...(manualMaterials.length > 0 ? { materials: manualMaterials } : {}),
          ...(manualThemes.length > 0 ? { themes: manualThemes } : {}),
          ...(manualTileNames.trim()
            ? { namedTiles: parseManualNamedTiles(manualTileNames, tilesetAnalysis.slice.metadata.tileCount) }
            : {})
        };
      }

      const asset = await onUpload(file, {
        name: name.trim(),
        type,
        tags,
        spriteSheetMetadata: mode === 'manual-select' ? {
          spriteSelections: spriteSelections,
          frameCount: spriteSelections.length,
          spacing: 0,
          margin: 0,
          selectionMode: 'manual'
        } : undefined,
        tilesetMetadata: tilesetMetadataForUpload
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
      setMaterialsInput('');
      setThemesInput('');
      setManualTileNames('');
      setTilesetImage(null);
      setTilesetError(null);
      setLastAnalyzedPreview(null);

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setIsUploading(false);
    }
  }, [
    file,
    name,
    type,
    tags,
    mode,
    spriteSelections,
    onUpload,
    onClose,
    onUploadComplete,
    tilesetAnalysis,
    materialsInput,
    themesInput,
    manualTileNames,
    tilesetSpacing,
    tilesetMargin
  ]);

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
      console.info('🎯 Auto-Detect Complete (WHOLE IMAGE):', {
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
        console.info(`✅ Detected ${result.sprites.length} sprites automatically from ENTIRE image!`);
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

  const handleTilesetAutoDetect = useCallback(() => {
    if (preview && type === 'tileset') {
      prepareTilesetPreview(preview, true);
    }
  }, [prepareTilesetPreview, preview, type]);

  useEffect(() => {
    if (type !== 'spritesheet') return;
    if (detectionResult?.inferredMaterials && materialsInput.length === 0) {
      setMaterialsInput(detectionResult.inferredMaterials.join(', '));
    }
    if (detectionResult?.inferredThemes && themesInput.length === 0) {
      setThemesInput(detectionResult.inferredThemes.join(', '));
    }
  }, [detectionResult, materialsInput.length, themesInput.length, type]);

  // Auto-run visual detection when switching to manual mode
  useEffect(() => {
    if (mode === 'manual-select' && preview && !detectionResult && spriteSelections.length === 0) {
      // Automatically run visual detection on first visit to manual tab
      handleVisualDetection();
    }
  }, [mode, preview, detectionResult, spriteSelections.length, handleVisualDetection]);

  if (!isOpen) return null;

  const tilesetMetadata = tilesetAnalysis?.slice?.metadata;
  const tilesetValidation = tilesetAnalysis?.validation;
  const tilesetWarnings = tilesetValidation?.warnings ?? [];
  const spriteSummary = detectionResult ? {
    count: detectionResult.sprites?.length ?? 0,
    grid: detectionResult.gridDetected ? detectionResult.suggestedTileSize : null
  } : null;

  const spriteReady = type !== 'spritesheet' || spriteSelections.length > 0;
  const tilesetReady = type !== 'tileset' || Boolean(tilesetAnalysis?.slice);
  const canUpload = !isUploading && name.trim().length > 0 && spriteReady && tilesetReady;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-7xl max-h-[95vh] flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-5 py-3 border-b border-slate-200 bg-slate-50">
          <div>
            <h2 className="text-lg font-semibold text-slate-800">Upload Asset</h2>
            {file && <p className="text-xs text-slate-500">{file.name}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-700 text-xl flex items-center justify-center w-8 h-8"
            disabled={isUploading}
          >
            ×
          </button>
        </header>

        {!file ? (
          <div className="flex-1 overflow-auto bg-slate-50 p-8">
            <div
              className="border-2 border-dashed border-slate-300 rounded-xl p-12 text-center bg-white shadow-inner hover:border-slate-400 transition-colors"
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <div className="mb-6 text-slate-400">
                <svg className="mx-auto h-16 w-16" viewBox="0 0 48 48" fill="none" stroke="currentColor">
                  <path
                    d="M28 8H12a4 4 0 00-4 4v24a4 4 0 004 4h24a4 4 0 004-4V20"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M20 24l4 4 12-12"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
              <p className="text-slate-600 text-lg mb-4">Drag & drop art here</p>
              <div className="relative inline-flex">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/jpg,image/webp"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileSelect(e.target.files[0]);
                    }
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <div className="px-6 py-2.5 bg-blue-600 text-white rounded-md text-sm font-medium shadow hover:bg-blue-700 transition-colors pointer-events-none">
                  Browse Files
                </div>
              </div>
              <p className="text-xs text-slate-500 mt-3">PNG, JPG, WEBP up to 10MB</p>
            </div>

            <div className="mt-8">
              <span className="block text-sm font-medium text-slate-700 mb-2">Asset type</span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => setType('image')}
                  className={`rounded-lg border px-4 py-3 text-left shadow-sm transition ${type === 'image' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="font-semibold">Single Image</div>
                  <div className="text-xs text-slate-500 mt-1">Standalone sprite or icon</div>
                </button>
                <button
                  onClick={() => { setType('spritesheet'); setMode('manual-select'); }}
                  className={`rounded-lg border px-4 py-3 text-left shadow-sm transition ${type === 'spritesheet' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="font-semibold">Sprite Sheet</div>
                  <div className="text-xs text-slate-500 mt-1">Multiple sprites (trees, items)</div>
                </button>
                <button
                  onClick={() => setType('tileset')}
                  className={`rounded-lg border px-4 py-3 text-left shadow-sm transition ${type === 'tileset' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                >
                  <div className="font-semibold">Tileset</div>
                  <div className="text-xs text-slate-500 mt-1">Uniform grid tiles</div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-1 overflow-hidden">
            <div className="flex-1 flex flex-col bg-slate-50">
              <div className="flex items-center justify-between px-4 py-2 border-b border-slate-200 text-xs text-slate-600">
                <div className="flex items-center gap-4">
                  <span className="uppercase tracking-wide text-[10px] text-slate-500">{type.toUpperCase()}</span>
                  {type === 'spritesheet' && spriteSummary && (
                    <span>{spriteSummary.count} sprites{spriteSummary.grid ? ` • grid ${spriteSummary.grid.width}×${spriteSummary.grid.height}` : ''}</span>
                  )}
                  {type === 'tileset' && tilesetMetadata && (
                    <span>{tilesetMetadata.columns}×{tilesetMetadata.rows} • {tilesetMetadata.tileCount} tiles</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  {type === 'spritesheet' && (
                    <>
                      <button
                        onClick={handleVisualDetection}
                        disabled={isDetectingSprites}
                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium shadow hover:bg-blue-700 disabled:opacity-50"
                      >
                        {isDetectingSprites ? 'Detecting…' : 'Auto Detect'}
                      </button>
                      <div className="flex items-center gap-1 text-[11px] text-slate-600">
                        <span>Grid</span>
                        <input
                          type="number"
                          min={8}
                          max={512}
                          value={manualGridWidth}
                          onChange={(e) => setManualGridWidth(Math.max(8, Number(e.target.value) || 8))}
                          className="w-12 px-1 py-0.5 border border-slate-300 rounded"
                        />
                        <span>×</span>
                        <input
                          type="number"
                          min={8}
                          max={512}
                          value={manualGridHeight}
                          onChange={(e) => setManualGridHeight(Math.max(8, Number(e.target.value) || 8))}
                          className="w-12 px-1 py-0.5 border border-slate-300 rounded"
                        />
                        <span>Space</span>
                        <input
                          type="number"
                          min={0}
                          max={64}
                          value={spacing}
                          onChange={(e) => setSpacing(Math.max(0, Number(e.target.value) || 0))}
                          className="w-10 px-1 py-0.5 border border-slate-300 rounded"
                        />
                        <span>Margin</span>
                        <input
                          type="number"
                          min={0}
                          max={64}
                          value={margin}
                          onChange={(e) => setMargin(Math.max(0, Number(e.target.value) || 0))}
                          className="w-10 px-1 py-0.5 border border-slate-300 rounded"
                        />
                        <button
                          onClick={handleManualGridDetection}
                          disabled={isDetectingSprites || (useRegion && !region)}
                          className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded text-[11px] font-medium disabled:opacity-50"
                        >
                          Apply
                        </button>
                        <label className="inline-flex items-center gap-1 ml-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={useRegion}
                            onChange={(e) => setUseRegion(e.target.checked)}
                            className="rounded"
                          />
                          <span>Region</span>
                        </label>
                      </div>
                    </>
                  )}
                  {type === 'tileset' && (
                    <button
                      onClick={handleTilesetAutoDetect}
                      disabled={tilesetDetecting}
                      className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-xs font-medium shadow hover:bg-blue-700 disabled:opacity-50"
                    >
                      {tilesetDetecting ? 'Detecting…' : 'Auto Detect Grid'}
                    </button>
                  )}
                  {type === 'tileset' && (
                    <label className="inline-flex items-center gap-1 text-xs text-slate-600 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={tilesetShowGrid}
                        onChange={(e) => setTilesetShowGrid(e.target.checked)}
                        className="rounded"
                      />
                      Grid Overlay
                    </label>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-auto">
                {type === 'tileset' && tilesetImage ? (
                  <div className="p-4 flex flex-col gap-3">
                    <div className="flex flex-wrap gap-3 text-xs text-slate-600">
                      <span>Tile: {tilesetTileWidth}×{tilesetTileHeight}px</span>
                      {tilesetMetadata && <span>Tiles: {tilesetMetadata.tileCount}</span>}
                      {tilesetWarnings.length > 0 && <span className="text-amber-600">Warnings: {tilesetWarnings.length}</span>}
                    </div>
                    <div className="flex justify-center">
                      <canvas
                        ref={tilesetCanvasRef}
                        className="border border-slate-300 bg-white rounded shadow-inner"
                        style={{ imageRendering: 'pixelated', maxWidth: '100%', maxHeight: '70vh' }}
                      />
                    </div>
                    {tilesetError && (
                      <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
                        {tilesetError}
                      </div>
                    )}
                    {tilesetWarnings.length > 0 && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-700 text-xs px-3 py-2 rounded space-y-1">
                        {tilesetWarnings.map((warn, idx) => (
                          <div key={idx}>⚠️ {warn}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : type === 'spritesheet' && preview ? (
                  <div className="h-full flex flex-col">
                    <div className="flex-1">
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
                ) : (
                  <div className="h-full flex items-center justify-center p-6">
                    {preview && (
                      <img src={preview} alt="Preview" className="max-h-[70vh] max-w-full rounded shadow" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <aside className="w-full md:w-80 border-l border-slate-200 bg-white flex flex-col overflow-y-auto">
              <div className="p-4 space-y-5">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold text-slate-600">Asset Type</label>
                  <div className="flex gap-2">
                    {(['image', 'spritesheet', 'tileset'] as AssetType[]).map(option => (
                      <button
                        key={option}
                        onClick={() => {
                          setType(option);
                          if (option === 'spritesheet') setMode('manual-select');
                        }}
                        className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium border ${type === option ? 'border-blue-500 bg-blue-50 text-blue-600' : 'border-slate-200 hover:border-slate-300 text-slate-600'}`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Asset Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    placeholder="forest_tileset"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Tags</label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddTag();
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                      placeholder="environment, forest"
                    />
                    <button
                      onClick={handleAddTag}
                      className="px-3 py-2 bg-slate-200 text-slate-700 rounded text-xs font-medium hover:bg-slate-300"
                    >
                      Add
                    </button>
                  </div>
                  {tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {tags.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-[11px]">
                          {tag}
                          <button onClick={() => handleRemoveTag(tag)} className="hover:text-blue-900">×</button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Materials</label>
                    <input
                      type="text"
                      value={materialsInput}
                      onChange={(e) => setMaterialsInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="grass, stone"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1">Themes</label>
                    <input
                      type="text"
                      value={themesInput}
                      onChange={(e) => setThemesInput(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="forest, dungeon"
                    />
                  </div>
                </div>

                {type === 'tileset' && (
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <label className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-600">Tile Width</span>
                        <input
                          type="number"
                          value={tilesetTileWidth}
                          min={1}
                          onChange={(e) => setTilesetTileWidth(Math.max(1, Number(e.target.value) || 1))}
                          className="px-2 py-1 border border-slate-300 rounded"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-600">Tile Height</span>
                        <input
                          type="number"
                          value={tilesetTileHeight}
                          min={1}
                          onChange={(e) => setTilesetTileHeight(Math.max(1, Number(e.target.value) || 1))}
                          className="px-2 py-1 border border-slate-300 rounded"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-600">Spacing</span>
                        <input
                          type="number"
                          value={tilesetSpacing}
                          min={0}
                          onChange={(e) => setTilesetSpacing(Math.max(0, Number(e.target.value) || 0))}
                          className="px-2 py-1 border border-slate-300 rounded"
                        />
                      </label>
                      <label className="flex flex-col gap-1">
                        <span className="font-semibold text-slate-600">Margin</span>
                        <input
                          type="number"
                          value={tilesetMargin}
                          min={0}
                          onChange={(e) => setTilesetMargin(Math.max(0, Number(e.target.value) || 0))}
                          className="px-2 py-1 border border-slate-300 rounded"
                        />
                      </label>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Manual Tile Names</label>
                      <textarea
                        value={manualTileNames}
                        onChange={(e) => setManualTileNames(e.target.value)}
                        rows={4}
                        className="w-full px-3 py-2 border border-slate-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="grass.center = 0\nwater.edge = 5"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">One per line, optional index.</p>
                    </div>
                  </div>
                )}

                {type === 'spritesheet' && spriteSelections.length > 0 && (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-semibold text-slate-600">Sprite Metadata</span>
                      <span className="text-[11px] text-slate-500">{spriteSelections.length} sprites</span>
                    </div>
                    <div className="max-h-48 overflow-auto space-y-2 pr-1">
                      {spriteSelections.map(sprite => (
                        <div key={sprite.id} className="border border-slate-200 rounded p-2 bg-slate-50 text-xs space-y-1">
                          <div className="flex items-center justify-between text-[11px] text-slate-500">
                            <span>{sprite.name}</span>
                            <span>{sprite.width}×{sprite.height}</span>
                          </div>
                          <input
                            type="text"
                            value={sprite.category || ''}
                            onChange={(e) => updateSpriteMetadata(sprite.id, { category: e.target.value || undefined })}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="category (tree, rock)"
                          />
                          <input
                            type="text"
                            value={(sprite.tags || []).join(', ')}
                            onChange={(e) => updateSpriteMetadata(sprite.id, { tags: parseCsvList(e.target.value) })}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="tags"
                          />
                          <textarea
                            value={sprite.notes || ''}
                            onChange={(e) => updateSpriteMetadata(sprite.id, { notes: e.target.value || undefined })}
                            rows={2}
                            className="w-full px-2 py-1 border border-slate-300 rounded"
                            placeholder="notes"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 text-xs px-3 py-2 rounded">
                    {error}
                  </div>
                )}
              </div>
            </aside>
          </div>
        )}

        <footer className="px-5 py-3 border-t border-slate-200 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            {type === 'spritesheet' && !spriteReady && <span className="text-amber-600">Select at least one sprite.</span>}
            {type === 'tileset' && !tilesetReady && <span className="text-amber-600">Adjust grid settings to slice tileset.</span>}
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={handleReset}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              Start Over
            </button>
            <button
              onClick={onClose}
              disabled={isUploading}
              className="px-4 py-2 text-xs font-medium text-slate-600 border border-slate-300 rounded hover:bg-slate-100 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!canUpload}
              className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 rounded shadow hover:bg-blue-700 disabled:opacity-50"
            >
              {isUploading ? 'Uploading…' : 'Upload Asset'}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
