from PIL import Image
import os

# Tile configuration
TILE_SIZE = 16
MARGIN = 1
TILE_STEP = TILE_SIZE + MARGIN  # 17 pixels

# Tileset definitions with tile coordinates (not pixels)
TILESETS = {
    'water': {
        'start': (1, 1),
        'grid': (5, 6),  # 5 columns (1-5), 6 rows (1-6)
        'exclude': [],
    },
    'grass': {
        'start': (1, 7),
        'grid': (5, 12),  # 5 columns (1-5), 12 rows (7-18)
        'exclude': [],
    },
    'dirt': {
        'start': (6, 8),
        'grid': (5, 6),  # 5 columns (6-10), 6 rows (8-13)
        'exclude': [],
    },
    'stone': {
        'start': (6, 13),
        'grid': (5, 6),  # 5 columns (6-10), 6 rows (13-18)
        'exclude': [],
    },
}

def extract_tileset(source_path, output_dir):
    """Extract tilesets from sprite sheet"""
    if not os.path.exists(source_path):
        print(f"Error: Source image not found: {source_path}")
        return
    
    img = Image.open(source_path).convert('RGBA')
    print(f"Loaded sprite sheet: {img.size}")
    print()
    
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)
    
    for name, config in TILESETS.items():
        print(f"Extracting {name}...")
        start_col, start_row = config['start']
        cols, rows = config['grid']
        exclude = config['exclude']
        
        # Collect all valid tiles (non-excluded)
        tiles = []
        for row in range(rows):
            for col in range(cols):
                tile_col = start_col + col
                tile_row = start_row + row
                
                # Skip excluded tiles
                if (tile_col, tile_row) in exclude:
                    print(f"  Skipping excluded tile at ({tile_col}, {tile_row})")
                    continue
                
                # Calculate pixel position
                x = tile_col * TILE_STEP
                y = tile_row * TILE_STEP
                
                # Extract tile
                tile_img = img.crop((x, y, x + TILE_SIZE, y + TILE_SIZE))
                tiles.append(tile_img)
        
        print(f"  Collected {len(tiles)} tiles")
        
        # Take first 16 tiles for auto-tiling (if we have more, user can tell us which to use)
        if len(tiles) >= 16:
            tiles = tiles[:16]
            print(f"  Using first 16 tiles for auto-tiling")
        else:
            print(f"  WARNING: Only {len(tiles)} tiles available, need 16 for full auto-tiling!")
        
        # Create output directory for individual tiles
        tileset_dir = os.path.join(output_dir, name)
        if not os.path.exists(tileset_dir):
            os.makedirs(tileset_dir)
        
        # Save each tile individually
        for idx, tile in enumerate(tiles):
            tile_path = os.path.join(tileset_dir, f'{name}_{idx:02d}.png')
            tile.save(tile_path)
        
        # Fill remaining slots with first tile if needed
        if len(tiles) < 16:
            for idx in range(len(tiles), 16):
                tile_path = os.path.join(tileset_dir, f'{name}_{idx:02d}.png')
                tiles[0].save(tile_path)
        
        print(f"  Saved 16 individual tiles to: {tileset_dir}/")
        print()
    
    print("[SUCCESS] Extraction complete!")

if __name__ == '__main__':
    source_path = 'roguelikeSheet_transparent.png'
    output_dir = 'public/assets/tilesets'
    
    extract_tileset(source_path, output_dir)

