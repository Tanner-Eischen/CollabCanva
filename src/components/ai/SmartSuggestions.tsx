/**
 * Smart Suggestions Component
 * Context-aware AI suggestions for game development
 * PR-32: AI Game-Aware Enhancement
 */

import React, { useEffect, useState } from 'react';
import { useCanvas } from '../../hooks/useCanvas';
import { useAssetLibrary } from '../../hooks/useAssetLibrary';
import { useTilemap } from '../../hooks/useTilemap';
import { detectGameType } from '../../services/ai/gameTypeDetection';

interface Suggestion {
  id: string;
  text: string;
  prompt: string; // What to send to AI
  icon?: string;
  category: 'generate' | 'improve' | 'optimize' | 'complete';
}

interface SmartSuggestionsProps {
  onSuggestionClick: (prompt: string) => void;
  maxSuggestions?: number;
}

export const SmartSuggestions: React.FC<SmartSuggestionsProps> = ({
  onSuggestionClick,
  maxSuggestions = 4
}) => {
  const { shapes } = useCanvas({ canvasId: 'default', userId: 'user' });
  const { assets } = useAssetLibrary({ userId: 'user' });
  const { meta, tiles } = useTilemap({ canvasId: 'default', userId: 'user' });
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);

  useEffect(() => {
    const newSuggestions = generateSuggestions(
      shapes,
      tiles ? tiles.size : 0,
      meta,
      assets
    );

    setSuggestions(newSuggestions.slice(0, maxSuggestions));
  }, [shapes, tiles, meta, assets, maxSuggestions]);

  if (suggestions.length === 0) {
    return null;
  }

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-3 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-sm font-semibold text-gray-700">💡 Quick Actions</span>
      </div>
      
      <div className="flex flex-wrap gap-2">
        {suggestions.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.prompt)}
            className={`
              px-3 py-1.5 text-sm rounded-md transition-colors
              ${getCategoryColor(suggestion.category)}
              hover:scale-105 active:scale-95
            `}
            title={suggestion.prompt}
          >
            {suggestion.icon && <span className="mr-1">{suggestion.icon}</span>}
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
};

/**
 * Generate context-aware suggestions
 */
function generateSuggestions(
  objects: any[],
  tileCount: number,
  tilemap: any,
  assets: any[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const objectCount = objects.length;

  // Empty canvas suggestions
  if (objectCount === 0 && tileCount === 0) {
    suggestions.push({
      id: 'gen_terrain',
      text: 'Generate terrain',
      prompt: 'Generate a natural-looking terrain tilemap using Perlin noise',
      icon: '🌍',
      category: 'generate'
    });

    suggestions.push({
      id: 'gen_cave',
      text: 'Create cave system',
      prompt: 'Generate a cave dungeon using cellular automata',
      icon: '🕳️',
      category: 'generate'
    });

    suggestions.push({
      id: 'add_shapes',
      text: 'Add basic shapes',
      prompt: 'Add some basic shapes to get started',
      icon: '▢',
      category: 'generate'
    });

    return suggestions;
  }

  // Detect game type
  const detection = detectGameType(objects, tilemap, tileCount);

  // Suggestions based on game type
  if (detection.type === 'platformer') {
    if (tileCount === 0) {
      suggestions.push({
        id: 'gen_platforms',
        text: 'Generate platforms',
        prompt: 'Generate platform terrain suitable for a platformer game',
        icon: '🎮',
        category: 'generate'
      });
    }

    if (objectCount < 10) {
      suggestions.push({
        id: 'add_enemies',
        text: 'Add enemies',
        prompt: 'Place some enemy objects on the platforms',
        icon: '👾',
        category: 'complete'
      });

      suggestions.push({
        id: 'add_collectibles',
        text: 'Add collectibles',
        prompt: 'Add collectible items like coins throughout the level',
        icon: '💰',
        category: 'complete'
      });
    }

    if (objectCount > 5 && tileCount > 0) {
      suggestions.push({
        id: 'arrange_level',
        text: 'Improve layout',
        prompt: 'Analyze the level layout and suggest improvements for better gameplay',
        icon: '📐',
        category: 'improve'
      });
    }
  }

  if (detection.type === 'top-down') {
    if (tileCount === 0) {
      suggestions.push({
        id: 'gen_dungeon',
        text: 'Generate dungeon',
        prompt: 'Generate a dungeon layout with rooms and corridors',
        icon: '🏰',
        category: 'generate'
      });
    }

    if (tileCount > 0 && objectCount < 5) {
      suggestions.push({
        id: 'add_doors',
        text: 'Add doors',
        prompt: 'Place doors between rooms in the dungeon',
        icon: '🚪',
        category: 'complete'
      });

      suggestions.push({
        id: 'add_npcs',
        text: 'Add NPCs',
        prompt: 'Place some NPCs or enemies in the dungeon rooms',
        icon: '🧙',
        category: 'complete'
      });
    }
  }

  if (detection.type === 'puzzle') {
    if (objectCount < 20) {
      suggestions.push({
        id: 'create_grid',
        text: 'Create puzzle grid',
        prompt: 'Create a regular grid for puzzle pieces',
        icon: '🧩',
        category: 'generate'
      });
    }
  }

  // General suggestions based on content
  if (tileCount > 0 && tileCount < 100) {
    suggestions.push({
      id: 'expand_tilemap',
      text: 'Expand tilemap',
      prompt: 'Expand the current tilemap with more varied terrain',
      icon: '➕',
      category: 'improve'
    });
  }

  // Performance suggestions
  if (objectCount > 500) {
    suggestions.push({
      id: 'optimize',
      text: 'Optimize performance',
      prompt: 'Analyze performance and suggest optimizations',
      icon: '⚡',
      category: 'optimize'
    });
  }

  // Asset suggestions
  if (assets.length > 0 && tileCount > 0) {
    suggestions.push({
      id: 'add_decorations',
      text: 'Add decorations',
      prompt: 'Add decorative elements using available assets to make the scene more interesting',
      icon: '🎨',
      category: 'improve'
    });
  }

  // Path/river suggestion
  if (tileCount > 100 && detection.type === 'top-down') {
    suggestions.push({
      id: 'add_river',
      text: 'Add river/path',
      prompt: 'Add a winding river or path through the terrain',
      icon: '🌊',
      category: 'improve'
    });
  }

  // Completion suggestions
  if (objectCount > 20 && tileCount > 100) {
    suggestions.push({
      id: 'analyze_scene',
      text: 'Analyze scene',
      prompt: 'Analyze the current scene and tell me what\'s missing',
      icon: '🔍',
      category: 'improve'
    });
  }

  return suggestions;
}

/**
 * Get color class for suggestion category
 */
function getCategoryColor(category: Suggestion['category']): string {
  switch (category) {
    case 'generate':
      return 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200';
    case 'improve':
      return 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200';
    case 'optimize':
      return 'bg-orange-50 text-orange-700 hover:bg-orange-100 border border-orange-200';
    case 'complete':
      return 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200';
    default:
      return 'bg-gray-50 text-gray-700 hover:bg-gray-100 border border-gray-200';
  }
}


