/**
 * Manual Sprite Selector
 * Allows users to manually define sprite bounds for irregular sprite sheets
 * PR-31: Enhancement for non-uniform sprite collections
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva';
import useImage from 'use-image';
import type { SpriteSelection } from '../../types/asset';

interface ManualSpriteSelectorProps {
  imageUrl: string;
  onSelectionsChange: (selections: SpriteSelection[]) => void;
  initialSelections?: SpriteSelection[];
  regionMode?: boolean;
  region?: { x: number; y: number; width: number; height: number } | null;
  onRegionChange?: (region: { x: number; y: number; width: number; height: number } | null) => void;
}

export const ManualSpriteSelector: React.FC<ManualSpriteSelectorProps> = ({
  imageUrl,
  onSelectionsChange,
  initialSelections = [],
  regionMode = false,
  region = null,
  onRegionChange
}) => {
  const [image] = useImage(imageUrl, 'anonymous');
  const [selections, setSelections] = useState<SpriteSelection[]>(initialSelections);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawStart, setDrawStart] = useState<{ x: number; y: number } | null>(null);
  const [currentRect, setCurrentRect] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [gridSize, setGridSize] = useState(16);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null);
  const [spacePressed, setSpacePressed] = useState(false);
  const stageRef = useRef<any>(null);

  // Container size
  const [containerSize, setContainerSize] = useState({ width: 800, height: 600 });

  useEffect(() => {
    const updateSize = () => {
      const container = document.getElementById('sprite-selector-container');
      if (container) {
        setContainerSize({
          width: container.clientWidth,
          height: container.clientHeight
        });
      }
    };

    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  // Handle keyboard for panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setSpacePressed(true);
      }
      
      // Arrow keys for panning
      const panSpeed = 20;
      if (e.key === 'ArrowLeft') {
        setPan(prev => ({ ...prev, x: prev.x + panSpeed }));
      } else if (e.key === 'ArrowRight') {
        setPan(prev => ({ ...prev, x: prev.x - panSpeed }));
      } else if (e.key === 'ArrowUp') {
        setPan(prev => ({ ...prev, y: prev.y + panSpeed }));
      } else if (e.key === 'ArrowDown') {
        setPan(prev => ({ ...prev, y: prev.y - panSpeed }));
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Update selections when initialSelections change from parent (e.g., after auto-detection or manual grid)
  // But DON'T notify parent back (that would create a loop)
  const prevInitialSelectionsRef = useRef<SpriteSelection[]>([]);
  const isUpdatingFromParent = useRef(false);
  
  useEffect(() => {
    // Only update if initialSelections actually changed (not just re-rendered)
    const currentStr = JSON.stringify(initialSelections);
    const prevStr = JSON.stringify(prevInitialSelectionsRef.current);
    
    if (currentStr !== prevStr) {
      isUpdatingFromParent.current = true;
      setSelections(initialSelections);
      prevInitialSelectionsRef.current = initialSelections;
      // Reset flag after state update completes
      setTimeout(() => {
        isUpdatingFromParent.current = false;
      }, 0);
    }
  }, [initialSelections]);

  // Snap to grid helper
  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Handle mouse down - start drawing or panning
  const handleMouseDown = (e: any) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // If space is pressed, start panning
    if (spacePressed) {
      setIsPanning(true);
      setPanStart(pointerPosition);
      return;
    }
    
    // Only start drawing if we didn't click on an existing selection or text
    const targetName = e.target.name ? e.target.name() : null;
    if (targetName === 'selection' || targetName === 'selection-text') {
      return; // Let the selection's onClick handle it
    }

    const x = snap((pointerPosition.x - pan.x) / zoom);
    const y = snap((pointerPosition.y - pan.y) / zoom);

    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
    setSelectedId(null);
  };

  // Handle mouse move - update rectangle or pan
  const handleMouseMove = (e: any) => {
    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    
    // Handle panning
    if (isPanning && panStart) {
      setPan({
        x: pan.x + (pointerPosition.x - panStart.x),
        y: pan.y + (pointerPosition.y - panStart.y),
      });
      setPanStart(pointerPosition);
      return;
    }
    
    // Handle drawing
    if (!isDrawing || !drawStart) return;

    const x2 = snap((pointerPosition.x - pan.x) / zoom);
    const y2 = snap((pointerPosition.y - pan.y) / zoom);

    // Calculate rectangle from start point to current point (works in all directions)
    setCurrentRect({
      x: Math.min(drawStart.x, x2),
      y: Math.min(drawStart.y, y2),
      width: Math.abs(x2 - drawStart.x),
      height: Math.abs(y2 - drawStart.y)
    });
  };

  // Handle mouse up - finish drawing or panning
  const handleMouseUp = () => {
    if (isPanning) {
      setIsPanning(false);
      setPanStart(null);
      return;
    }
    
    if (!isDrawing || !currentRect) return;

    // Only add if rectangle has meaningful size
    if (currentRect.width > 5 && currentRect.height > 5) {
      if (regionMode && onRegionChange) {
        // In region mode, set the region
        onRegionChange({
          x: Math.round(currentRect.x),
          y: Math.round(currentRect.y),
          width: Math.round(currentRect.width),
          height: Math.round(currentRect.height)
        });
      } else {
        // In sprite mode, add a new sprite selection
        const newSelection: SpriteSelection = {
          id: `sprite_${Date.now()}`,
          name: `Sprite ${selections.length + 1}`,
          x: Math.round(currentRect.x),
          y: Math.round(currentRect.y),
          width: Math.round(currentRect.width),
          height: Math.round(currentRect.height)
        };

        const newSelections = [...selections, newSelection];
        setSelections(newSelections);
        notifyParent(newSelections);
        setSelectedId(newSelection.id);
      }
    }

    setIsDrawing(false);
    setCurrentRect(null);
    setDrawStart(null);
  };

  // Helper to notify parent only when user makes changes
  const notifyParent = useCallback((newSelections: SpriteSelection[]) => {
    if (!isUpdatingFromParent.current) {
      onSelectionsChange(newSelections);
    }
  }, [onSelectionsChange]);

  // Delete selected sprite
  const deleteSelection = (id: string) => {
    const newSelections = selections.filter(s => s.id !== id);
    setSelections(newSelections);
    notifyParent(newSelections);
    if (selectedId === id) setSelectedId(null);
  };

  // Update sprite name
  const updateSpriteName = (id: string, name: string) => {
    const newSelections = selections.map(s => 
      s.id === id ? { ...s, name } : s
    );
    setSelections(newSelections);
    notifyParent(newSelections);
  };

  // Clear all selections
  const clearAll = () => {
    if (window.confirm('Clear all sprite selections?')) {
      setSelections([]);
      notifyParent([]);
      setSelectedId(null);
    }
  };

  // Zoom controls
  const handleZoomIn = () => setZoom(Math.min(zoom * 1.5, 5));
  const handleZoomOut = () => setZoom(Math.max(zoom / 1.5, 0.25));
  const handleResetZoom = () => { setZoom(1); setPan({ x: 0, y: 0 }); };

  // Handle wheel for zoom
  const handleWheel = (e: any) => {
    e.evt.preventDefault();

    const stage = e.target.getStage();
    const oldScale = zoom;
    const pointer = stage.getPointerPosition();

    const mousePointTo = {
      x: (pointer.x - pan.x) / oldScale,
      y: (pointer.y - pan.y) / oldScale,
    };

    const newScale = e.evt.deltaY > 0 
      ? Math.max(oldScale / 1.1, 0.25)
      : Math.min(oldScale * 1.1, 5);

    setZoom(newScale);
    setPan({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Compact Toolbar */}
      <div className="bg-gray-50 border-b border-gray-200 px-2 py-1.5 flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          {regionMode ? (
            <>
              <span className="text-amber-600 font-semibold">Region Mode</span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">{region ? 'Region set! Apply grid or draw new region' : 'Draw a rectangle to select region'}</span>
            </>
          ) : (
            <>
              <span className="text-gray-600">
                {selections.length} sprite{selections.length !== 1 ? 's' : ''}
              </span>
              <span className="text-gray-400">•</span>
              <span className="text-gray-500">Space+drag: pan | Arrows: pan | Scroll: zoom</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {/* Zoom */}
          <button onClick={handleZoomOut} className="px-1.5 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Zoom Out">−</button>
          <span className="text-gray-600 min-w-[45px] text-center">{(zoom * 100).toFixed(0)}%</span>
          <button onClick={handleZoomIn} className="px-1.5 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50" title="Zoom In">+</button>
          <button onClick={handleResetZoom} className="px-2 py-0.5 bg-white border border-gray-300 rounded hover:bg-gray-50">Reset</button>

          <div className="w-px h-4 bg-gray-300" />

          {/* Snap */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-2 py-0.5 border rounded ${snapToGrid ? 'bg-blue-500 text-white border-blue-600' : 'bg-white border-gray-300 hover:bg-gray-50'}`}
          >
            Snap: {snapToGrid ? 'ON' : 'OFF'}
          </button>
          
          {snapToGrid && (
            <div className="flex items-center gap-1">
              {[8, 16, 32].map(size => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`px-1.5 py-0.5 rounded ${gridSize === size ? 'bg-blue-500 text-white' : 'bg-white border border-gray-300 hover:bg-gray-50'}`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-4 bg-gray-300" />

          <button
            onClick={clearAll}
            disabled={selections.length === 0}
            className="px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Canvas */}
        <div id="sprite-selector-container" className="flex-1 bg-gray-200 overflow-hidden">
          <Stage
            ref={stageRef}
            width={containerSize.width}
            height={containerSize.height}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onWheel={handleWheel}
            style={{ cursor: isPanning ? 'grabbing' : (spacePressed ? 'grab' : (isDrawing ? 'crosshair' : 'default')) }}
          >
            <Layer
              x={pan.x}
              y={pan.y}
              scaleX={zoom}
              scaleY={zoom}
            >
              {/* Background image */}
              {image && (
                <KonvaImage
                  image={image}
                  listening={false}
                />
              )}

              {/* Grid overlay */}
              {snapToGrid && image && (
                <>
                  {/* Vertical grid lines */}
                  {Array.from({ length: Math.ceil(image.width / gridSize) + 1 }).map((_, i) => {
                    const x = i * gridSize;
                    return (
                      <Rect
                        key={`v-${i}`}
                        x={x}
                        y={0}
                        width={1}
                        height={image.height}
                        fill="rgba(59, 130, 246, 0.15)"
                        listening={false}
                      />
                    );
                  })}
                  {/* Horizontal grid lines */}
                  {Array.from({ length: Math.ceil(image.height / gridSize) + 1 }).map((_, i) => {
                    const y = i * gridSize;
                    return (
                      <Rect
                        key={`h-${i}`}
                        x={0}
                        y={y}
                        width={image.width}
                        height={1}
                        fill="rgba(59, 130, 246, 0.15)"
                        listening={false}
                      />
                    );
                  })}
                </>
              )}

              {/* Existing selections */}
              {selections.map((selection) => (
                <React.Fragment key={selection.id}>
                  <Rect
                    name="selection"
                    x={selection.x}
                    y={selection.y}
                    width={selection.width}
                    height={selection.height}
                    stroke={selectedId === selection.id ? '#3b82f6' : '#10b981'}
                    strokeWidth={(selectedId === selection.id ? 3 : 2) / zoom}
                    dash={selectedId === selection.id ? undefined : [5 / zoom, 5 / zoom]}
                    fill={selectedId === selection.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'}
                    onClick={() => setSelectedId(selection.id)}
                    onTap={() => setSelectedId(selection.id)}
                  />
                  {!regionMode && (
                    <>
                      <Text
                        name="selection-text"
                        x={selection.x}
                        y={selection.y - (18 / zoom)}
                        text={selection.name}
                        fontSize={14 / zoom}
                        fill={selectedId === selection.id ? '#3b82f6' : '#10b981'}
                        fontStyle="bold"
                      />
                      <Text
                        name="selection-text"
                        x={selection.x}
                        y={selection.y + selection.height + (2 / zoom)}
                        text={`${selection.width}×${selection.height}`}
                        fontSize={11 / zoom}
                        fill="#666"
                      />
                    </>
                  )}
                </React.Fragment>
              ))}

              {/* Region rectangle (when in region mode) */}
              {regionMode && region && !isDrawing && (
                <>
                  <Rect
                    x={region.x}
                    y={region.y}
                    width={region.width}
                    height={region.height}
                    stroke="#f59e0b"
                    strokeWidth={3 / zoom}
                    dash={[10 / zoom, 5 / zoom]}
                    fill="rgba(245, 158, 11, 0.15)"
                    listening={false}
                  />
                  <Text
                    x={region.x}
                    y={region.y - (20 / zoom)}
                    text={`Region: ${region.width}×${region.height}`}
                    fontSize={14 / zoom}
                    fill="#f59e0b"
                    fontStyle="bold"
                  />
                </>
              )}

              {/* Current drawing rectangle */}
              {isDrawing && currentRect && (
                <>
                  <Rect
                    x={currentRect.x}
                    y={currentRect.y}
                    width={currentRect.width}
                    height={currentRect.height}
                    stroke={regionMode ? "#f59e0b" : "#ef4444"}
                    strokeWidth={2 / zoom}
                    dash={[5 / zoom, 5 / zoom]}
                    fill={regionMode ? "rgba(245, 158, 11, 0.1)" : "rgba(239, 68, 68, 0.1)"}
                  />
                  <Text
                    x={currentRect.x}
                    y={currentRect.y - (20 / zoom)}
                    text={`${currentRect.width}×${currentRect.height}`}
                    fontSize={14 / zoom}
                    fill={regionMode ? "#f59e0b" : "#ef4444"}
                    fontStyle="bold"
                  />
                </>
              )}
            </Layer>
          </Stage>
        </div>

        {/* Compact Sidebar */}
        <div className="w-56 bg-white border-l border-gray-200 flex flex-col text-xs">
          <div className="px-2 py-1.5 border-b border-gray-200 bg-gray-50">
            <span className="font-semibold text-gray-700">Sprites</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selections.length === 0 ? (
              <div className="p-4 text-center text-gray-400">
                <p className="text-xs">No sprites yet</p>
                <p className="text-xs mt-1">Draw rectangles on canvas</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {selections.map((selection) => (
                  <div
                    key={selection.id}
                    className={`p-2 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedId === selection.id ? 'bg-blue-50 border-l-2 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedId(selection.id)}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={selection.name}
                          onChange={(e) => updateSpriteName(selection.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-1 py-0.5 text-xs font-medium bg-transparent border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          placeholder="Name"
                        />
                        <div className="text-[10px] text-gray-500 mt-0.5">
                          <div>({selection.x}, {selection.y})</div>
                          <div>{selection.width}×{selection.height}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSelection(selection.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-0.5"
                        title="Delete"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Export preview */}
          {selections.length > 0 && (
            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => {
                  const json = JSON.stringify({ frames: selections }, null, 2);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = 'sprites.json';
                  a.click();
                  URL.revokeObjectURL(url);
                }}
                className="w-full px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm font-medium"
              >
                Export JSON ({selections.length} sprites)
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border-t border-blue-200 px-4 py-2">
        <div className="flex items-center gap-2 text-xs text-blue-800">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span>
            <strong>Tip:</strong> Click and drag to draw rectangles around sprites. 
            Use mouse wheel to zoom. Click sprites in the list to select them.
          </span>
        </div>
      </div>
    </div>
  );
};

