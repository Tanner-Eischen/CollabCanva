/**
 * Cleanup Legacy Tileset Assets
 * ---------------------------------------------
 * One-time utility that scans the Realtime Database `/assets` tree
 * and removes legacy asset records that were incorrectly stored with
 * `type: "tileset"`.
 *
 * Manual run instructions:
 *   1. Start the dev server (`npm run dev`) and open the canvas app.
 *   2. Open the browser developer console.
 *   3. Run `await window.cleanupTilesets(true)` for a dry run preview.
 *   4. Run `await window.cleanupTilesets(false)` to actually delete the legacy entries.
 *      A confirmation dialog will appear before destructive deletes.
 */

import { ref as dbRef, get, remove } from 'firebase/database'
import { db } from '../services/firebase'

type LegacyAssetRecord = {
  id?: string
  name?: string
  type?: string
  userId?: string
  [key: string]: unknown
}

interface CleanupCandidate {
  path: string
  key: string
  record: LegacyAssetRecord
}

interface CleanupSummary {
  scanned: number
  deleted: number
  dryRun: boolean
  errors: string[]
}

function collectCandidates(node: unknown, path: string[] = []): CleanupCandidate[] {
  if (!node || typeof node !== 'object') {
    return []
  }

  const record = node as Record<string, unknown>

  if (typeof record.type === 'string') {
    const legacyType = record.type.toLowerCase()
    if (legacyType === 'tileset') {
      return [
        {
          path: ['assets', ...path].join('/'),
          key: path[path.length - 1] ?? '(unknown)',
          record: record as LegacyAssetRecord,
        },
      ]
    }
    return []
  }

  const results: CleanupCandidate[] = []

  for (const [childKey, childValue] of Object.entries(record)) {
    if (childValue && typeof childValue === 'object') {
      results.push(...collectCandidates(childValue, [...path, childKey]))
    }
  }

  return results
}

export async function cleanupLegacyTilesetAssets(dryRun: boolean = true): Promise<CleanupSummary> {
  console.log(`🧹 Starting legacy tileset cleanup (${dryRun ? 'dry run' : 'destructive'})`)

  const assetsRef = dbRef(db, 'assets')
  const snapshot = await get(assetsRef)

  if (!snapshot.exists()) {
    console.log('✅ No assets found in database — nothing to clean up.')
    return { scanned: 0, deleted: 0, dryRun, errors: [] }
  }

  const root = snapshot.val()
  const candidates = collectCandidates(root)

  if (candidates.length === 0) {
    console.log('✅ No legacy `tileset` asset entries detected.')
    return { scanned: 0, deleted: 0, dryRun, errors: [] }
  }

  console.group(`📊 Found ${candidates.length} legacy tileset entr${candidates.length === 1 ? 'y' : 'ies'}:`)
  for (const candidate of candidates) {
    const label = candidate.record.name ?? candidate.key
    const owner = candidate.record.userId ? ` (user: ${candidate.record.userId})` : ''
    console.log(`• ${label} -> ${candidate.path}${owner}`)
  }
  console.groupEnd()

  if (dryRun) {
    console.log('🔍 Dry run complete — no deletions performed.')
    return { scanned: candidates.length, deleted: 0, dryRun, errors: [] }
  }

  if (typeof window !== 'undefined') {
    const confirmed = window.confirm(
      `⚠️ This will permanently delete ${candidates.length} legacy tileset entr${
        candidates.length === 1 ? 'y' : 'ies'
      }.\n\nDo you want to proceed?`
    )
    if (!confirmed) {
      console.log('❌ Cleanup cancelled by user.')
      return { scanned: candidates.length, deleted: 0, dryRun, errors: [] }
    }
  }

  const errors: string[] = []
  let deleted = 0

  for (const candidate of candidates) {
    try {
      await remove(dbRef(db, candidate.path))
      deleted += 1
      console.log(`✅ Deleted ${candidate.path}`)
    } catch (error) {
      const message = `Failed to delete ${candidate.path}: ${error}`
      console.error(`❌ ${message}`)
      errors.push(message)
    }
  }

  if (errors.length === 0) {
    console.log('✨ Legacy tileset cleanup complete without errors.')
  } else {
    console.warn(`⚠️ Cleanup finished with ${errors.length} error(s). See logs above.`)
  }

  return { scanned: candidates.length, deleted, dryRun, errors }
}

if (typeof window !== 'undefined') {
  ;(window as any).cleanupTilesets = cleanupLegacyTilesetAssets
  console.log('💡 Tileset cleanup helper loaded. Run window.cleanupTilesets(true) to preview, window.cleanupTilesets(false) to delete.')
}

export default cleanupLegacyTilesetAssets
