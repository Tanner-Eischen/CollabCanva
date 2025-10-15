"""
Kenney Micro Roguelike Tile Extractor
Extracts 16-tile auto-tiling sets from the sprite sheet
"""

from PIL import Image
import os

# Tile size in the sprite sheet (16x16 with 1px margin)
TILE_SIZE = 16
MARGIN = 1
TILE_STEP = TILE_SIZE + MARGIN  # 17 pixels to next tile

# Define the tile sets we need to extract
# Format: (name, start_x, start_y, layout)
# Layout: 'row' for 1x16, 'grid' for 4x4
# Coordinates based on the Kenney Micro Roguelike sprite sheet
# The auto-tiling sets are in the bottom-left area, arranged as 4x4 grids
# Auto-tiling sets are located in rows 25-26 (y=425-442)
TILE_SETS = {
    'grass': {
        'coords': (289, 425),  # Green grass tiles (col 17, row 25) - RGB(104, 156, 95)
        'layout': 'grid',  # 4x4 grid
    },
    'dirt': {
        'coords': (187, 425),  # Brown dirt tiles (col 11, row 25) - RGB(167, 113, 39)
        'layout': 'grid',  # 4x4 grid
    },
    'water': {
        'coords': (255, 425),  # Cyan water tiles (col 15, row 25) - RGB(71, 165, 141)
        'layout': 'grid',  # 4x4 grid
    },
    'stone': {
        'coords': (425, 425),  # Gray stone tiles (col 25, row 25) - RGB(197, 171, 140)
        'layout': 'grid',  # 4x4 grid
    },
}

def extract_tileset(source_image_path, output_dir):
    """
    Extract tilesets from the source sprite sheet
    """
    # Load the source image
    img = Image.open(source_image_path)
    
    # Create output directory if it doesn't exist
    os.makedirs(output_dir, exist_ok=True)
    
    print(f"Loading sprite sheet: {source_image_path}")
    print(f"Image size: {img.size}")
    
    for name, config in TILE_SETS.items():
        start_x, start_y = config['coords']
        layout = config['layout']
        
        print(f"\nExtracting {name}...")
        
        if layout == 'grid':
            # Create a 1x16 row layout for our sprite renderer
            # (Our code expects 1x16 layout with no margins)
            row_image = Image.new('RGBA', (16 * TILE_SIZE, TILE_SIZE), (0, 0, 0, 0))
            
            # Extract tiles from 4x4 grid, accounting for margins
            for idx in range(16):
                row = idx // 4
                col = idx % 4
                
                # Calculate source position with margins
                # Each tile is TILE_SIZE pixels, with MARGIN pixels between
                tile_x = start_x + (col * TILE_STEP)
                tile_y = start_y + (row * TILE_STEP)
                
                # Extract individual tile from source image
                tile = img.crop((
                    tile_x,
                    tile_y,
                    tile_x + TILE_SIZE,
                    tile_y + TILE_SIZE
                ))
                
                # Paste into row layout (no margins in output)
                row_image.paste(tile, (idx * TILE_SIZE, 0))
            
            # Save the output
            output_path = os.path.join(output_dir, f'{name}.png')
            row_image.save(output_path)
            print(f"  Saved: {output_path}")
            print(f"  Size: {row_image.size} ({16 * TILE_SIZE}x{TILE_SIZE})")
    
    print("\n[SUCCESS] Extraction complete!")
    print(f"Files saved to: {output_dir}")

if __name__ == '__main__':
    # Adjust these paths as needed
    source_path = 'roguelikeSheet_transparent.png'  # Your downloaded sprite sheet
    output_path = 'public/assets/tilesets'
    
    print("Kenney Micro Roguelike Tile Extractor")
    print("=" * 50)
    
    if not os.path.exists(source_path):
        print(f"\n❌ Error: Source image not found: {source_path}")
        print(f"\nCurrent directory: {os.getcwd()}")
        print("\nPlease:")
        print("1. Save the Kenney sprite sheet as 'roguelikeSheet_transparent.png'")
        print("2. Place it in the collabcanvas directory")
        print("3. Run this script again")
    else:
        extract_tileset(source_path, output_path)

