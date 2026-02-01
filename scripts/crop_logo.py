from PIL import Image
import sys
import os

def crop_image(image_path, output_path):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        
        # Get the bounding box of the non-zero regions
        bbox = img.getbbox()
        
        if bbox:
            cropped_img = img.crop(bbox)
            cropped_img.save(output_path)
            print(f"Successfully cropped {image_path} to {output_path}")
        else:
            print("Image is empty or transparent, nothing to crop.")
            
    except Exception as e:
        print(f"Error cropping image: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python crop.py <input> <output>")
        sys.exit(1)
        
    crop_image(sys.argv[1], sys.argv[2])
