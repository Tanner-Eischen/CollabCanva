/**
 * AI Service - Client-side
 * Calls Firebase Functions for AI operations
 * PR-30: Task 1.2
 */

import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
import type { Asset, AssetAIContextPayload } from '../../types/asset';

export type AIRequest = {
  message: string;
  context: {
    canvasId: string;
    userId: string;
    selectedShapes: string[];
    viewport: {
      x: number;
      y: number;
      width: number;
      height: number;
      zoom: number;
    };
    mode: 'shapes' | 'tilemap';
    tilemapMeta?: any;
    availableAssets?: AssetAIContextPayload['availableAssets'];
    assetStats?: AssetAIContextPayload['assetStats'];
    tilesetSuggestions?: AssetAIContextPayload['tilesetSuggestions'];
  };
}

export type AIResponse = {
  success: boolean;
  message: string;
  toolResults?: any[];
  error?: string;
}

/**
 * Send AI command to Firebase Function
 */
export async function sendAICommand(request: AIRequest): Promise<AIResponse> {
  try {
    const aiCanvasCommand = httpsCallable<AIRequest, AIResponse>(
      functions,
      'aiCanvasCommand'
    );

    const result = await aiCanvasCommand(request);
    return result.data;

  } catch (error: any) {
    console.error('AI service error:', error);
    
    // Parse Firebase errors
    if (error.code === 'functions/unauthenticated') {
      return {
        success: false,
        message: '',
        error: 'You must be logged in to use AI features',
      };
    }

    if (error.code === 'functions/resource-exhausted') {
      return {
        success: false,
        message: '',
        error: 'Rate limit exceeded. Please wait a moment and try again.',
      };
    }

    if (error.code === 'functions/invalid-argument') {
      return {
        success: false,
        message: '',
        error: error.message || 'Invalid request',
      };
    }

    // Generic error
    return {
      success: false,
      message: '',
      error: error.message || 'AI service is temporarily unavailable',
    };
  }
}

/**
 * Check if AI features are enabled
 */
export function isAIEnabled(): boolean {
  return import.meta.env.VITE_AI_ENABLED !== 'false';
}

/**
 * AI Asset Analysis Helpers (PR-32)
 * Functions to integrate AI with asset management pipeline
 */

/**
 * Get AI suggestion for slicing a sprite sheet
 */
export async function getAISlicingSuggestion(
  width: number,
  height: number,
  imageUrl?: string
): Promise<{
  recommendation: 'AUTO_DETECTION_RECOMMENDED' | 'AUTO_DETECTION_WITH_SPACING' | 'MANUAL_SELECTION_REQUIRED';
  suggestions: Array<{
    tileSize: string;
    grid: string;
    spacing?: number;
    totalTiles: number;
    confidence: 'high' | 'medium' | 'low';
    reason: string;
  }>;
  advice: string;
} | null> {
  try {
    // Create a minimal context (AI doesn't need full canvas context for this)
    const request: AIRequest = {
      message: `Analyze this sprite sheet: ${width}×${height}px. Suggest how to slice it.`,
      context: {
        canvasId: 'asset-upload',
        userId: 'system',
        selectedShapes: [],
        viewport: { x: 0, y: 0, width: 800, height: 600, zoom: 1 },
        mode: 'shapes'
      }
    };

    const response = await sendAICommand(request);

    if (response.success && response.toolResults) {
      // Find the suggestSlicing tool result
      const slicingResult = response.toolResults.find(r => r.tool === 'suggestSlicing');
      if (slicingResult?.result?.data) {
        return slicingResult.result.data;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get AI slicing suggestion:', error);
    return null;
  }
}

/**
 * Get AI recommendation for which asset to use
 */
export async function getAIAssetRecommendation(
  userId: string,
  purpose: string,
  assetType: 'any' | 'tileset' | 'spritesheet' | 'image' = 'any'
): Promise<{
  recommendation: any;
  alternatives: any[];
  allAssets: any[];
} | null> {
  try {
    const request: AIRequest = {
      message: `Recommend asset for: ${purpose}`,
      context: {
        canvasId: 'asset-query',
        userId,
        selectedShapes: [],
        viewport: { x: 0, y: 0, width: 800, height: 600, zoom: 1 },
        mode: 'shapes'
      }
    };

    const response = await sendAICommand(request);

    if (response.success && response.toolResults) {
      const recommendResult = response.toolResults.find(r => r.tool === 'recommendAsset');
      if (recommendResult?.result?.data) {
        return recommendResult.result.data;
      }
    }

    return null;
  } catch (error) {
    console.error('Failed to get AI asset recommendation:', error);
    return null;
  }
}

/**
 * Notify AI that a new asset was uploaded
 * Returns AI's analysis and suggestions for using the asset
 */
export async function notifyAIAssetUploaded(
  userId: string,
  asset: Asset,
  summary?: Record<string, any>
): Promise<string | null> {
  try {
    const details: string[] = [];

    if (asset.type === 'tileset' && asset.tilesetMetadata) {
      const { tileWidth, tileHeight, tileCount, themes, materials, autoTileSystem, namedTiles } = asset.tilesetMetadata;
      details.push(
        `tileSize: ${tileWidth}x${tileHeight}`,
        `tiles: ${tileCount}`
      );
      if (autoTileSystem) details.push(`autoTile: ${autoTileSystem}`);
      if (themes?.length) details.push(`themes: ${themes.slice(0, 3).join(', ')}`);
      if (materials?.length) details.push(`materials: ${materials.slice(0, 3).join(', ')}`);
      if (namedTiles) {
        const namedCount = Object.keys(namedTiles).length;
        if (namedCount > 0) details.push(`namedTiles: ${namedCount}`);
      }
    }

    if (asset.type === 'spritesheet' && asset.spriteSheetMetadata?.spriteSelections) {
      details.push(`sprites: ${asset.spriteSheetMetadata.spriteSelections.length}`);
    }

    if (summary?.spriteSheet?.autoTileSystem) {
      details.push(`autoTileHint: ${summary.spriteSheet.autoTileSystem}`);
    }

    if (summary?.tileset?.autoTileSystem && !details.find(d => d.startsWith('autoTile'))) {
      details.push(`autoTile: ${summary.tileset.autoTileSystem}`);
    }

    const summaryText = details.length > 0 ? ` Summary: ${details.join(', ')}` : '';

    const request: AIRequest = {
      message: `A new ${asset.type} asset called "${asset.name}" (ID: ${asset.id}) was uploaded.${summaryText} Suggest how it can be used for tilemap painting or map prompts.`,
      context: {
        canvasId: 'asset-notification',
        userId,
        selectedShapes: [],
        viewport: { x: 0, y: 0, width: 800, height: 600, zoom: 1 },
        mode: 'shapes'
      }
    };

    const response = await sendAICommand(request);

    if (response.success) {
      return response.message;
    }

    return null;
  } catch (error) {
    console.error('Failed to notify AI of asset upload:', error);
    return null;
  }
}

