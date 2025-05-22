import base64
from io import BytesIO
from PIL import Image, ImageDraw, ImageFont
import os

# Create a simple company logo
img = Image.new('RGBA', (300, 100), color=(255, 255, 255, 0))
draw = ImageDraw.Draw(img)

# Draw a blue rectangle for the logo background
draw.rectangle([(10, 10), (290, 90)], fill=(30, 58, 138))  # Dark blue

# Try to use a font (will use default if not found)
try:
    font = ImageFont.truetype("Arial", 20)
    small_font = ImageFont.truetype("Arial", 16)
except:
    font = ImageFont.load_default()
    small_font = ImageFont.load_default()

# Draw company name in white
draw.text((20, 35), 'EMPLOYEE MANAGEMENT', fill=(255, 255, 255), font=font)
draw.text((20, 60), 'SYSTEM', fill=(255, 255, 255), font=small_font)

# Save the image
img.save('static/company_logo.png')
print('Created company logo at static/company_logo.png') 