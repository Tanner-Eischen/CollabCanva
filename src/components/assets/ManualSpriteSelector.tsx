/**
 * Manual Sprite Selector
 * Allows users to manually define sprite bounds for irregular sprite sheets
 * PR-31: Enhancement for non-uniform sprite collections
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stage, Layer, Image as KonvaImage, Rect, Text } from 'react-konva';
import useImage from 'use-image';

export interface SpriteSelection {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

interface ManualSpriteSelectorProps {
  imageUrl: string;
  onSelectionsChange: (selections: SpriteSelection[]) => void;
  initialSelections?: SpriteSelection[];
}

export const ManualSpriteSelector: React.FC<ManualSpriteSelectorProps> = ({
  imageUrl,
  onSelectionsChange,
  initialSelections = []
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

  // Update selections when initialSelections change (e.g., after auto-detection)
  useEffect(() => {
    if (initialSelections.length > 0) {
      setSelections(initialSelections);
    }
  }, [initialSelections]);

  useEffect(() => {
    onSelectionsChange(selections);
  }, [selections]);

  // Snap to grid helper
  const snap = (value: number) => {
    if (!snapToGrid) return value;
    return Math.round(value / gridSize) * gridSize;
  };

  // Handle mouse down - start drawing
  const handleMouseDown = (e: any) => {
    // Only start drawing if we didn't click on an existing selection or text
    const targetName = e.target.name ? e.target.name() : null;
    if (targetName === 'selection' || targetName === 'selection-text') {
      return; // Let the selection's onClick handle it
    }

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
    const x = snap((pointerPosition.x - pan.x) / zoom);
    const y = snap((pointerPosition.y - pan.y) / zoom);

    setIsDrawing(true);
    setDrawStart({ x, y });
    setCurrentRect({ x, y, width: 0, height: 0 });
    setSelectedId(null);
  };

  // Handle mouse move - update rectangle
  const handleMouseMove = (e: any) => {
    if (!isDrawing || !drawStart) return;

    const stage = e.target.getStage();
    const pointerPosition = stage.getPointerPosition();
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

  // Handle mouse up - finish drawing
  const handleMouseUp = () => {
    if (!isDrawing || !currentRect) return;

    // Only add if rectangle has meaningful size
    if (currentRect.width > 5 && currentRect.height > 5) {
      const newSelection: SpriteSelection = {
        id: `sprite_${Date.now()}`,
        name: `Sprite ${selections.length + 1}`,
        x: Math.round(currentRect.x),
        y: Math.round(currentRect.y),
        width: Math.round(currentRect.width),
        height: Math.round(currentRect.height)
      };

      setSelections([...selections, newSelection]);
      setSelectedId(newSelection.id);
    }

    setIsDrawing(false);
    setCurrentRect(null);
    setDrawStart(null);
  };

  // Delete selected sprite
  const deleteSelection = (id: string) => {
    setSelections(selections.filter(s => s.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  // Update sprite name
  const updateSpriteName = (id: string, name: string) => {
    setSelections(selections.map(s => 
      s.id === id ? { ...s, name } : s
    ));
  };

  // Clear all selections
  const clearAll = () => {
    if (window.confirm('Clear all sprite selections?')) {
      setSelections([]);
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
      {/* Toolbar */}
      <div className="bg-gray-100 border-b border-gray-300 p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">
            Draw rectangles around each sprite
          </span>
          <span className="text-xs text-gray-500">
            ({selections.length} sprite{selections.length !== 1 ? 's' : ''} selected)
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
            title="Zoom Out"
          >
            −
          </button>
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {(zoom * 100).toFixed(0)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
            title="Zoom In"
          >
            +
          </button>
          <button
            onClick={handleResetZoom}
            className="px-3 py-1 bg-white border border-gray-300 rounded hover:bg-gray-50 text-sm"
          >
            Reset
          </button>

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Snap to Grid controls */}
          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`px-3 py-1 border rounded text-sm ${
              snapToGrid 
                ? 'bg-blue-500 text-white border-blue-600' 
                : 'bg-white border-gray-300 hover:bg-gray-50'
            }`}
            title="Toggle snap to grid"
          >
            Snap: {snapToGrid ? 'ON' : 'OFF'}
          </button>
          
          {snapToGrid && (
            <div className="flex items-center gap-1 bg-white border border-gray-300 rounded px-2 py-1">
              <span className="text-xs text-gray-600">Grid:</span>
              {[8, 16, 32].map(size => (
                <button
                  key={size}
                  onClick={() => setGridSize(size)}
                  className={`px-2 py-0.5 text-xs rounded ${
                    gridSize === size
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          )}

          <div className="w-px h-6 bg-gray-300 mx-1" />

          {/* Clear all */}
          <button
            onClick={clearAll}
            disabled={selections.length === 0}
            className="px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded hover:bg-red-100 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Clear All
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
            style={{ cursor: isDrawing ? 'crosshair' : 'default' }}
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
                    strokeWidth={selectedId === selection.id ? 3 : 2}
                    dash={selectedId === selection.id ? undefined : [5, 5]}
                    fill={selectedId === selection.id ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 185, 129, 0.1)'}
                    onClick={() => setSelectedId(selection.id)}
                    onTap={() => setSelectedId(selection.id)}
                  />
                  <Text
                    name="selection-text"
                    x={selection.x}
                    y={selection.y - 18}
                    text={selection.name}
                    fontSize={14}
                    fill={selectedId === selection.id ? '#3b82f6' : '#10b981'}
                    fontStyle="bold"
                  />
                  <Text
                    name="selection-text"
                    x={selection.x}
                    y={selection.y + selection.height + 2}
                    text={`${selection.width}×${selection.height}`}
                    fontSize={11}
                    fill="#666"
                  />
                </React.Fragment>
              ))}

              {/* Current drawing rectangle */}
              {isDrawing && currentRect && (
                <Rect
                  x={currentRect.x}
                  y={currentRect.y}
                  width={currentRect.width}
                  height={currentRect.height}
                  stroke="#ef4444"
                  strokeWidth={2}
                  dash={[5, 5]}
                  fill="rgba(239, 68, 68, 0.1)"
                />
              )}
            </Layer>
          </Stage>
        </div>

        {/* Sidebar - Sprite List */}
        <div className="w-80 bg-white border-l border-gray-300 flex flex-col">
          <div className="p-3 border-b border-gray-200">
            <h3 className="font-semibold text-gray-800">Sprite List</h3>
            <p className="text-xs text-gray-500 mt-1">
              Click a sprite to select, or draw a new rectangle on the canvas
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {selections.length === 0 ? (
              <div className="p-6 text-center text-gray-400">
                <svg className="w-16 h-16 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-sm">No sprites defined</p>
                <p className="text-xs mt-1">Draw rectangles to select sprites</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {selections.map((selection) => (
                  <div
                    key={selection.id}
                    className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                      selectedId === selection.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedId(selection.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <input
                          type="text"
                          value={selection.name}
                          onChange={(e) => updateSpriteName(selection.id, e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 text-sm font-medium bg-transparent border border-transparent hover:border-gray-300 rounded focus:outline-none focus:border-blue-500"
                          placeholder="Sprite name"
                        />
                        <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                          <div>Position: ({selection.x}, {selection.y})</div>
                          <div>Size: {selection.width} × {selection.height}</div>
                        </div>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteSelection(selection.id);
                        }}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="Delete sprite"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

