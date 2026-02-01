from PIL import Image
import sys
import os

def crop_and_resize(image_path, output_path, scale_factor=5.0):
    try:
        img = Image.open(image_path)
        img = img.convert("RGBA")
        
        # Get the bounding box of the non-zero regions
        bbox = img.getbbox()
        
        if bbox:
            cropped_img = img.crop(bbox)
            
            # Calculate new size
            current_size = cropped_img.size
            new_size = (int(current_size[0] * scale_factor), int(current_size[1] * scale_factor))
            
            # Resize using LANCZOS for high quality downsampling (or upsampling)
            resized_img = cropped_img.resize(new_size, Image.Resampling.LANCZOS)
            
            resized_img.save(output_path)
            print(f"Successfully cropped and resized {image_path} to {output_path} (Scale: {scale_factor}x)")
        else:
            print("Image is empty or transparent, nothing to crop.")
            
    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("Usage: python process_icon.py <input> <output> [scale]")
        sys.exit(1)
        
    scale = 5.0
    if len(sys.argv) > 3:
        scale = float(sys.argv[3])
        
    crop_and_resize(sys.argv[1], sys.argv[2], scale)
