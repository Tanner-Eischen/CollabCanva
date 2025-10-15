from PIL import Image
import os

img = Image.open('roguelikeSheet_transparent.png')

# Extract first tile (water/cyan)
test1 = img.crop((0, 0, 16, 16))
test1.save('public/assets/tilesets/test_topleft.png')
print('Saved test_topleft.png (0,0)')

# Extract the green tile at col 5
test2 = img.crop((85, 0, 85+16, 16))
test2.save('public/assets/tilesets/test_green.png')
print('Saved test_green.png (85,0)')

# Extract from where I previously got "grass" 
test3 = img.crop((289, 425, 289+16, 425+16))
test3.save('public/assets/tilesets/test_previous.png')
print('Saved test_previous.png (289,425)')

print()
print('Check these 3 test files to see what tiles actually look like!')

