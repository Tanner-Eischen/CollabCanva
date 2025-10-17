/**
 * Export Configuration Panel Component
 * Configure export options for selected format
 */

import React, { useState } from 'react'
import { ArrowLeft, Settings } from 'lucide-react'
import type { 
  ExportFormat, 
  ExportOptions, 
  GenericExportOptions, 
  GodotExportOptions 
} from '../../types/export'
import { genericExporter } from '../../utils/exporters/genericExporter'
import { godotExporter } from '../../utils/exporters/godotExporter'

interface ExportConfigPanelProps {
  canvasId: string
  format: ExportFormat
  onExport: (options: ExportOptions) => void
  onBack: () => void
}

export default function ExportConfigPanel({ 
  canvasId, 
  format, 
  onExport, 
  onBack 
}: ExportConfigPanelProps) {
  // Get default options based on format
  const getDefaultOptions = (): ExportOptions => {
    switch (format) {
      case 'generic':
        return genericExporter.getDefaultOptions()
      case 'godot':
        return godotExporter.getDefaultOptions()
      default:
        return genericExporter.getDefaultOptions()
    }
  }

  const [options, setOptions] = useState<ExportOptions>(getDefaultOptions())

  const updateOption = (key: string, value: any) => {
    setOptions(prev => ({ ...prev, [key]: value }))
  }

  const handleExport = () => {
    onExport(options)
  }

  // Get supported features for current format
  const getSupportedFeatures = (): string[] => {
    switch (format) {
      case 'generic':
        return genericExporter.getSupportedFeatures()
      case 'godot':
        return godotExporter.getSupportedFeatures()
      default:
        return []
    }
  }

  return (
    <div className="space-y-6">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to format selection
      </button>

      {/* Configuration options */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-6">
        <div className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-white">
          <Settings className="w-5 h-5" />
          Export Options
        </div>

        {/* Common options */}
        <div className="space-y-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeAssets}
              onChange={(e) => updateOption('includeAssets', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Include Assets
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Embed referenced images in export (increases file size)
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.prettyPrint}
              onChange={(e) => updateOption('prettyPrint', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Pretty Print JSON
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Format JSON for readability (recommended for debugging)
              </div>
            </div>
          </label>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={options.includeDocumentation}
              onChange={(e) => updateOption('includeDocumentation', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">
                Include Documentation
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-400">
                Add README with import instructions
              </div>
            </div>
          </label>
        </div>

        {/* Format-specific options */}
        {format === 'generic' && (
          <GenericOptions 
            options={options as GenericExportOptions} 
            updateOption={updateOption} 
          />
        )}

        {format === 'godot' && (
          <GodotOptions 
            options={options as GodotExportOptions} 
            updateOption={updateOption} 
          />
        )}
      </div>

      {/* Supported features */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">
          Supported Features
        </h4>
        <ul className="space-y-1">
          {getSupportedFeatures().map((feature, index) => (
            <li key={index} className="text-sm text-blue-800 dark:text-blue-200 flex items-start gap-2">
              <span className="text-green-600 dark:text-green-400 mt-0.5">✓</span>
              <span>{feature}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Export button */}
      <button
        onClick={handleExport}
        className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
      >
        Start Export
      </button>
    </div>
  )
}

/**
 * Generic format specific options
 */
function GenericOptions({ 
  options, 
  updateOption 
}: { 
  options: GenericExportOptions
  updateOption: (key: string, value: any) => void
}) {
  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        Generic JSON Options
      </h4>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={options.includeSchema}
          onChange={(e) => updateOption('includeSchema', e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            Include JSON Schema
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Add schema.json file for format documentation
          </div>
        </div>
      </label>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Coordinate System
        </label>
        <select
          value={options.coordinateSystem}
          onChange={(e) => updateOption('coordinateSystem', e.target.value as 'top-left' | 'center')}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="top-left">Top-Left Origin (most engines)</option>
          <option value="center">Center Origin (some physics engines)</option>
        </select>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Choose coordinate system for your target engine
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer opacity-50">
        <input
          type="checkbox"
          checked={options.exportPNGLayers}
          onChange={(e) => updateOption('exportPNGLayers', e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
          disabled
        />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            Export PNG Layers (Coming Soon)
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Export each layer as separate PNG image
          </div>
        </div>
      </label>
    </div>
  )
}

/**
 * Godot format specific options
 */
function GodotOptions({ 
  options, 
  updateOption 
}: { 
  options: GodotExportOptions
  updateOption: (key: string, value: any) => void 
}) {
  return (
    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-700">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
        Godot Engine Options
      </h4>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Target Godot Version
        </label>
        <select
          value={options.targetVersion}
          onChange={(e) => updateOption('targetVersion', e.target.value as '3.x' | '4.x')}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="4.x">Godot 4.x (Recommended)</option>
          <option value="3.x">Godot 3.x</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Node Naming Scheme
        </label>
        <select
          value={options.nodeNamingScheme}
          onChange={(e) => updateOption('nodeNamingScheme', e.target.value as 'descriptive' | 'simple')}
          className="w-full px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        >
          <option value="descriptive">Descriptive (e.g., "PlayerSprite_0")</option>
          <option value="simple">Simple (e.g., "Rectangle_0")</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-900 dark:text-white mb-2">
          Pixels Per Unit: {options.pixelsPerUnit}
        </label>
        <input
          type="range"
          min="0.1"
          max="5"
          step="0.1"
          value={options.pixelsPerUnit}
          onChange={(e) => updateOption('pixelsPerUnit', parseFloat(e.target.value))}
          className="w-full"
        />
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          Scaling factor for object sizes (1 = no scaling)
        </p>
      </div>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={options.includePhysics}
          onChange={(e) => updateOption('includePhysics', e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            Include Physics Nodes
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Add CollisionShape2D nodes (requires manual configuration)
          </div>
        </div>
      </label>

      <label className="flex items-center gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={options.includeAutoTiles}
          onChange={(e) => updateOption('includeAutoTiles', e.target.checked)}
          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
        />
        <div>
          <div className="text-sm font-medium text-gray-900 dark:text-white">
            Include Auto-Tile Configuration
          </div>
          <div className="text-xs text-gray-600 dark:text-gray-400">
            Export tilemap auto-tiling rules (if present)
          </div>
        </div>
      </label>
    </div>
  )
}

