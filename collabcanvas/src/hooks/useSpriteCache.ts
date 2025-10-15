/**
 * Sprite Cache Hook
 * Preloads and caches tileset sprite sheets for optimal performance
 */

import { useState, useEffect, useRef } from 'react'

/**
 * Sprite loading state
 */
export interface SpriteLoadState {
  loaded: number
  total: number
  isLoading: boolean
  errors: string[]
}

/**
 * Cache of loaded sprite sheet images
 * Shared across all components
 */
const spriteImageCache = new Map<string, HTMLImageElement>()
const loadingPromises = new Map<string, Promise<HTMLImageElement>>()

/**
 * Load a single sprite sheet image
 * 
 * @param url Path to sprite sheet
 * @returns Promise that resolves to loaded image
 */
function loadSpriteImage(url: string): Promise<HTMLImageElement> {
  // Check if already cached
  const cached = spriteImageCache.get(url)
  if (cached) {
    return Promise.resolve(cached)
  }
  
  // Check if currently loading
  const loading = loadingPromises.get(url)
  if (loading) {
    return loading
  }
  
  // Start loading
  const promise = new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    
    img.onload = () => {
      spriteImageCache.set(url, img)
      loadingPromises.delete(url)
      resolve(img)
    }
    
    img.onerror = (error) => {
      loadingPromises.delete(url)
      reject(new Error(`Failed to load sprite: ${url}`))
    }
    
    // Set crossOrigin for potential CDN hosting
    img.crossOrigin = 'anonymous'
    img.src = url
  })
  
  loadingPromises.set(url, promise)
  return promise
}

/**
 * Preload multiple sprite sheets
 * 
 * @param urls Array of sprite sheet URLs
 * @returns Promise that resolves when all loaded
 */
export async function preloadSprites(urls: string[]): Promise<void> {
  const promises = urls.map((url) => loadSpriteImage(url))
  await Promise.all(promises)
}

/**
 * Hook to load and cache sprite sheets
 * 
 * @param spriteUrls Array of sprite sheet URLs to preload
 * @returns Tuple of [loadState, getSprite function]
 * 
 * @example
 * ```tsx
 * const [loadState, getSprite] = useSpriteCache([
 *   '/assets/tilesets/grass.png',
 *   '/assets/tilesets/water.png',
 * ])
 * 
 * if (loadState.isLoading) return <LoadingBar progress={loadState.loaded / loadState.total} />
 * 
 * const image = getSprite('/assets/tilesets/grass.png')
 * ```
 */
export function useSpriteCache(spriteUrls: string[]): [
  SpriteLoadState,
  (url: string) => HTMLImageElement | null
] {
  const [loadState, setLoadState] = useState<SpriteLoadState>({
    loaded: 0,
    total: spriteUrls.length,
    isLoading: true,
    errors: [],
  })
  
  const urlsRef = useRef<string[]>([])
  
  useEffect(() => {
    // Only reload if URLs actually changed
    const urlsChanged = JSON.stringify(spriteUrls) !== JSON.stringify(urlsRef.current)
    if (!urlsChanged) return
    
    urlsRef.current = spriteUrls
    
    // Reset load state
    setLoadState({
      loaded: 0,
      total: spriteUrls.length,
      isLoading: true,
      errors: [],
    })
    
    // If no URLs, mark as complete
    if (spriteUrls.length === 0) {
      setLoadState({
        loaded: 0,
        total: 0,
        isLoading: false,
        errors: [],
      })
      return
    }
    
    // Load all sprites
    let loadedCount = 0
    const errors: string[] = []
    
    const loadPromises = spriteUrls.map(async (url) => {
      try {
        await loadSpriteImage(url)
        loadedCount++
        setLoadState((prev) => ({
          ...prev,
          loaded: loadedCount,
        }))
      } catch (error) {
        const errorMsg = `Failed to load ${url}: ${error}`
        console.error(errorMsg)
        errors.push(errorMsg)
        setLoadState((prev) => ({
          ...prev,
          errors: [...prev.errors, errorMsg],
        }))
      }
    })
    
    // Wait for all to complete
    Promise.all(loadPromises).finally(() => {
      setLoadState((prev) => ({
        ...prev,
        isLoading: false,
      }))
    })
  }, [spriteUrls])
  
  /**
   * Get a cached sprite image
   */
  const getSprite = (url: string): HTMLImageElement | null => {
    return spriteImageCache.get(url) || null
  }
  
  return [loadState, getSprite]
}

/**
 * Hook to get a single sprite (assumes it's already cached)
 * 
 * @param url Sprite sheet URL
 * @returns Cached image or null
 */
export function useSprite(url: string): HTMLImageElement | null {
  const [image, setImage] = useState<HTMLImageElement | null>(
    () => spriteImageCache.get(url) || null
  )
  
  useEffect(() => {
    // Check cache first
    const cached = spriteImageCache.get(url)
    if (cached) {
      setImage(cached)
      return
    }
    
    // Load if not cached
    loadSpriteImage(url)
      .then((img) => setImage(img))
      .catch((error) => {
        console.error(`Failed to load sprite: ${url}`, error)
        setImage(null)
      })
  }, [url])
  
  return image
}

/**
 * Clear the sprite cache (useful for testing/memory management)
 */
export function clearSpriteCache(): void {
  spriteImageCache.clear()
  loadingPromises.clear()
}

/**
 * Get cache statistics
 */
export function getSpriteCacheStats(): {
  cachedCount: number
  loadingCount: number
  cachedUrls: string[]
} {
  return {
    cachedCount: spriteImageCache.size,
    loadingCount: loadingPromises.size,
    cachedUrls: Array.from(spriteImageCache.keys()),
  }
}

