from PIL import Image

img = Image.open('roguelikeSheet_transparent.png')

# Found green at col 5 (x=85), let me check if there's a 4x4 grid there
print('Checking grid starting at column 5, row 0 (85, 0):')
for row in range(4):
    for col in range(4):
        x = 85 + col * 17
        y = 0 + row * 17
        pixel = img.getpixel((x + 8, y + 8))
        if pixel[3] > 100:
            print(f'  ({col},{row}) at ({x},{y}): RGB({pixel[0]}, {pixel[1]}, {pixel[2]})')
        else:
            print(f'  ({col},{row}): EMPTY')

print()
print('Checking other potential grass locations in first few rows:')
# Check several starting positions
test_positions = [
    (68, 0, 'col 4'),
    (102, 0, 'col 6'),
    (119, 0, 'col 7'),
    (136, 0, 'col 8'),
]

for start_x, start_y, label in test_positions:
    pixel = img.getpixel((start_x + 8, start_y + 8))
    if pixel[3] > 100:
        r, g, b = pixel[0], pixel[1], pixel[2]
        if g > 80:
            print(f'  {label} ({start_x},{start_y}): RGB({r},{g},{b})')
            # Check if it's a 4x4 grid
            is_grid = True
            for row in range(4):
                for col in range(4):
                    p = img.getpixel((start_x + col * 17 + 8, start_y + row * 17 + 8))
                    if p[3] < 100:
                        is_grid = False
            if is_grid:
                print(f'    ✓ This is a 4x4 grid!')

