/**
 * Export Progress Component
 * Shows export progress and handles download
 */

import React, { useEffect, useState } from 'react'
import { Check, Download, AlertCircle, Loader2, FileArchive } from 'lucide-react'
import type { 
  ExportFormat, 
  ExportProgress as ExportProgressType, 
  ExportResult,
  ExportOptions
} from '../../types/export'
import { genericExporter } from '../../utils/exporters/genericExporter'
import { godotExporter } from '../../utils/exporters/godotExporter'
import { createZipFromFiles, downloadBlob } from '../../utils/exporters/baseExporter'

interface ExportProgressProps {
  canvasId: string
  canvasName: string
  format: ExportFormat
  options?: ExportOptions
  onComplete: () => void
  onCancel: () => void
}

export default function ExportProgress({ 
  canvasId, 
  canvasName, 
  format, 
  options,
  onComplete, 
  onCancel 
}: ExportProgressProps) {
  const [progress, setProgress] = useState<ExportProgressType>({
    stage: 'validating',
    progress: 0,
    message: 'Initializing export...',
    warnings: [],
    errors: []
  })
  const [result, setResult] = useState<ExportResult | null>(null)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    performExport()
  }, [])

  const performExport = async () => {
    try {
      let exporter
      let exportOptions: ExportOptions

      // Get exporter and options for format
      switch (format) {
        case 'generic':
          exporter = genericExporter
          exportOptions = options || genericExporter.getDefaultOptions()
          break
        case 'godot':
          exporter = godotExporter
          exportOptions = options || godotExporter.getDefaultOptions()
          break
        default:
          throw new Error(`Unsupported export format: ${format}`)
      }

      // Perform export with progress callback
      const exportResult = await exporter.export(
        canvasId,
        exportOptions,
        (progressUpdate) => {
          setProgress(progressUpdate)
        }
      )

      setResult(exportResult)

      if (!exportResult.success) {
        setProgress({
          stage: 'error',
          progress: 0,
          message: 'Export failed',
          warnings: exportResult.warnings,
          errors: ['Export failed. See errors below.']
        })
      }
    } catch (error) {
      console.error('Export error:', error)
      setProgress({
        stage: 'error',
        progress: 0,
        message: 'Export failed',
        warnings: [],
        errors: [error instanceof Error ? error.message : 'Unknown error']
      })
    }
  }

  const handleDownload = async () => {
    if (!result || !result.success) return

    setIsDownloading(true)

    try {
      // Create ZIP file from export files
      const zipBlob = await createZipFromFiles(result.files)
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0]
      const formatName = format === 'generic' ? 'json' : format
      const filename = `${canvasName}_${formatName}_${timestamp}.zip`

      // Download
      downloadBlob(zipBlob, filename)

      // Small delay for user feedback
      setTimeout(() => {
        setIsDownloading(false)
      }, 500)
    } catch (error) {
      console.error('Download error:', error)
      alert('Failed to create download. Please try again.')
      setIsDownloading(false)
    }
  }

  const handleClose = () => {
    if (result?.success) {
      onComplete()
    } else {
      onCancel()
    }
  }

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case 'complete':
        return <Check className="w-5 h-5 text-green-600" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-600" />
      default:
        return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    }
  }

  const getStageColor = (stage: string) => {
    switch (stage) {
      case 'complete':
        return 'text-green-600 dark:text-green-400'
      case 'error':
        return 'text-red-600 dark:text-red-400'
      default:
        return 'text-blue-600 dark:text-blue-400'
    }
  }

  return (
    <div className="space-y-6">
      {/* Progress indicator */}
      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 space-y-4">
        <div className="flex items-center gap-3">
          {getStageIcon(progress.stage)}
          <div className="flex-1">
            <div className={`text-sm font-medium ${getStageColor(progress.stage)}`}>
              {progress.message}
            </div>
          </div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-300">
            {progress.progress}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full transition-all duration-300 ${
              progress.stage === 'complete'
                ? 'bg-green-600'
                : progress.stage === 'error'
                ? 'bg-red-600'
                : 'bg-blue-600'
            }`}
            style={{ width: `${progress.progress}%` }}
          />
        </div>

        {/* Stage description */}
        <div className="text-xs text-gray-600 dark:text-gray-400">
          {progress.stage === 'validating' && 'Checking canvas data for export compatibility...'}
          {progress.stage === 'collecting' && 'Gathering objects, assets, and tilemap data...'}
          {progress.stage === 'converting' && `Converting to ${format} format...`}
          {progress.stage === 'packaging' && 'Creating export files and packaging...'}
          {progress.stage === 'complete' && '🎉 Export completed successfully!'}
          {progress.stage === 'error' && 'Export failed. Please check errors below.'}
        </div>
      </div>

      {/* Warnings */}
      {progress.warnings.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-yellow-900 dark:text-yellow-300 mb-2">
                Warnings
              </h4>
              <ul className="space-y-1">
                {progress.warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-yellow-800 dark:text-yellow-200">
                    • {warning}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Errors */}
      {progress.errors.length > 0 && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-red-900 dark:text-red-300 mb-2">
                Errors
              </h4>
              <ul className="space-y-1">
                {progress.errors.map((error, index) => (
                  <li key={index} className="text-sm text-red-800 dark:text-red-200">
                    • {error}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Success state with download */}
      {progress.stage === 'complete' && result?.success && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-3">
            <FileArchive className="w-8 h-8 text-green-600 dark:text-green-400" />
            <div>
              <h3 className="text-lg font-semibold text-green-900 dark:text-green-300">
                Export Ready!
              </h3>
              <p className="text-sm text-green-700 dark:text-green-400">
                Your canvas has been exported successfully. {result.files.length} file(s) ready for download.
              </p>
            </div>
          </div>

          {/* Download button */}
          <button
            onClick={handleDownload}
            disabled={isDownloading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white font-semibold rounded-lg transition-colors"
          >
            {isDownloading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Preparing download...
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                Download ZIP ({result.files.length} files)
              </>
            )}
          </button>

          {/* Instructions preview */}
          {result.instructions && (
            <details className="text-sm">
              <summary className="cursor-pointer text-green-800 dark:text-green-300 font-medium hover:text-green-900 dark:hover:text-green-200">
                View import instructions
              </summary>
              <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded border border-green-200 dark:border-green-800">
                <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap font-mono">
                  {result.instructions.substring(0, 500)}...
                </pre>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                  Full instructions included in README.md file
                </p>
              </div>
            </details>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        {progress.stage === 'complete' && result?.success ? (
          <button
            onClick={handleClose}
            className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
          >
            Close
          </button>
        ) : progress.stage === 'error' ? (
          <>
            <button
              onClick={onCancel}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-900 dark:text-white font-semibold rounded-lg transition-colors"
            >
              Back
            </button>
            <button
              onClick={performExport}
              className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
            >
              Retry Export
            </button>
          </>
        ) : (
          <button
            disabled
            className="flex-1 px-6 py-3 bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 font-semibold rounded-lg cursor-not-allowed"
          >
            Exporting...
          </button>
        )}
      </div>
    </div>
  )
}

