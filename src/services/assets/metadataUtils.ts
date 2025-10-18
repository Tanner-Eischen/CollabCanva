import type { SpriteSelection, SpriteSheetMetadata, TilesetMetadata, TileSemanticGroup } from '../../types/asset'

export type SpriteRenamingSummary = {
  renamedCount: number
  total: number
  sampleNames: string[]
}

export function cloneTilesetMetadata(metadata: TilesetMetadata): TilesetMetadata {
  const tileGroups = metadata.tileGroups
    ? Object.fromEntries(
        Object.entries(metadata.tileGroups).map(([key, group]) => [
          key,
          {
            ...group,
            tiles: { ...group.tiles },
            variants: [...(group.variants || [])],
          },
        ]),
      )
    : undefined

  return {
    ...metadata,
    namedTiles: metadata.namedTiles ? { ...metadata.namedTiles } : undefined,
    tileGroups,
  }
}

export function cloneSpriteSheetMetadata(metadata: SpriteSheetMetadata): SpriteSheetMetadata {
  return {
    ...metadata,
    spriteSelections: metadata.spriteSelections?.map(selection => ({ ...selection })) || [],
  }
}

export function buildTileSemanticGroups(
  namedTiles: Record<string, number | string>,
  context: Pick<TilesetMetadata, 'materials' | 'themes' | 'autoTileSystem'>,
): Record<string, TileSemanticGroup> {
  const groups: Record<string, TileSemanticGroup> = {}
  const materials = context.materials || []
  const themes = context.themes || []

  for (const [rawName, rawIndex] of Object.entries(namedTiles)) {
    const tileIndex = typeof rawIndex === 'number' ? rawIndex : parseInt(rawIndex as string, 10)
    if (Number.isNaN(tileIndex)) {
      continue
    }

    const normalizedName = rawName.trim()
    if (!normalizedName) {
      continue
    }

    const lowerName = normalizedName.toLowerCase()
    const nameMatch = lowerName.match(/^([a-z0-9]+)[._-]?(.*)$/)
    if (!nameMatch) {
      continue
    }

    const groupKey = nameMatch[1]
    const remainder = nameMatch[2]
    const variant = remainder ? remainder.replace(/[.\s-]+/g, '_') : 'base'

    if (!groups[groupKey]) {
      const matchingMaterials = materials.filter(material => {
        const materialKey = material.toLowerCase()
        return materialKey === groupKey || groupKey.includes(materialKey) || materialKey.includes(groupKey)
      })

      const matchingThemes = themes.filter(theme => {
        const themeKey = theme.toLowerCase()
        return themeKey === groupKey || groupKey.includes(themeKey) || themeKey.includes(groupKey)
      })

      const label = groupKey.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase())

      groups[groupKey] = {
        label,
        description: context.autoTileSystem
          ? `${label} auto-tiling variants (${context.autoTileSystem})`
          : `${label} tile variants`,
        autoTileSystem: context.autoTileSystem,
        materials: matchingMaterials.length > 0 ? matchingMaterials : undefined,
        themes: matchingThemes.length > 0 ? matchingThemes : undefined,
        tiles: {},
        variants: [],
        tileCount: 0,
      }
    }

    const group = groups[groupKey]
    const normalizedVariant = variant || groupKey
    group.tiles[normalizedVariant] = tileIndex
    if (!group.variants.includes(normalizedVariant)) {
      group.variants.push(normalizedVariant)
    }
    group.tileCount += 1
  }

  Object.entries(groups).forEach(([groupKey, group]) => {
    group.variants.sort()

    if (!group.materials && materials.length === 1) {
      group.materials = materials
    }

    if (!group.themes && themes.length === 1) {
      group.themes = themes
    }

    if (!group.description) {
      group.description = `${group.label || groupKey} tile variants`
    }
  })

  return groups
}

export function applySemanticNamingToSprites(
  spriteSelections: SpriteSelection[],
  namedTiles: Record<string, number | string>,
  baseFileName: string,
): SpriteRenamingSummary {
  const indexToName: Record<number, string> = {}

  for (const [semanticName, index] of Object.entries(namedTiles)) {
    const numIndex = typeof index === 'number' ? index : parseInt(index, 10)
    if (!Number.isNaN(numIndex)) {
      const cleanName = semanticName
        .replace(/\./g, '_')
        .replace(/\s+/g, '_')
        .toLowerCase()
      indexToName[numIndex] = cleanName
    }
  }

  let renamedCount = 0

  spriteSelections.forEach((sprite, index) => {
    if (indexToName[index]) {
      sprite.name = `${baseFileName}_${indexToName[index]}`
      renamedCount += 1
    }
  })

  return {
    renamedCount,
    total: spriteSelections.length,
    sampleNames: spriteSelections.slice(0, 10).map(selection => selection.name),
  }
}
