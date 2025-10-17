/**
 * Generator Settings Panel
 * UI for procedural generation with live preview
 * PR-35: Procedural Generation Tools (PRD 5)
 * 
 * Follows pattern from AIQuickActionsPanel and LayerPanelTilemap
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import type { GeneratorMode, GeneratorConfig, GeneratorParams } from '../../services/tilemap/tileGenerators'
import {
  GENERATORS,
  getAllGenerators,
  recommendGenerator,
  generatePreview,
  type GenerationResult,
} from '../../services/tilemap/tileGenerators'
import { DEFAULT_PERLIN_PARAMS } from '../../algorithms/perlinNoise'
import { DEFAULT_CAVE_PARAMS, DEFAULT_DUNGEON_PARAMS } from '../../algorithms/cellularAutomata'
import { DEFAULT_PATH_PARAMS, DEFAULT_RIVER_PARAMS } from '../../algorithms/randomWalk'

interface GeneratorSettingsPanelProps {
  onGenerate: (result: GenerationResult, layerId?: string) => void
  onClose?: () => void
  layerId?: string
  width: number
  height: number
}

export default function GeneratorSettingsPanel({
  onGenerate,
  onClose,
  layerId,
  width,
  height,
}: GeneratorSettingsPanelProps) {
  const [selectedMode, setSelectedMode] = useState<GeneratorMode>('terrain')
  const [isGenerating, setIsGenerating] = useState(false)
  const [preview, setPreview] = useState<GenerationResult | null>(null)
  const [showPreview, setShowPreview] = useState(false)

  // Get current generator config
  const config = useMemo(() => GENERATORS[selectedMode], [selectedMode])

  // Dynamic parameters state based on selected generator
  const [params, setParams] = useState<any>(config.defaultParams)

  // Update params when generator changes
  useEffect(() => {
    setParams({ ...config.defaultParams })
  }, [selectedMode, config.defaultParams])

  // Generate preview
  const handleGeneratePreview = useCallback(async () => {
    if (!config.previewable) return

    setIsGenerating(true)
    try {
      const generatorParams: GeneratorParams = {
        type: config.type,
        params,
        ...(config.mode === 'cave' || config.mode === 'dungeon' ? { mode: config.mode } : {}),
        ...(config.mode === 'path' || config.mode === 'river' ? { mode: config.mode } : {}),
      } as any

      const result = await generatePreview(generatorParams, { width: 32, height: 32 })
      setPreview(result)
      setShowPreview(true)
    } catch (error) {
      console.error('Preview generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [config, params])

  // Generate full tilemap
  const handleGenerate = useCallback(async () => {
    setIsGenerating(true)
    try {
      const generatorParams: GeneratorParams = {
        type: config.type,
        params,
        ...(config.mode === 'cave' || config.mode === 'dungeon' ? { mode: config.mode } : {}),
        ...(config.mode === 'path' || config.mode === 'river' ? { mode: config.mode } : {}),
      } as any

      const { generateTilemap } = await import('../../services/tilemap/tileGenerators')
      const result = await generateTilemap(generatorParams, width, height)
      onGenerate(result, layerId)
    } catch (error) {
      console.error('Generation failed:', error)
    } finally {
      setIsGenerating(false)
    }
  }, [config, params, width, height, layerId, onGenerate])

  const generators = getAllGenerators()

  return (
    <div className="fixed right-4 top-20 w-80 z-40 animate-slide-in-right">
      <div className="bg-gradient-to-br from-slate-900/95 to-slate-800/95 backdrop-blur-md rounded-lg shadow-2xl border border-white/10 overflow-hidden max-h-[calc(100vh-120px)]">
        {/* Header */}
        <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{config.icon}</span>
            <h3 className="text-sm font-semibold text-white">Procedural Generator</h3>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-6 h-6 rounded flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-all"
            >
              ✕
            </button>
          )}
        </div>

        <div className="overflow-y-auto custom-scrollbar max-h-[calc(100vh-180px)]">
          {/* Generator Selection */}
          <div className="p-4 border-b border-white/10">
            <label className="block text-xs font-medium text-white/70 mb-2">Generator Type</label>
            <div className="grid grid-cols-2 gap-2">
              {generators.map((gen) => (
                <button
                  key={gen.mode}
                  onClick={() => setSelectedMode(gen.mode)}
                  className={`
                    px-3 py-2 rounded-lg text-left text-xs transition-all
                    ${
                      selectedMode === gen.mode
                        ? 'bg-blue-500 text-white'
                        : 'bg-white/10 text-white/70 hover:bg-white/20'
                    }
                  `}
                >
                  <div className="flex items-center gap-2">
                    <span>{gen.icon}</span>
                    <span className="font-medium">{gen.name.split(' ')[0]}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="px-4 py-3 bg-black/20">
            <p className="text-xs text-white/70">{config.description}</p>
          </div>

          {/* Parameters */}
          <div className="p-4 space-y-3">
            <h4 className="text-xs font-semibold text-white mb-2">Parameters</h4>

            {/* Perlin Parameters */}
            {config.type === 'perlin' && (
              <>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Scale: {params.scale?.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.01"
                    max="0.5"
                    step="0.01"
                    value={params.scale || 0.1}
                    onChange={(e) => setParams({ ...params, scale: parseFloat(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Octaves: {params.octaves || 4}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="8"
                    step="1"
                    value={params.octaves || 4}
                    onChange={(e) => setParams({ ...params, octaves: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Persistence: {params.persistence?.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={params.persistence || 0.5}
                    onChange={(e) =>
                      setParams({ ...params, persistence: parseFloat(e.target.value) })
                    }
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
              </>
            )}

            {/* Cellular Automata Parameters */}
            {config.type === 'cellular' && (
              <>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Initial Density: {params.initialDensity?.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0.3"
                    max="0.7"
                    step="0.05"
                    value={params.initialDensity || 0.45}
                    onChange={(e) =>
                      setParams({ ...params, initialDensity: parseFloat(e.target.value) })
                    }
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Iterations: {params.iterations || 5}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={params.iterations || 5}
                    onChange={(e) =>
                      setParams({ ...params, iterations: parseInt(e.target.value) })
                    }
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
              </>
            )}

            {/* Random Walk Parameters */}
            {config.type === 'randomWalk' && (
              <>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Steps: {params.steps || 100}
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    step="10"
                    value={params.steps || 100}
                    onChange={(e) => setParams({ ...params, steps: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Width: {params.width || 2}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="1"
                    value={params.width || 2}
                    onChange={(e) => setParams({ ...params, width: parseInt(e.target.value) })}
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-white/70 mb-1">
                    Turn Probability: {params.turnProbability?.toFixed(2)}
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="0.5"
                    step="0.05"
                    value={params.turnProbability || 0.2}
                    onChange={(e) =>
                      setParams({ ...params, turnProbability: parseFloat(e.target.value) })
                    }
                    className="w-full h-2 rounded-lg appearance-none cursor-pointer bg-white/10"
                  />
                </div>
              </>
            )}

            {/* Seed */}
            <div>
              <label className="block text-[10px] text-white/70 mb-1">Seed (Random)</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={params.seed || 0}
                  onChange={(e) => setParams({ ...params, seed: parseInt(e.target.value) })}
                  className="flex-1 px-2 py-1 text-xs rounded bg-white/10 text-white border border-white/20 focus:outline-none focus:ring-1 focus:ring-blue-400"
                />
                <button
                  onClick={() => setParams({ ...params, seed: Math.floor(Math.random() * 1000000) })}
                  className="px-3 py-1 text-xs rounded bg-white/10 hover:bg-white/20 text-white transition-all"
                >
                  🎲
                </button>
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {config.previewable && showPreview && preview && (
            <div className="p-4 border-t border-white/10 bg-black/20">
              <h4 className="text-xs font-semibold text-white mb-2">Preview (32×32)</h4>
              <div className="bg-slate-700 rounded p-2">
                <div className="text-[10px] text-white/50 text-center">
                  {preview.metadata.tileCount} tiles generated
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-white/10 bg-black/20 space-y-2">
          {config.previewable && (
            <button
              onClick={handleGeneratePreview}
              disabled={isGenerating}
              className="w-full px-4 py-2 text-sm rounded-lg bg-white/10 hover:bg-white/20 text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '⏳ Generating Preview...' : '👁️ Preview'}
            </button>
          )}
          <button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full px-4 py-2 text-sm rounded-lg bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '⏳ Generating...' : '✨ Generate'}
          </button>
        </div>
      </div>
    </div>
  )
}

