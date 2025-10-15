from PIL import Image

# Load the sprite sheet
img = Image.open('roguelikeSheet_transparent.png')
print(f'Image size: {img.size}')
print(f'With 17px spacing: {img.size[0]//17} x {img.size[1]//17} tiles')
print()

# Looking for 4x4 grids of similar colored tiles
# These would be auto-tiling sets
TILE_STEP = 17

# Scan through the image looking for 4x4 regions with consistent colors
print('Scanning for 4x4 auto-tile regions...')
print()

found_regions = []

for start_row in range(0, img.size[1]//TILE_STEP - 3):
    for start_col in range(0, img.size[0]//TILE_STEP - 3):
        # Check this 4x4 region
        colors = []
        has_content = True
        
        for row in range(4):
            for col in range(4):
                x = start_col * TILE_STEP + 8  # Center of tile
                y = start_row * TILE_STEP + 8
                pixel = img.getpixel((x + col * TILE_STEP, y + row * TILE_STEP))
                
                # Check if tile has content (not fully transparent)
                if pixel[3] < 10:  # Very transparent
                    has_content = False
                    break
                colors.append(pixel)
            
            if not has_content:
                break
        
        if has_content and len(colors) == 16:
            # Check if colors are similar (auto-tile set)
            avg_color = tuple(sum(c[i] for c in colors)//16 for i in range(3))
            x_coord = start_col * TILE_STEP
            y_coord = start_row * TILE_STEP
            
            # Identify color (rough guess)
            r, g, b = avg_color
            color_name = "unknown"
            if g > r and g > b and g > 100:
                color_name = "GREEN (grass?)"
            elif r > 100 and g > 100 and b < 100:
                color_name = "BROWN (dirt?)"
            elif r < 100 and g < 100 and b > 100:
                color_name = "BLUE (water?)"
            elif r > 100 and g > 100 and b > 100:
                color_name = "GRAY (stone?)"
            elif abs(r-g) < 30 and abs(g-b) < 30 and r > 80:
                color_name = "GRAY (stone?)"
            
            found_regions.append((start_col, start_row, avg_color, color_name))
            print(f'Found 4x4 at col={start_col}, row={start_row} -> coords=({x_coord}, {y_coord})')
            print(f'  Color: RGB{avg_color} - {color_name}')
            print()

print(f'\nFound {len(found_regions)} potential auto-tile regions')

