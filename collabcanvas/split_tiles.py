from PIL import Image
import os

# Configuration
TILE_SIZE = 16
VARIANTS = 16
TILESETS = ['water', 'grass', 'dirt', 'stone']

def split_tileset(tileset_name, input_dir, output_dir):
    """Split a 256x16 sprite sheet into 16 individual 16x16 tiles"""
    input_path = os.path.join(input_dir, f'{tileset_name}.png')
    
    if not os.path.exists(input_path):
        print(f"Error: {input_path} not found")
        return
    
    # Load the sprite sheet
    img = Image.open(input_path).convert('RGBA')
    print(f"\nProcessing {tileset_name}.png ({img.size[0]}x{img.size[1]})")
    
    # Create output directory for this tileset
    tileset_output_dir = os.path.join(output_dir, tileset_name)
    if not os.path.exists(tileset_output_dir):
        os.makedirs(tileset_output_dir)
    
    # Extract each 16x16 tile
    for variant in range(VARIANTS):
        x = variant * TILE_SIZE
        y = 0
        
        # Crop the tile
        tile = img.crop((x, y, x + TILE_SIZE, y + TILE_SIZE))
        
        # Save individual tile
        output_path = os.path.join(tileset_output_dir, f'{tileset_name}_{variant:02d}.png')
        tile.save(output_path)
        
        if variant == 0:
            print(f"  Extracting tiles to {tileset_output_dir}/")
    
    print(f"  ✓ Saved {VARIANTS} individual tiles")

def main():
    input_dir = 'public/assets/tilesets'
    output_dir = 'public/assets/tilesets'
    
    print("Splitting sprite sheets into individual tiles...")
    print("=" * 50)
    
    for tileset in TILESETS:
        split_tileset(tileset, input_dir, output_dir)
    
    print("\n" + "=" * 50)
    print("[SUCCESS] All tiles split successfully!")

if __name__ == '__main__':
    main()

