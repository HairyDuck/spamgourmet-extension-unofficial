from PIL import Image
import os

# Input and output paths
input_path = 'icons/icon128.png'
output_path = 'images/icon128.png'

# Resize the image to exactly 128x128 pixels
def resize_image():
    try:
        img = Image.open(input_path)
        img_resized = img.resize((128, 128), Image.Resampling.LANCZOS)
        img_resized.save(output_path)
        print(f"Successfully resized image to 128x128 pixels and saved to {output_path}")
    except Exception as e:
        print(f"Error resizing image: {e}")

if __name__ == "__main__":
    resize_image() 