/**
 * Export Modal Component
 * Main modal for selecting export format and configuring options
 */

import React, { useState } from 'react'
import { X, FileJson, Code, Download, FileText } from 'lucide-react'
import type { ExportFormat } from '../../types/export'
import ExportConfigPanel from './ExportConfigPanel'
import ExportProgress from './ExportProgress'

interface ExportModalProps {
  isOpen: boolean
  onClose: () => void
  canvasId: string
  canvasName: string
}

interface ExportFormatOption {
  format: ExportFormat
  name: string
  description: string
  icon: React.ReactNode
  popular?: boolean
  beta?: boolean
}

const EXPORT_FORMATS: ExportFormatOption[] = [
  {
    format: 'generic',
    name: 'Generic JSON',
    description: 'Engine-agnostic JSON format. Works with any game engine.',
    icon: <FileJson className="w-8 h-8" />,
    popular: true
  },
  {
    format: 'godot',
    name: 'Godot Engine',
    description: 'Export to Godot .tscn scene format (3.x and 4.x)',
    icon: <Code className="w-8 h-8" />,
    popular: true
  },
  {
    format: 'unity',
    name: 'Unity',
    description: 'Export to Unity prefab format',
    icon: <FileText className="w-8 h-8" />,
    beta: true
  },
  {
    format: 'phaser',
    name: 'Phaser',
    description: 'Export to Phaser 3 JSON scene format',
    icon: <Download className="w-8 h-8" />,
    beta: true
  }
]

export default function ExportModal({ isOpen, onClose, canvasId, canvasName }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat | null>(null)
  const [isExporting, setIsExporting] = useState(false)

  if (!isOpen) return null

  const handleFormatSelect = (format: ExportFormat) => {
    // Check if format is available
    const formatOption = EXPORT_FORMATS.find(f => f.format === format)
    if (formatOption?.beta) {
      alert('This export format is coming soon! For now, use Generic JSON export.')
      return
    }
    
    setSelectedFormat(format)
  }

  const handleBack = () => {
    if (!isExporting) {
      setSelectedFormat(null)
    }
  }

  const handleStartExport = () => {
    setIsExporting(true)
  }

  const handleExportComplete = () => {
    setIsExporting(false)
    setSelectedFormat(null)
  }

  const handleClose = () => {
    if (!isExporting) {
      setSelectedFormat(null)
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {selectedFormat ? 'Export Configuration' : 'Export Canvas'}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {selectedFormat 
                ? `Configure ${EXPORT_FORMATS.find(f => f.format === selectedFormat)?.name} export options`
                : `Choose your target game engine or export format`
              }
            </p>
          </div>
          <button
            onClick={handleClose}
            disabled={isExporting}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Close modal"
          >
            <X className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!selectedFormat ? (
            /* Format Selection Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {EXPORT_FORMATS.map((formatOption) => (
                <button
                  key={formatOption.format}
                  onClick={() => handleFormatSelect(formatOption.format)}
                  className={`
                    relative p-6 border-2 rounded-lg text-left transition-all hover:shadow-lg
                    ${formatOption.beta 
                      ? 'border-gray-300 dark:border-gray-600 opacity-75 cursor-not-allowed' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500 dark:hover:border-blue-400'
                    }
                  `}
                  disabled={formatOption.beta}
                >
                  {/* Popular badge */}
                  {formatOption.popular && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold rounded">
                      POPULAR
                    </div>
                  )}

                  {/* Beta badge */}
                  {formatOption.beta && (
                    <div className="absolute top-3 right-3 px-2 py-1 bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs font-semibold rounded">
                      COMING SOON
                    </div>
                  )}

                  {/* Icon */}
                  <div className="text-blue-600 dark:text-blue-400 mb-4">
                    {formatOption.icon}
                  </div>

                  {/* Name */}
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    {formatOption.name}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {formatOption.description}
                  </p>

                  {/* Features list */}
                  <div className="mt-4 space-y-1">
                    {formatOption.format === 'generic' && (
                      <>
                        <div className="text-xs text-green-600 dark:text-green-400">✓ Works with any engine</div>
                        <div className="text-xs text-green-600 dark:text-green-400">✓ Complete canvas data</div>
                        <div className="text-xs text-green-600 dark:text-green-400">✓ JSON schema included</div>
                      </>
                    )}
                    {formatOption.format === 'godot' && (
                      <>
                        <div className="text-xs text-green-600 dark:text-green-400">✓ Godot 3.x and 4.x</div>
                        <div className="text-xs text-green-600 dark:text-green-400">✓ TileMap support</div>
                        <div className="text-xs text-green-600 dark:text-green-400">✓ Ready-to-use scenes</div>
                      </>
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : isExporting ? (
            /* Export Progress */
            <ExportProgress
              canvasId={canvasId}
              canvasName={canvasName}
              format={selectedFormat}
              onComplete={handleExportComplete}
              onCancel={handleBack}
            />
          ) : (
            /* Configuration Panel */
            <ExportConfigPanel
              canvasId={canvasId}
              format={selectedFormat}
              onExport={handleStartExport}
              onBack={handleBack}
            />
          )}
        </div>

        {/* Footer */}
        {!selectedFormat && !isExporting && (
          <div className="p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <div className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
              <div className="text-blue-600 dark:text-blue-400 mt-0.5">ℹ️</div>
              <div>
                <strong>Recommendation:</strong> For maximum compatibility, export to <strong>Generic JSON</strong> first. 
                You can always re-export to engine-specific formats later.
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

