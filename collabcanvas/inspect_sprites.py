from PIL import Image

img = Image.open('roguelikeSheet_transparent.png')
print(f'Sheet size: {img.size}')
print()

# Check top-left 4x4 grid (should be grass if it's there)
print('Top-left 4x4 grid (0,0 to 68,68):')
for row in range(4):
    for col in range(4):
        x = col * 17
        y = row * 17
        pixel = img.getpixel((x + 8, y + 8))
        if pixel[3] > 100:  # Has content
            print(f'  ({col},{row}) at ({x},{y}): RGB({pixel[0]}, {pixel[1]}, {pixel[2]})')
        else:
            print(f'  ({col},{row}) at ({x},{y}): EMPTY')

print()
print('Looking for GREEN tiles (grass-like) in first few rows...')
for row in range(4):
    for col in range(10):
        x = col * 17 + 8
        y = row * 17 + 8
        pixel = img.getpixel((x, y))
        if pixel[3] > 100:
            r, g, b = pixel[0], pixel[1], pixel[2]
            # Green-ish: g > r and g > b
            if g > r and g > b and g > 80:
                print(f'  GREEN at col={col}, row={row} -> coords=({col*17}, {row*17}): RGB({r},{g},{b})')

